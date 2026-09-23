const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loader } = require('./negotiation-loader.cjs');
const crypto = require('node:crypto');

function harness() {
  const id=crypto.randomUUID(), installation=crypto.randomUUID(), expiry=new Date(Date.now()+1200000).toISOString();
  const c={id,installation_id:installation,state:'pending',provider_state:'unstarted',provider_link_id:null,provider_url:null,order_id:null,payment_id:null,
    expires_at:expiry,items:[{productId:'arctic-wave',quantity:1}],quote:{amountMinor:75000,shippingMinor:0,currency:'INR',cart:{destination:{country:'IN',postalCode:'560001'}}}};
  const customer={name:'Test Buyer',email:'test@example.test',phone:'9999999999',address:'Test address',city:'Bengaluru',state:'Karnataka',pincode:'560001'};
  let link=null, createCount=0, failAfterCreate=false, rejectCreate=false, sendFails=false, enabled=true, partialRefund=0;
  const bodies=[], sent=[], events=[];
  const db={from(table){let change={},filters={};return {update(v){change=v;return this;},eq(k,v){filters[k]=v;return this;},then(resolve){
    if(table==='negotiation_checkouts')Object.assign(c,change);
    if(table==='negotiation_outbox'){const e=events.find(e=>e.event_id===filters.event_id);Object.assign(e,change);}
    return Promise.resolve(resolve({error:null}));
  }};}};
  async function rpc(name,args){
    if(name==='prepare_negotiation_payment'){
      if(c.state!=='pending'||Date.parse(c.expires_at)<=Date.now())throw Error('Expired');
      const claimed=c.provider_state==='unstarted';if(claimed){c.provider_state='creating';c.order_id='order-local';}return {claimed};
    }
    if(name==='apply_negotiation_state'){
      const changed=c.state!==args.p_state;c.state=args.p_state;c.payment_id=args.p_payment;
      const type='checkout.'+args.p_state;if(!events.some(e=>e.event_type===type))events.push({event_id:crypto.randomUUID(),checkout_id:id,event_type:type,occurred_at:new Date().toISOString(),lease_token:'lease'});
      return changed;
    }
    if(name==='claim_negotiation_event')return events.find(e=>!e.delivered_at)||null;
    throw Error(name);
  }
  const load=loader({
    '@/lib/supabaseAdmin':{getSupabaseAdmin:()=>db},
    './checkout':{checkoutRecord:async()=>structuredClone(c),customerSchema:{parse:v=>v},rpc},
    './security':{assertCheckoutEnabled(){if(!enabled)throw Error('Paused');},identity:()=>({installationId:installation,secret:'test-only-secret'})},
    './facts':{PLATFORM_ORIGIN:'https://eon-negotiation.vercel.app'},
    './vendor/handler.mjs':{sendConnectorEvent:async value=>{sent.push(value);if(sendFails)throw Error('Retry');}},
    'next/server':{after:()=>{}},'@/lib/delhivery':{},'@/lib/email':{},'@/lib/order':{},
  },{RAZORPAY_KEY_ID:'test-key',RAZORPAY_KEY_SECRET:'test-secret'},{fetch:async(url,options)=>{
    assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');
    if(options.method==='POST'&&url.endsWith('/payment_links')){
      createCount++;const body=JSON.parse(options.body);bodies.push(body);
      if(rejectCreate)return Response.json({error:{description:rejectCreate}},{status:400});
      link={id:'plink_test',short_url:'https://rzp.io/test',status:'created',amount_paid:0,...body};
      if(failAfterCreate)throw Error('Network response lost');
      return Response.json(link);
    }
    if(url.includes('payment_links?reference_id='))return Response.json({payment_links:link?[link]:[]});
    if(url.endsWith('/payment_links/plink_test/cancel')){link.status='cancelled';return Response.json(link);}
    if(url.endsWith('/payment_links/plink_test'))return Response.json(link);
    if(url.endsWith('/payments/pay_test'))return Response.json({id:'pay_test',order_id:'order_test',amount:75000,currency:'INR',status:partialRefund===75000?'refunded':'captured',amount_refunded:partialRefund});
    throw Error('Unexpected provider call');
  }});
  return {api:load('lib/negotiation/payments.ts'),c,customer,bodies,sent,events,get count(){return createCount},get link(){return link},
    timeout(){failAfterCreate=true;},reject(description="timestamp must be atleast 15 minutes in future"){rejectCreate=description;},failEvents(v){sendFails=v;},pause(){enabled=false;},refund(value){partialRefund=value;}};
}
test('provider checkout uses exact approved total, expiry, no coupon or partial payment; retries reuse link',async()=>{
  const h=harness();
  await h.api.beginPayment(h.c.id,h.customer);await h.api.beginPayment(h.c.id,h.customer);
  assert.equal(h.count,1);assert.equal(h.bodies[0].amount,75000);assert.equal(h.bodies[0].accept_partial,false);
  assert.equal(h.bodies[0].expire_by,Math.floor(Date.parse(h.c.expires_at)/1000));
  assert.equal(h.bodies[0].reference_id,h.c.id);assert.equal(h.bodies[0].coupon,undefined);
  assert.equal(h.bodies[0].offer_id,undefined);assert.equal(h.bodies[0].notify.email,false);
  await assert.rejects(h.api.beginPayment(h.c.id,{...h.customer,pincode:'110001'}));
});
test('lost provider response recovers by unique reference without duplicate external or store order',async()=>{
  const h=harness();h.timeout();
  await assert.rejects(h.api.beginPayment(h.c.id,h.customer));assert.equal(h.c.provider_state,'creating');
  const recovered=await h.api.beginPayment(h.c.id,h.customer);
  assert.equal(recovered.paymentUrl,'https://rzp.io/test');assert.equal(h.count,1);assert.equal(h.c.provider_state,'ready');
});
test('definitive provider expiry rejection cancels safely without extending the quote',async()=>{
  const h=harness();h.reject();const expiry=h.c.expires_at;
  await assert.rejects(h.api.beginPayment(h.c.id,h.customer));
  assert.equal(h.c.state,'cancelled');assert.equal(h.c.expires_at,expiry);assert.equal(h.link,null);
  assert.equal(h.sent[0].event.type,'checkout.cancelled');
  await assert.rejects(h.api.beginPayment(h.c.id,h.customer));assert.equal(h.count,1);
});
test('expired and paused checkout fail before provider write; malformed link never accepted',async()=>{
  const h=harness();h.c.expires_at=new Date(Date.now()-1000).toISOString();
  await assert.rejects(h.api.beginPayment(h.c.id,h.customer));assert.equal(h.count,0);
  const p=harness();p.pause();await assert.rejects(p.api.beginPayment(p.c.id,p.customer));assert.equal(p.count,0);
  const good=harness();await good.api.beginPayment(good.c.id,good.customer);
  for(const delta of [{amount:1},{reference_id:crypto.randomUUID()},{accept_partial:true},{expire_by:1},{currency:'USD'},{short_url:'https://evil.test'}]){
    assert.throws(()=>good.api.validateLink(good.c,{...good.link,...delta}));
  }
});
test('capture independently fetched, payment events retain stable IDs across failure and retry',async()=>{
  const h=harness();await h.api.beginPayment(h.c.id,h.customer);
  Object.assign(h.link,{status:'paid',amount_paid:75000,payments:[{payment_id:'pay_test',status:'captured'}]});
  h.failEvents(true);await assert.rejects(h.api.reconcile(h.c.id));assert.equal(h.c.state,'paid');
  const eventId=h.sent[0].event.eventId;
  h.events[0].occurred_at=h.events[0].occurred_at.replace('Z','+00:00');
  h.failEvents(false);h.pause();
  assert.equal((await h.api.reconcile(h.c.id)).status,'paid');assert.equal(h.sent[1].event.eventId,eventId);
  assert.equal(h.sent[1].event.type,'checkout.paid');assert.equal(h.sent[1].event.externalId,h.c.id);
  assert.ok(h.sent[1].event.occurredAt.endsWith('Z'));
  h.refund(10000);assert.equal((await h.api.reconcile(h.c.id)).status,'paid');
  h.refund(75000);assert.equal((await h.api.reconcile(h.c.id)).status,'refunded');
  assert.equal(h.sent.at(-1).event.type,'checkout.refunded');
});
test('payment mismatch never becomes paid; cancellation confirms provider shutdown',async()=>{
  const h=harness();await h.api.beginPayment(h.c.id,h.customer);
  Object.assign(h.link,{status:'paid',amount_paid:74000});
  await assert.rejects(h.api.reconcile(h.c.id));assert.equal(h.c.state,'pending');assert.equal(h.sent.length,0);
  Object.assign(h.link,{status:'created',amount_paid:0});await h.api.cancelCheckout(h.c.id);
  assert.equal(h.link.status,'cancelled');assert.equal(h.c.state,'cancelled');assert.equal(h.sent[0].event.type,'checkout.cancelled');
});

