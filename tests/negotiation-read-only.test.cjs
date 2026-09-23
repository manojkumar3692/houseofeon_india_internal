const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(path, imports = {}, env = {}) {
  const box = {exports:{}, process:{env}, Response, console, require(name) {
    if (name === 'server-only') return {};
    if (name in imports) return imports[name];
    throw Error(`Unexpected import: ${name}`);
  }};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'), {
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
  }).outputText, box);
  return box.exports;
}
const {connectorConfig} = load('lib/negotiation/config.ts');
const base = { NEGOTIATION_CONNECTOR_ENABLED:'true', NEGOTIATION_WORKSPACE_ID:'11111111-1111-4111-8111-111111111111',
  NEGOTIATION_INSTALLATION_ID:'22222222-2222-4222-8222-222222222222', NEGOTIATION_CONNECTOR_SECRET:'test-only-secret-'.repeat(3), VERCEL_ENV:'production' };
test('configuration supports production and legacy secrets without silent conflicts',()=>{
  assert.ok(connectorConfig(base));
  assert.ok(connectorConfig({...base,NEGOTIATION_CONNECTOR_SECRET:undefined,NEGOTIATION_INSTALLATION_SECRET:base.NEGOTIATION_CONNECTOR_SECRET}));
  for(const change of [{NEGOTIATION_CONNECTOR_ENABLED:'false'}, {NEGOTIATION_INSTALLATION_SECRET:'different'},
    {NEGOTIATION_WORKSPACE_ID:'bad'}, {NEGOTIATION_INSTALLATION_ID:''}, {NEGOTIATION_CONNECTOR_SECRET:'short'}]) {
    assert.equal(connectorConfig({...base,...change}),null);
  }
});
const catalog = [{id:'a',name:'A',size:'50ml',price:1249},{id:'b',name:'B',size:'50ml',price:1249}];
const stocks = catalog.map(p=>({product_key:p.id,size:'50ml',available_stock:4,available:true,storefront_enabled:true}));
function reader(data = stocks,error=null) {
  return load('lib/negotiation/readOnly.ts',{
    '@/lib/products':{products:catalog},
    './facts':{storeTerms:()=>({shipping:{mode:'free',customerChargeMinor:0},promotions:{status:'known',offers:[]}}),PILOT_PRODUCT:'arctic-wave'},
    './pricing':{pilotPricing:async()=>({regularMinor:124900,sellingMinor:99900,taxBasis:'inclusive',source:'database'})},
    '@/lib/supabaseAdmin':{getSupabaseAdmin:()=>({rpc:async name=>{
      assert.equal(name,'get_storefront_inventory_availability'); return {data,error};
    }})}
  });
}
test('catalog paginates all 50ml products with real stock and no staging or payment configuration',async()=>{
  const first = await reader().listCatalog({cursor:null,limit:1});
  assert.equal(first.items[0].productId,'a'); assert.equal(first.items[0].priceMinor,99900);
  assert.equal(first.items[0].availableToSell,4); assert.equal(first.nextCursor,'1');
  const second = await reader().listCatalog({cursor:first.nextCursor,limit:1});
  assert.equal(second.items[0].productId,'b'); assert.equal(second.nextCursor,null);
});
test('catalog never fabricates missing inventory and respects manual disable',async()=>{
  for(const [data,error] of [[null,null],[[],null],[stocks,true],[[...stocks,stocks[0]],null],
    [[{...stocks[0],available_stock:null},stocks[1]],null]]) {
    await assert.rejects(reader(data,error).listCatalog({cursor:null,limit:50}));
  }
  const result=await reader([{...stocks[0],storefront_enabled:false},stocks[1]]).listCatalog({cursor:null,limit:50});
  assert.equal(result.items[0].availableToSell,0);
  for(const cursor of ['bad','-1','01','9007199254740992']) await assert.rejects(reader().listCatalog({cursor,limit:50}));
});
test('production route keeps identity and wires signed commercial operations behind checkout switch',async()=>{
  let options;
  const {POST}=load('app/api/negotiation/v3/route.ts',{
    '@/lib/negotiation/config':{connectorConfig},
    '@/lib/negotiation/readOnly':reader(),
    '@/lib/negotiation/checkout':{getContext:async()=>({}),createCheckout:async()=>({})},
    '@/lib/negotiation/payments':{reconcile:async()=>({})},
    '@/lib/negotiation/security':{checkoutEnabled:()=>false},
    '@/lib/negotiation/vendor/handler.mjs':{createConnectorHandler:opts=>{options=opts;return async()=>Response.json({ok:true});}},
    '@/lib/supabaseAdmin':{getSupabaseAdmin:()=>({rpc:async(name,args)=>{
      assert.equal(name,'claim_negotiation_nonce');assert.equal(args.p_installation_id,base.NEGOTIATION_INSTALLATION_ID);
      return {data:true,error:null};
    }})}
  },base);
  assert.equal((await POST({})).status,200);
  const caps=await options.capabilities();
  for(const key of ['checkout','sales']) assert.equal(caps[key],false);
  assert.equal(caps.economics,true);
  assert.equal(caps.catalog,true); assert.equal(caps.inventory,true);
  assert.equal(caps.events,true); assert.equal(caps.reconciliation,true);
  for(const fn of ['getContext','createCheckout','reconcile']) assert.equal(typeof options[fn],'function');
  assert.equal(await options.claimNonce('test',new Date()),true);
});
test('event worker rejects unauthenticated browsers',async()=>{
  const {POST}=load('app/api/negotiation/events/route.ts',{
    '@/lib/adminAuth':{assertAdmin:()=>{throw Error('Unauthorized')}},
    '@/lib/supabaseAdmin':{}, '@/lib/negotiation/security':{}, '@/lib/negotiation/payments':{}
  },base);
  assert.equal((await POST({})).status,401);
});
