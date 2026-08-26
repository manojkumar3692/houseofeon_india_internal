// Server-only. Resolves a customer-entered code against real, paid trial
// pack orders instead of the static coupon list — this is what makes "just
// enter your trial pack order number at checkout" work as the credit-back
// mechanic, without a separate generated coupon code to keep track of.
//
// IMPORTANT: never import this from a client component ("use client") —
// it pulls in getSupabaseAdmin, which holds the Supabase service role key.
// Only call it from API routes (app/api/coupons/validate,
// app/api/orders/create).
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { applyCouponMath, Coupon, normalizeCouponCode } from "@/lib/coupons";
import { TRIAL_PACK_PRICE_INR, TRIAL_CREDIT_EXPIRY_DAYS } from "@/lib/trialPack";

export type CouponResolution = {
  valid: boolean;
  error: string;
  discount: number;
  coupon: Coupon | null;
};

const INVALID: CouponResolution = {
  valid: false,
  error: "Invalid coupon code",
  discount: 0,
  coupon: null,
};

// A trial-pack order's own order_number doubles as its one-time credit
// code — so "resolving" one means looking up a real order row, not a
// static list entry. Every check here maps directly to a real fraud/abuse
// concern: order_type confirms it was actually a trial pack (not any
// order), payment_status confirms it was actually paid, phone match stops
// someone else's leaked order number being redeemed, the null check on
// trial_credit_redeemed_at enforces single-use, and the date check is the
// 30-day window.
export async function resolveTrialCredit({
  code,
  phone,
  subtotal,
  hasBundleLine,
}: {
  code: string;
  phone?: string;
  subtotal: number;
  hasBundleLine?: boolean;
}): Promise<CouponResolution> {
  if (!phone) {
    return {
      ...INVALID,
      error: "Enter the phone number from your trial pack order to redeem this credit.",
    };
  }

  const normalized = normalizeCouponCode(code);

  try {
    const supabase = getSupabaseAdmin();
    const { data: trialOrder, error } = await supabase
      .from("orders")
      .select("order_number, customer_phone, payment_status, order_type, trial_credit_redeemed_at, created_at")
      .eq("order_number", normalized)
      .eq("order_type", "trial_pack")
      .single();

    if (error || !trialOrder) return INVALID;

    if (trialOrder.payment_status !== "paid") return INVALID;

    if (trialOrder.trial_credit_redeemed_at) {
      return { ...INVALID, error: "This trial pack credit has already been used." };
    }

    // Digits-only comparison — the same phone typed with/without spaces or
    // a leading 0 shouldn't fail to match its own order.
    const normalizePhone = (p: string) => p.replace(/[^0-9]/g, "").slice(-10);
    if (normalizePhone(trialOrder.customer_phone || "") !== normalizePhone(phone)) {
      return {
        ...INVALID,
        error: "This trial pack credit is linked to a different phone number.",
      };
    }

    const ageInDays =
      (Date.now() - new Date(trialOrder.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays > TRIAL_CREDIT_EXPIRY_DAYS) {
      return { ...INVALID, error: "This trial pack credit has expired." };
    }

    const virtualCoupon: Coupon = {
      code: trialOrder.order_number,
      label: "Trial Pack Credit",
      type: "flat",
      value: TRIAL_PACK_PRICE_INR,
      active: true,
    };

    return applyCouponMath(virtualCoupon, subtotal, hasBundleLine) as CouponResolution;
  } catch (err) {
    console.error("resolveTrialCredit error:", err);
    return INVALID;
  }
}

// Called only after a redeeming order is confirmed PAID (Razorpay webhook,
// payment.captured) — mirrors the "webhook is the only source of truth"
// rule payment_status itself follows. Never called from the client-facing
// verify route, which only proves a signature, not that money moved.
export async function markTrialCreditRedeemed(trialOrderNumber: string) {
  try {
    const supabase = getSupabaseAdmin();
    await supabase
      .from("orders")
      .update({ trial_credit_redeemed_at: new Date().toISOString() })
      .eq("order_number", trialOrderNumber)
      .eq("order_type", "trial_pack")
      .is("trial_credit_redeemed_at", null);
  } catch (err) {
    console.error("markTrialCreditRedeemed error:", err);
  }
}
