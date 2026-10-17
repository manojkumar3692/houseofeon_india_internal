const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loader } = require('./negotiation-loader.cjs');
const load = loader();
const { products, getProductById, getProductBySlug } = load('lib/products.ts');
const { calculateOrder } = load('lib/order.ts');
const { calculateCouponDiscount } = load('lib/coupons.ts');
const { getTrialEligibleProducts, isTrialEligibleProductId, getTrialPackAmountInPaise } = load('lib/trialPack.ts');

test('RIVA resolves at its existing URL and uses standard bottle and bundle pricing', () => {
  const riva = getProductById('riva');
  assert.equal(getProductBySlug('riva-women-perfume'), riva);
  assert.equal(products.filter(p => p.id === 'riva').length, 1);
  assert.equal(riva.price, getProductById('syra').price);
  assert.equal(riva.mrp, 1249);
  assert.equal(calculateOrder([{ productId: 'riva', quantity: 1 }]).amountInPaise, 99900);
  const coupon = calculateCouponDiscount({ code: 'EON20', subtotal: riva.price, hasBundleLine: false });
  assert.equal(riva.price - coupon.discount, 799);
  assert.equal(calculateOrder([{ productId: 'riva', quantity: 1 }, { productId: 'syra', quantity: 1 }]).amountInPaise, 159800);
  assert.equal(riva.reviews.length, 0);
});

test('RIVA is selectable as a trial scent without changing the pack price', () => {
  assert.equal(isTrialEligibleProductId('riva'), true);
  assert.equal(getTrialEligibleProducts().filter(p => p.id === 'riva').length, 1);
  assert.equal(getTrialPackAmountInPaise(), 29900);
  assert.equal(isTrialEligibleProductId('unknown'), false);
});
