const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loader}=require('./negotiation-loader.cjs');
const activeTime=Date.parse('2026-11-05T12:00:00+05:30');
class SaleDate extends Date {static now(){return activeTime;}}
const load=loader({}, {}, {Date:SaleDate});
const {diwaliDiscount,isDiwaliActive,DIWALI_END,DIWALI_START}=load('lib/diwali.ts');
const {calculateCouponDiscount}=load('lib/coupons.ts');
const {calculateOrder}=load('lib/order.ts');
const {products}=load('lib/products.ts');
test('all 50ML fragrances cost exactly 699 after DIWALI',()=>{
 for(const product of products){const items=[{productId:product.id,quantity:1}];const result=calculateCouponDiscount({code:' diwali ',subtotal:999,items});assert.equal(result.valid,true);assert.equal(calculateOrder(items).total-result.discount,699);}
});
test('mixed and same-product bundles end at 699 per bottle, never stack discounts',()=>{
 for(const items of [[{productId:products[0].id,quantity:2}],[{productId:products[0].id,quantity:1},{productId:products[1].id,quantity:2}]]){
 const order=calculateOrder(items);const result=calculateCouponDiscount({code:'DIWALI',subtotal:order.total,hasBundleLine:true,items});assert.equal(result.valid,true);assert.equal(order.total-result.discount,699*items.reduce((s,i)=>s+i.quantity,0));
 }
});
test('campaign expires exactly at midnight Sunday IST and never recurs',()=>{
 assert.equal(isDiwaliActive(DIWALI_START-1),false);assert.equal(isDiwaliActive(DIWALI_START),true);assert.equal(isDiwaliActive(DIWALI_END-1),true);assert.equal(isDiwaliActive(DIWALI_END),false);assert.equal(isDiwaliActive(DIWALI_END+365*86400000),false);
 const expired=diwaliDiscount([{productId:products[0].id,quantity:1}],DIWALI_END);assert.equal(expired.valid,false);assert.equal(expired.discount,0);
});
test('trial packs, unknown products, invalid quantities and absent items rejected',()=>{
 for(const items of [undefined,[],[{productId:'trial-pack',quantity:1}],[{productId:'nope',quantity:1}],[{productId:products[0].id,quantity:21}],[{productId:products[0].id,quantity:1.5}]]) assert.equal(diwaliDiscount(items).valid,false);
});
test('client subtotal cannot manufacture a DIWALI discount',()=>{
 const items=[{productId:products[0].id,quantity:1}];assert.equal(calculateCouponDiscount({code:'DIWALI',subtotal:999999,items}).discount,300);
});
test('regular selling price and existing coupon remain unchanged',()=>{
 assert.equal(products[0].price,999);assert.equal(calculateCouponDiscount({code:'EON20',subtotal:999}).discount,200);assert.equal(calculateCouponDiscount({code:'EON20',subtotal:1598,hasBundleLine:true}).valid,false);
});

test('order API recalculates the charged amount and rejects expiry before payment creation',async()=>{
 const charged=[]; const saved=[];
 class Razorpay { orders={create:async input=>{charged.push(input);return {id:'order_test'};}}; }
 const overrides={'next/server':{NextResponse:Response},razorpay:Razorpay,'@/lib/supabaseAdmin':{getSupabaseAdmin:()=>({from:()=>({insert:async row=>{saved.push(row);return {error:null};}})})},'@/lib/inventoryServer':{reserveInventory:async()=>true,releaseInventoryReservation:async()=>{}}};
 const body={customer:{name:'Test Buyer',phone:'9876543210',email:'test@example.com',address:'Test address street',city:'Chennai',state:'Tamil Nadu',pincode:'600001'},items:[{productId:products[0].id,quantity:2}],couponCode:'DIWALI'};
 const request=()=>new Request('https://store.test/api/orders/create',{method:'POST',body:JSON.stringify(body)});
 const api=loader(overrides,{RAZORPAY_KEY_ID:'test',RAZORPAY_KEY_SECRET:'test'},{Date:SaleDate})('app/api/orders/create/route.ts').POST;
 assert.equal((await api(request())).status,200);assert.equal(charged[0].amount,139800);assert.equal(saved[0].coupon_code,'DIWALI');
 class ExpiredDate extends Date {static now(){return DIWALI_END;}}
 const expired=loader(overrides,{RAZORPAY_KEY_ID:'test',RAZORPAY_KEY_SECRET:'test'},{Date:ExpiredDate})('app/api/orders/create/route.ts').POST;
 assert.equal((await expired(request())).status,400);assert.equal(charged.length,1);
});
