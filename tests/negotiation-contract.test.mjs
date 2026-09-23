import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac,randomUUID} from 'node:crypto';
import {createConnectorHandler} from '../lib/negotiation/vendor/handler.mjs';
import {validateConnectorResponse} from '../lib/negotiation/vendor/contract.mjs';
import {loader} from './negotiation-loader.cjs';

const workspaceId='11111111-1111-4111-8111-111111111111',installationId='22222222-2222-4222-8222-222222222222',secret='test-only-connector-secret'.repeat(2);
const load=loader(),{products}=load('lib/products.ts'),{cartFacts,storeTerms}=load('lib/negotiation/facts.ts');
const cart={currency:'INR',lines:[{productId:'arctic-wave',variantId:'arctic-wave:50ml',quantity:1}],promotionCodes:['EON20'],paymentMethod:'prepaid',destination:{country:'IN',postalCode:'560001'}};
function handler(bad=false) {
  const stocks=products.map(p=>({product_key:p.id,size:'50ml',available:true,available_stock:10,storefront_enabled:true}));
  const reader=loader({
    '@/lib/supabaseAdmin':{getSupabaseAdmin:()=>({rpc:async()=>({data:stocks,error:null})})},
    './pricing':{pilotPricing:async()=>({regularMinor:124900,sellingMinor:99900,taxBasis:'inclusive',source:'store_product_pricing'})},
    './facts':{PILOT_PRODUCT:'arctic-wave',storeTerms},
  })('lib/negotiation/readOnly.ts');
  return createConnectorHandler({workspaceId,installationId,secret,claimNonce:async()=>true,
    capabilities:async()=>({businessModels:['physical_goods'],catalog:true,inventory:true,economics:true,sales:false,shipping:'flat',checkout:true,reconciliation:true,events:true}),
    listCatalog:reader.listCatalog,getContext:async c=>{const facts=cartFacts(c,10,true);if(bad)delete facts.promotions.evaluation;return facts;},
    createCheckout:async()=>({status:'created',externalId:randomUUID(),checkoutUrl:'https://www.houseofeon.in/checkout/negotiated/test#token'}),
    reconcile:async id=>({externalId:id,status:'paid'}),
  });
}
async function request(handle,operation,input={}) {
  const body=JSON.stringify({schemaVersion:'3',workspaceId,installationId,operation,...input}),timestamp=String(Date.now()),nonce=randomUUID();
  return handle(new Request('https://www.houseofeon.in/api/negotiation/v3',{method:'POST',body,headers:{Authorization:`Bearer ${secret}`,
    'X-Negotiation-Timestamp':timestamp,'X-Negotiation-Nonce':nonce,'X-Negotiation-Signature':createHmac('sha256',secret).update(`${timestamp}\n${nonce}\n${body}`).digest('hex')}}));
}
test('signed extended catalog and exact coupon context pass v3 envelope contract',async()=>{
  const handle=handler();
  const catalog=await request(handle,'catalog',{limit:100});assert.equal(catalog.status,200);
  const body=await catalog.json();validateConnectorResponse(body,{operation:'catalog',workspaceId,installationId});
  const arctic=body.items.find(p=>p.productId==='arctic-wave');
  assert.equal(arctic.priceMinor,99900);assert.equal(arctic.pricing.regularMinor,124900);
  assert.equal(body.storeTerms.shipping.customerChargeMinor,0);
  const context=await request(handle,'context',{cart});assert.equal(context.status,200);
  const facts=await context.json();assert.equal(facts.promotions.evaluation.totalMinor,79900);
  assert.equal(facts.line.unitPriceMinor,99900);assert.equal(facts.line.approvedFloorMinor,null);
  const repeat=await request(handle,'context',{cart});assert.equal((await repeat.json()).revision,facts.revision);
});
test('a signed coupon request without an exact evaluation fails closed',async()=>{
  assert.equal((await request(handler(true),'context',{cart})).status,503);
});