test('short payment window rejects before reserving an order or calling provider; ready link still recovers',async()=>{
  const h=harness();h.c.expires_at=new Date(Date.now()+899000).toISOString();
  await assert.rejects(h.api.beginPayment(h.c.id,h.customer),e=>e.checkoutCode==='PAYMENT_WINDOW');
  assert.equal(h.count,0);assert.equal(h.c.provider_state,'unstarted');assert.equal(h.c.order_id,null);
  assert.equal(h.c.state,'pending');
  const ready=harness();await ready.api.beginPayment(ready.c.id,ready.customer);
  ready.c.expires_at=new Date(Date.now()+600000).toISOString();ready.link.expire_by=Math.floor(Date.parse(ready.c.expires_at)/1000);
  assert.equal((await ready.api.beginPayment(ready.c.id,ready.customer)).paymentUrl,'https://rzp.io/test');
  assert.equal(ready.count,1);
});

test('duplicate provider reference is recoverable and never treated as safe cancellation',async()=>{
  const h=harness();h.reject('payment link creation with reference ID already attempted');
  await assert.rejects(h.api.beginPayment(h.c.id,h.customer),e=>e.checkoutCode==='PAYMENT_RECOVERY');
  assert.equal(h.c.state,'pending');assert.equal(h.c.provider_state,'creating');assert.equal(h.sent.length,0);
  await assert.rejects(h.api.beginPayment(h.c.id,h.customer));assert.equal(h.count,1);
});
