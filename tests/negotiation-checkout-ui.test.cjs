const {test}=require('node:test');
const assert=require('node:assert/strict');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const {loader}=require('./negotiation-loader.cjs');
function render(state,deadline=Date.now()+600000){
  const offer={name:'Arctic Wave',quantity:1,itemMinor:75500,shippingMinor:0,currency:'INR',expiresAt:new Date(Date.now()+1800000).toISOString(),paymentStartUntil:new Date(deadline).toISOString(),state,pincode:'560001',enabled:true};
  const View=loader({react:{...React,useState(v){return React.useState(v===null?offer:v)}},'./checkout.module.css':{__esModule:true,default:{}}})('app/checkout/negotiated/[id]/view.tsx').default;
  return renderToStaticMarkup(React.createElement(View,{id:'test'}));
}
test('negotiated form shows exact approved amount, fixed postcode and no coupon input',()=>{
  const html=render('pending');assert.match(html,/Continue to pay ₹755\.00/);assert.match(html,/<input(?=[^>]*name="pincode")(?=[^>]*readOnly="")[^>]*>/);assert.doesNotMatch(html,/name="coupon"/);
});
test('closed or too-short offer has fresh-offer guidance and no payment submission',()=>{
  for(const html of [render('cancelled'),render('pending',Date.now()-1000)]){
    assert.doesNotMatch(html,/<form/);assert.match(html,/fresh offer/);assert.match(html,/Check payment status/);
  }
});
