// Approved price for all six 50ml perfumes. Original/MRP remains1249.
export const BASE_PRICE_INR = 999;
// Manual EON20 entry: round the discount to INR200, then999-200=799.
export const EON20_DISCOUNTED_PRICE_INR = 799;
export const EON20_PERCENT_OFF = 20;

// Quantity-break bundle: buying 2+ perfumes total in the same cart — any
// mix of products, not just 2 of the same one — switches every unit in
// the whole cart to the bundle rate. This is a separate, automatic
// discount — it does not require a coupon code, and is mutually exclusive
// with EON20 (a cart that qualifies for the bundle can't also apply EON20).
export const BUNDLE_QUANTITY = 2;
export const BUNDLE_UNIT_PRICE_INR = 799;
export const BUNDLE_TOTAL_INR = BUNDLE_UNIT_PRICE_INR * BUNDLE_QUANTITY; // 1598

// Bundle equals two explicitly coupon-discounted singles; no additional saving.
export const BUNDLE_SAVINGS_VS_DISCOUNTED_INR =
  EON20_DISCOUNTED_PRICE_INR * BUNDLE_QUANTITY - BUNDLE_TOTAL_INR;

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
