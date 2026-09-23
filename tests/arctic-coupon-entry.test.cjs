const {test}=require('node:test');const assert=require('node:assert/strict');const {loader}=require('./negotiation-loader.cjs');
const base=loader();const {getCatalogOffer,getCouponOffer}=base('lib/catalogOffer.ts');const {calculateCouponDiscount}=base('lib/coupons.ts');
function cartHarness(savedCoupon){
 const storage=new Map([['houseofeon_cart',JSON.stringify([{productId:'arctic-wave',quantity:1}])]]);if(savedCoupon)storage.set('houseofeon_coupon',savedCoupon);
 const slots=[],effects=[],pending=[];let cursor=0,dirty=true,value;
 const React={createContext:()=>({Provider:'provider'}),useContext(){},useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return[slots[i],v=>{const next=typeof v==='function'?v(slots[i]):v;if(next!==slots[i]){slots[i]=next;dirty=true;}}]},useMemo:fn=>fn(),useEffect(fn,deps){const i=cursor++;if(!effects[i]||deps.some((v,j)=>v!==effects[i].deps[j])){pending.push(()=>{effects[i]?.cleanup?.();effects[i]={deps,cleanup:fn()}})}}};
 const Cart=loader({react:React},{},{localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},fetch:async(_,options)=>Response.json(calculateCouponDiscount(JSON.parse(options.body)))})('components/CartContext.tsx').CartProvider;
 async function settle(){for(let i=0;i<20;i++){if(dirty){dirty=false;cursor=0;value=Cart({children:null}).props.value;while(pending.length)pending.shift()();}await new Promise(r=>setImmediate(r));if(!dirty&&!pending.length)break;}return value;}
 return {settle};
}
test('Arctic displays selling999, explicit coupon799, other catalog unchanged',()=>{
 assert.equal(getCatalogOffer(999,'arctic-wave').price,999);assert.equal(getCouponOffer(999).price,799);
 assert.equal(getCatalogOffer(1249,'desert-tonka').price,999);
});
test('Arctic cart starts999; manual EON20 yields799; remove restores999 without reapply',async()=>{
 const h=cartHarness();let c=await h.settle();assert.equal(c.finalTotal,999);assert.equal(c.couponCode,'');
 assert.equal((await c.applyCoupon('EON20')).ok,true);c=await h.settle();assert.equal(c.finalTotal,799);assert.equal(c.couponCode,'EON20');
 c.removeCoupon();c=await h.settle();assert.equal(c.finalTotal,999);assert.equal(c.couponCode,'');
});
test('legacy automatic coupon does not silently discount Arctic cart',async()=>{
 const c=await cartHarness('EON20').settle();assert.equal(c.finalTotal,999);assert.equal(c.couponCode,'');
});
