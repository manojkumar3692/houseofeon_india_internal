import { calculateCouponDiscount } from "@/lib/coupons";

export function getCouponOffer(basePrice: number) {
  const result = calculateCouponDiscount({ code: "EON20", subtotal: basePrice, hasBundleLine: false });
  const price = result.valid ? basePrice - result.discount : basePrice;
  return { basePrice, price, onSale: price < basePrice };
}

// Arctic has a separate sale price; its coupon requires explicit entry.
// Other products retain their existing display and automatic coupon behavior.
export function getCatalogOffer(basePrice: number, productId?: string) {
  return productId === "arctic-wave" ? { basePrice, price: basePrice, onSale: true } : getCouponOffer(basePrice);
}
export function requiresExplicitCoupon(lines: { productId: string }[]) {
  return lines.some(line => line.productId === "arctic-wave");
}
