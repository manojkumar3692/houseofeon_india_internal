const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loader } = require('./negotiation-loader.cjs');
const load = loader();
const { products } = load('lib/products.ts');
const { calculateOrder } = load('lib/order.ts');
const { getCatalogOffer } = load('lib/catalogOffer.ts');
const { evaluateCart, cartFacts, storeTerms } = load('lib/negotiation/facts.ts');
const cart = { currency: 'INR', lines: [{ productId: 'arctic-wave', variantId: 'arctic-wave:50ml', quantity: 1 }],
  promotionCodes: [], paymentMethod: 'prepaid', destination: { country: 'IN', postalCode: '560001' } };

test('approved six perfume prices; exact normal checkout and coupon rounding', () => {
  for (const product of products) {
    const order = calculateOrder([{ productId: product.id, quantity: 1 }]);
    assert.equal(product.mrp, 1249); assert.equal(product.price, 999);
    assert.equal(order.amountInPaise, 99900);
    assert.equal(getCatalogOffer(product.price,product.id).price, 999);
  }
  const e = evaluateCart({ ...cart, promotionCodes: ['EON20'] });
  assert.equal(e.totalMinor, 79900); assert.equal(e.itemSubtotalMinor, 79900); assert.equal(e.shippingMinor, 0);
  assert.equal(e.combinesWithNegotiation, false);
  assert.equal(evaluateCart(cart).totalMinor, 99900);
});
test('bundle remains unchanged, coupons fail for bundle, unknown, duplicate and multiple codes', () => {
  const bundle = { ...cart, lines: [{ ...cart.lines[0], quantity: 2 }], promotionCodes: ['EON20'] };
  assert.equal(evaluateCart(bundle).totalMinor, 159800);
  assert.deepEqual([...evaluateCart(bundle).rejectedCodes], ['EON20']);
  for (const codes of [['ONLYADMIN'], ['UNKNOWN'], ['EON20', 'ONLYADMIN'], ['TRIAL-123']]) {
    const e = evaluateCart({ ...cart, promotionCodes: codes });
    assert.equal(e.totalMinor, 99900); assert.deepEqual([...e.rejectedCodes], codes);
    assert.equal(cartFacts({ ...cart, promotionCodes: codes }, 5, true).checkoutSupported, false);
  }
  assert.throws(() => evaluateCart({ ...cart, promotionCodes: ['EON20', 'EON20'] }));
  assert.equal(evaluateCart({ ...cart, promotionCodes: [' eon20 '] }).totalMinor, 79900);
});
test('facts never invent costs/floors, stable revisions bind all economic inputs', () => {
  const a = cartFacts(cart, 5, true), b = cartFacts(cart, 5, true);
  assert.equal(a.revision, b.revision); assert.equal(a.line.unitPriceMinor, 99900);
  assert.equal(a.line.approvedFloorMinor, null); assert.equal(a.shipping.merchantCostMinor, null);
  assert.equal(a.payment.feeMinor, null);
  assert.equal(a.shipping.customerChargeMinor, 0); assert.equal(a.sales, null); assert.equal(a.checkoutSupported, true);
  assert.notEqual(a.revision, cartFacts(cart, 4, true).revision);
  assert.notEqual(a.revision, cartFacts({ ...cart, promotionCodes: ['EON20'] }, 5, true).revision);
  assert.equal(cartFacts(cart, 5, false).checkoutSupported, false);
  assert.equal(cartFacts({ ...cart, paymentMethod: 'cod' }, 5, true).checkoutSupported, false);
  assert.equal(cartFacts({ ...cart, destination: null }, 5, true).checkoutSupported, false);
  assert.equal(cartFacts({ ...cart, destination: { country: 'US', postalCode: '560001' } }, 5, true).checkoutSupported, false);
  assert.throws(() => cartFacts({ ...cart, lines: [{ ...cart.lines[0], variantId: 'other' }] }, 5, true));
  assert.match(storeTerms().promotions.offers[0].description, /nearest whole INR/);
  assert.equal(storeTerms().promotions.offers[0].expiresAt, null);
});
test('database price is authoritative for import and drift/missing facts fail closed', async () => {
  function pricing(data, error = null) {
    const query = { select() { return this; }, eq() { return this; }, async single() { return { data, error }; } };
    return loader({ '@/lib/supabaseAdmin': { getSupabaseAdmin: () => ({ from: () => query }) } })('lib/negotiation/pricing.ts');
  }
  const row = { regular_minor: 124900, selling_minor: 99900, currency: 'INR', tax_basis: 'inclusive' };
  assert.equal((await pricing(row).pilotPricing()).sellingMinor, 99900);
  for (const r of [null, { ...row, selling_minor: 124900 }, { ...row, currency: 'USD' }, { ...row, regular_minor: null }]) {
    await assert.rejects(pricing(r).pilotPricing());
  }
});

test('ordinary order API charges the approved Arctic total and preserves other products', async () => {
  const created=[], saved=[];
  class Razorpay { orders={create:async input=>{created.push(input);return {id:'order_test'};}}; }
  const {POST}=loader({
    razorpay:Razorpay,'next/server':{NextResponse:Response},
    '@/lib/supabaseAdmin':{getSupabaseAdmin:()=>({from:()=>({insert:async order=>{saved.push(order);return {error:null};}})})},
    '@/lib/trialCredit':{resolveTrialCredit:async()=>({valid:false})},
    '@/lib/inventoryServer':{reserveInventory:async()=>true,releaseInventoryReservation:async()=>{}},
  },{RAZORPAY_KEY_ID:'test',RAZORPAY_KEY_SECRET:'test'})('app/api/orders/create/route.ts');
  const customer={name:'Test Buyer',phone:'9999999999',email:'buyer@example.test',address:'Test address',city:'Bengaluru',state:'Karnataka',pincode:'560001'};
  for(const [productId,couponCode,expected] of [['arctic-wave','',99900],['arctic-wave','EON20',79900],['rank','EON20',79900]]) {
    const response=await POST(new Request('https://store.test/api/orders/create',{method:'POST',body:JSON.stringify({customer,items:[{productId,quantity:1}],couponCode,amount:1,subtotal:1})}));
    assert.equal(response.status,200);assert.equal((await response.json()).amount,expected);
    assert.equal(created.at(-1).amount,expected);assert.equal(saved.at(-1).amount_in_paise,expected);
  }
});

test('catalog imports every product price from database with manual coupon terms',async()=>{
 const ids=[];
 const db={rpc:async()=>({data:products.map(p=>({product_key:p.id,size:'50ml',available_stock:5,available:true,storefront_enabled:true})),error:null}),from(){let id;return{select(){return this},eq(_,v){id=v;return this},async single(){ids.push(id);return{data:{regular_minor:124900,selling_minor:99900,currency:'INR',tax_basis:'inclusive'},error:null}}}}};
 const catalog=await loader({'@/lib/supabaseAdmin':{getSupabaseAdmin:()=>db}})('lib/negotiation/readOnly.ts').listCatalog({cursor:null,limit:100});
 assert.equal(catalog.items.length,6);assert.equal(new Set(ids).size,6);
 for(const item of catalog.items){assert.equal(item.priceMinor,99900);assert.equal(item.pricing.regularMinor,124900);assert.equal(item.pricing.sellingMinor,99900);}
 assert.match(catalog.storeTerms.promotions.offers[0].description,/never automatically applied/);
});
