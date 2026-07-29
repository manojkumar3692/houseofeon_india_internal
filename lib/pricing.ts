// Shared 2026 catalog-wide pricing model. Every perfume shares the same
// base price, the same EON20 launch-offer math, and the same 2-bottle
// bundle rate — so these are kept as one shared source of truth rather
// than per-product fields. If pricing is ever meant to diverge between
// products, this file (and every place that imports it) needs revisiting.

// Base list price — what checkout charges for a single unit before any
// coupon code. Matches product.price in lib/products.ts for every product.
export const BASE_PRICE_INR = 1249;

// What a single unit costs once the EON20 launch-offer coupon (20% off,
// capped at ₹1000 discount — see lib/coupons.ts) is applied. This is
// auto-applied for every cart at checkout (see app/checkout/page.tsx), so
// in practice this is the real price a single-bottle buyer pays.
// 1249 * 0.8 = 999.2 -> rounds to 999.
export const EON20_DISCOUNTED_PRICE_INR = 999;
export const EON20_PERCENT_OFF = 20;

// Quantity-break bundle: buying 2+ perfumes total in the same cart — any
// mix of products, not just 2 of the same one — switches every unit in
// the whole cart to the bundle rate. This is a separate, automatic
// discount — it does not require a coupon code, and is mutually exclusive
// with EON20 (a cart that qualifies for the bundle can't also apply EON20).
export const BUNDLE_QUANTITY = 2;
export const BUNDLE_UNIT_PRICE_INR = 799;
export const BUNDLE_TOTAL_INR = BUNDLE_UNIT_PRICE_INR * BUNDLE_QUANTITY; // 1598

// What the "BEST VALUE — SAVE ₹X" badge advertises: the bundle total
// compared against buying the same quantity at the already-EON20-discounted
// single-unit price (999 x 2 = 1998), not the raw list price.
export const BUNDLE_SAVINGS_VS_DISCOUNTED_INR =
  EON20_DISCOUNTED_PRICE_INR * BUNDLE_QUANTITY - BUNDLE_TOTAL_INR; // 400

export function isBundleQuantity(quantity: number): boolean {
  return quantity >= BUNDLE_QUANTITY;
}

export function getCartTotalQuantity(
  lines: Array<{ quantity: number }>
): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

// The authoritative per-unit charged price, given the TOTAL quantity of
// perfumes across the whole cart (not just this one line/product) — bundle
// pricing kicks in once that total reaches 2, regardless of which products
// make it up, and is never combined with a coupon. Every unit in a
// bundle-eligible cart is priced at the bundle rate (2 total = 1598,
// 3 total = 2397, and so on).
export function getUnitPrice(basePrice: number, totalCartQuantity: number): number {
  return isBundleQuantity(totalCartQuantity) ? BUNDLE_UNIT_PRICE_INR : basePrice;
}

// lineQuantity = how many of THIS product; totalCartQuantity = how many
// perfumes total across the whole cart (decides which per-unit rate
// applies to this line).
export function getLineTotal(
  basePrice: number,
  lineQuantity: number,
  totalCartQuantity: number
): number {
  return getUnitPrice(basePrice, totalCartQuantity) * lineQuantity;
}

export function cartHasBundleLine(
  lines: Array<{ quantity: number }>
): boolean {
  return isBundleQuantity(getCartTotalQuantity(lines));
}
