export type CouponType = "percentage" | "flat";

export type Coupon = {
  code: string;
  label: string;
  type: CouponType;
  value: number;
  active: boolean;
  minSubtotal?: number;
  maxDiscount?: number;
};

export const coupons: Coupon[] = [
  {
    code: "EON20",
    label: "Launch Offer - 20% OFF",
    type: "percentage",
    value: 20,
    active: true,
    minSubtotal: 0,
    maxDiscount: 1000,
  },
  {
    code: "ONLYADMIN",
    label: "Only Admin",
    type: "percentage",
    value: 99,
    active: true,
    minSubtotal: 0,
    maxDiscount: 1000,
  },
];

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function getCouponByCode(code: string) {
  const normalized = normalizeCouponCode(code);

  return coupons.find(
    (coupon) => coupon.code === normalized && coupon.active
  );
}

export function calculateCouponDiscount({
  code,
  subtotal,
}: {
  code: string;
  subtotal: number;
}) {
  const coupon = getCouponByCode(code);

  if (!coupon) {
    return {
      valid: false,
      error: "Invalid coupon code",
      discount: 0,
      coupon: null,
    };
  }

  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
    return {
      valid: false,
      error: `Minimum order value is ₹${coupon.minSubtotal}`,
      discount: 0,
      coupon: null,
    };
  }

  let discount = 0;

  if (coupon.type === "percentage") {
    discount = Math.round((subtotal * coupon.value) / 100);
  }

  if (coupon.type === "flat") {
    discount = coupon.value;
  }

  if (coupon.maxDiscount) {
    discount = Math.min(discount, coupon.maxDiscount);
  }

  discount = Math.min(discount, subtotal);

  return {
    valid: true,
    error: "",
    discount,
    coupon,
  };
}