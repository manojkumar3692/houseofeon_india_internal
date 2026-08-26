// "fixed_final" means: regardless of subtotal, the discount is whatever
// brings the order down to exactly `value` — used for the admin-only
// ₹1 test checkout, where a flat discount amount wouldn't work (it would
// need to change every time the subtotal does) and a percentage wouldn't
// reliably land on exactly ₹1 either.
export type CouponType = "percentage" | "flat" | "fixed_final";

export type Coupon = {
  code: string;
  label: string;
  type: CouponType;
  value: number;
  active: boolean;
  minSubtotal?: number;
  maxDiscount?: number;
  // Bypasses the normal coupon+bundle mutual-exclusion rule (see below).
  // Only meant for internal/admin test coupons — real customer-facing
  // coupons should never set this, since bundle pricing is deliberately
  // the better deal and shouldn't be stackable.
  allowWithBundle?: boolean;
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
    label: "Admin Test Checkout - ₹1",
    type: "fixed_final",
    value: 1,
    active: true,
    allowWithBundle: true,
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

// Pure discount math for an already-resolved coupon — pulled out of
// calculateCouponDiscount so lib/trialCredit.ts can run a virtual,
// DB-resolved "coupon" (the ₹249 trial credit) through the exact same
// rules (bundle mutual-exclusion, min-subtotal, cap at subtotal) without
// duplicating the logic or needing to fake an entry in the static list.
export function applyCouponMath(
  coupon: Coupon,
  subtotal: number,
  hasBundleLine?: boolean
) {
  // The 2-bottle bundle rate is already a bigger automatic discount and is
  // deliberately kept mutually exclusive with coupon codes — no stacking.
  // Admin test coupons (allowWithBundle) are exempt since they're not a
  // real customer-facing offer and this exclusion doesn't apply to them.
  if (hasBundleLine && !coupon.allowWithBundle) {
    return {
      valid: false,
      error: "Coupon codes can't be combined with 2-bottle bundle pricing.",
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

  if (coupon.type === "fixed_final") {
    // Bring the order down to exactly `value`, whatever the subtotal is —
    // e.g. value: 1 means "this order costs ₹1", not "₹1 off".
    discount = Math.max(0, subtotal - coupon.value);
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

export function calculateCouponDiscount({
  code,
  subtotal,
  hasBundleLine,
}: {
  code: string;
  subtotal: number;
  hasBundleLine?: boolean;
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

  return applyCouponMath(coupon, subtotal, hasBundleLine);
}