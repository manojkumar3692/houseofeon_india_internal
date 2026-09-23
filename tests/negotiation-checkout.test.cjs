const {test}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {loader}=require('./negotiation-loader.cjs');
const identity={installationId:'22222222-2222-4222-8222-222222222222',workspaceId:'11111111-1111-4111-8111-111111111111',secret:'test-secret-'.repeat(4)};
const cart={currency:'INR',lines:[{productId:'arctic-wave',variantId:'arctic-wave:50ml',quantity:1}],promotionCodes:['EON20'],paymentMethod:'prepaid',destination:{country:'IN',postalCode:'560001'}};
function service() {
  let enabled=true,stock=5;let record=null;
  const db={from(){return {select(){return this;},eq(){return this;},async maybeSingle(){return {data:record?{id:record.id}:null,error:null};}};},async rpc(_name,args){
    if(record&&JSON.stringify(record)!==JSON.stringify(args.p_quote))return {error:true};
    const status=record?'already_created':'created';record=args.p_quote;return {data:{id:record.id,status},error:null};
  }};
  const api=loader({'@/lib/supabaseAdmin':{getSupabaseAdmin:()=>db},'./readOnly':{availableStock:async()=>stock},
    './pricing':{...loader()('lib/pricing.ts'),pilotPricing:async()=>({sellingMinor:99900})},
    './security':{assertCheckoutEnabled:()=>{if(!enabled)throw Error('Paused');},checkoutEnabled:()=>enabled,identity:()=>identity,checkoutToken:()=> 'test-token'},
  })('lib/negotiation/checkout.ts');
  return {api,setStock:v=>stock=v,pause:()=>enabled=false};
}
test('fresh signed context produces exact checkout; retry uses reserved snapshot and never retail pricing',async()=>{
  const h=service(),context=await h.api.getContext(cart);
  const q={id:crypto.randomUUID(),cart,amountMinor:75000,shippingMinor:0,currency:'INR',expiresAt:new Date(Date.now()+1200000).toISOString(),contextRevision:context.revision};
  const first=await h.api.createCheckout(q,'same-key');assert.equal(first.status,'created');
  assert.equal(first.externalId,q.id);assert.match(first.checkoutUrl,/\/checkout\/negotiated\//);
  assert.ok(first.checkoutUrl.endsWith('#test-token'));
  h.setStock(4);assert.equal((await h.api.createCheckout(q,'same-key')).status,'already_created');
  await assert.rejects(h.api.createCheckout({...q,amountMinor:74000},'same-key'));
});
test('stale context, price worse than coupon, changed items, COD, shipping, quantity and expiry are rejected',async()=>{
  const h=service(),context=await h.api.getContext(cart);
  const q={id:crypto.randomUUID(),cart,amountMinor:75000,shippingMinor:0,currency:'INR',expiresAt:new Date(Date.now()+1200000).toISOString(),contextRevision:context.revision};
  const edits=[{contextRevision:'stale'},{amountMinor:80000},{amountMinor:0},{shippingMinor:100},{currency:'USD'},
    {expiresAt:new Date(Date.now()-1).toISOString()},
    {cart:{...cart,paymentMethod:'partial_cod'}},
    {cart:{...cart,lines:[{...cart.lines[0],quantity:2}]}},
    {cart:{...cart,lines:[{...cart.lines[0],productId:'rank'}]}},
  ];
  for(const edit of edits)await assert.rejects(h.api.createCheckout({...q,...edit},'key'));
  h.setStock(0);await assert.rejects(h.api.createCheckout(q,'key'));
  h.pause();await assert.rejects(h.api.createCheckout(q,'key'));
});
test('checkout access token binds installation and quote; public input cannot add coupons or amounts',()=>{
  const env={NEGOTIATION_WORKSPACE_ID:identity.workspaceId,NEGOTIATION_INSTALLATION_ID:identity.installationId,NEGOTIATION_CONNECTOR_SECRET:identity.secret};
  const security=loader({},env)('lib/negotiation/security.ts'),id=crypto.randomUUID();
  const token=security.checkoutToken(id);
  security.authorizeCheckout(id,new Request('https://store.test',{headers:{Authorization:`Bearer ${token}`}}));
  assert.throws(()=>security.authorizeCheckout(crypto.randomUUID(),new Request('https://store.test',{headers:{Authorization:`Bearer ${token}`}})));
  assert.throws(()=>security.authorizeCheckout(id,new Request('https://store.test')));
  const c=service().api.customerSchema;
  const customer={name:'Buyer',phone:'9999999999',email:'buyer@example.test',address:'Test street',city:'Bengaluru',state:'Karnataka',pincode:'560001'};
  assert.ok(c.parse(customer));
  for(const extra of [{couponCode:'EON20'},{amountMinor:1},{items:[]},{paymentType:'partial_cod'}])assert.throws(()=>c.parse({...customer,...extra}));
});
