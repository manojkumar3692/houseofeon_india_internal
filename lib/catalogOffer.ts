import { calculateCouponDiscount } from "@/lib/coupons";

// Same single-bottle coupon calculation as checkout; no separate sale-price
// constant. Coupon is public and automatically applied by CartContext.
export function getCatalogOffer(basePrice: number) {
  const result = calculateCouponDiscount({ code: "EON20", subtotal: basePrice, hasBundleLine: false });
  const price = result.valid ? basePrice - result.discount : basePrice;
  return { basePrice, price, onSale: price < basePrice };
}
