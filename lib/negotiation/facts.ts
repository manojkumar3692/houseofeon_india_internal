import { createHash } from 'node:crypto';
import { calculateOrder } from '@/lib/order';
import { calculateCouponDiscount, coupons, normalizeCouponCode } from '@/lib/coupons';
import { getProductById } from '@/lib/products';
import { getUnitPrice } from '@/lib/pricing';
import type { Cart } from './types';

export const PILOT_PRODUCT = 'arctic-wave';
// Preserve the external variant identity already imported by the connector.
export const PILOT_VARIANT = `${PILOT_PRODUCT}:50ml`;
export const PLATFORM_ORIGIN = 'https://eon-negotiation.vercel.app';

export function pilotCart(cart: Cart) {
  const line = cart.lines[0];
  if (cart.currency !== 'INR' || cart.lines.length !== 1 || line.productId !== PILOT_PRODUCT ||
      line.variantId !== PILOT_VARIANT || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 20 ||
      new Set(cart.promotionCodes).size !== cart.promotionCodes.length) throw Error('Unsupported pilot cart');
  const product = getProductById(line.productId);
  if (!product || product.size.toLowerCase() !== '50ml') throw Error('Product unavailable');
  return { product, quantity: line.quantity };
}

export function storeTerms() {
  const coupon = coupons.find(c => c.code === 'EON20');
  return {
    shipping: { mode: 'free', customerChargeMinor: 0 },
    promotions: { status: 'known', offers: coupon?.active ? [{
      code: coupon.code,
      description: `${coupon.value}% off perfume cart subtotal; discount rounded to nearest whole INR (Math.round), capped at INR ${coupon.maxDiscount ?? 'subtotal'}. Minimum INR ${coupon.minSubtotal ?? 0}. For Arctic Wave, shopper must explicitly enter EON20; it is not automatically applied. Other eligible products retain their existing automatic coupon behavior. Excludes 2+ bottle bundle pricing, trial sets and negotiated offers. One code per order; no stacking with other codes or trial credit. No expiry is configured.`,
      combinesWithNegotiation: 'no', expiresAt: null,
    }] : [] },
  };
}

// Use the same order and discount functions as /api/orders/create. The signed
// cart has no phone/identity, so identity-bound trial credit cannot be verified.
export function evaluateCart(cart: Cart) {
  pilotCart(cart);
  const order = calculateOrder(cart.lines);
  const appliedCodes: string[] = [], rejectedCodes: string[] = [];
  let discountMinor = 0;
  for (const code of cart.promotionCodes) {
    const normalized = normalizeCouponCode(code);
    const result = calculateCouponDiscount({ code, subtotal: order.total, hasBundleLine: order.hasBundleLine });
    if (cart.promotionCodes.length === 1 && normalized === 'EON20' && result.valid) {
      appliedCodes.push(code);
      discountMinor = Math.round(result.discount * 100);
    } else rejectedCodes.push(code);
  }
  return { requestedCodes: cart.promotionCodes, appliedCodes, rejectedCodes,
    itemSubtotalMinor: order.amountInPaise - discountMinor, shippingMinor: 0,
    totalMinor: order.amountInPaise - discountMinor, combinesWithNegotiation: false as const };
}

export function cartFacts(cart: Cart, stock: number, checkoutEnabled: boolean) {
  const { product, quantity } = pilotCart(cart);
  const evaluation = evaluateCart(cart);
  const serviceable = cart.destination === null ? null :
    cart.destination.country === 'IN' && /^[1-9]\d{5}$/.test(cart.destination.postalCode);
  const supported = cart.paymentMethod === 'prepaid';
  const facts = {
    currency: 'INR', taxBasis: 'inclusive',
    line: { productId: product.id, variantId: PILOT_VARIANT, name: product.name, quantity,
      unitPriceMinor: getUnitPrice(product.price, quantity) * 100, availableToSell: stock,
      approvedFloorMinor: null, fulfillmentType: 'physical' },
    shipping: { mode: 'flat', serviceable, merchantCostMinor: null, customerChargeMinor: 0, rateId: 'india-free' },
    sales: null,
    promotions: { codes: evaluation.appliedCodes, stackable: false, ...(cart.promotionCodes.length ? { evaluation } : {}) },
    // EON's fee is merchant processor expense, not customer surcharge. Future
    // Razorpay expense is unknown; EON must use an explicitly approved cost.
    payment: { method: cart.paymentMethod, supported, feeMinor: null },
    checkoutSupported: checkoutEnabled && quantity === 1 && supported && serviceable === true && stock >= quantity && evaluation.rejectedCodes.length === 0,
  };
  // Stable across identical reads; stock, destination, coupon/rule or price
  // changes invalidate the quote. Do not use a clock-based context revision.
  const revision = createHash('sha256').update(JSON.stringify({ cart, facts, terms: storeTerms() })).digest('hex');
  return { ...facts, revision };
}
