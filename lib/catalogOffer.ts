import { calculateCouponDiscount } from "@/lib/coupons";

export function getCouponOffer(basePrice: number) {
  const result = calculateCouponDiscount({ code: "EON20", subtotal: basePrice, hasBundleLine: false });
  const price = result.valid ? basePrice - result.discount : basePrice;
  return { basePrice, price, onSale: price < basePrice };
}

// All six 50 ml perfumes display their selling price before a manual coupon.
export function getCatalogOffer(basePrice: number, _productId?: string) {
  return { basePrice, price: basePrice, onSale: true };
}
export function requiresExplicitCoupon(lines: { productId: string }[]) {
  return lines.length > 0;
}
