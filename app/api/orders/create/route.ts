import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateOrder, createOrderNumber } from "@/lib/order";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  calculateCouponDiscount,
  normalizeCouponCode,
} from "@/lib/coupons";
import { resolveTrialCredit } from "@/lib/trialCredit";
import {
  isPartialCodEligible,
  getEffectiveTokenAmountInPaise,
} from "@/lib/codToken";

const schema = z.object({
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().min(8),
    email: z.string().email("Valid email is required"),
    address: z.string().min(8),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: z.string().min(4),
  }),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  couponCode: z.string().optional().or(z.literal("")),
  paymentType: z.enum(["full", "partial_cod"]).optional().default("full"),
  // Links this order back to its checkout_sessions funnel-tracking row
  // (see lib/checkoutSession.ts). Optional and best-effort — a missing or
  // stale session key should never block an order from being created.
  sessionKey: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());

    const orderCalc = calculateOrder(payload.items);

    if (!orderCalc.items.length || orderCalc.amountInPaise <= 0) {
      return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
    }

    const subtotalInPaise = orderCalc.amountInPaise;
    const subtotal = subtotalInPaise / 100;

    let couponCode: string | null = null;
    let couponDiscount = 0;
    let couponDiscountInPaise = 0;

    if (payload.couponCode) {
      const normalizedCode = normalizeCouponCode(payload.couponCode);

      let couponResult = calculateCouponDiscount({
        code: normalizedCode,
        subtotal,
        hasBundleLine: orderCalc.hasBundleLine,
      });

      // Not a static coupon — check if it's a real, paid, unredeemed trial
      // pack order number instead (phone-matched, 30-day window; see
      // lib/trialCredit.ts). This is the authoritative check: the preview
      // in /api/coupons/validate can be wrong or stale, this can't be.
      if (!couponResult.valid) {
        couponResult = await resolveTrialCredit({
          code: normalizedCode,
          phone: payload.customer.phone,
          subtotal,
          hasBundleLine: orderCalc.hasBundleLine,
        });
      }

      if (!couponResult.valid || !couponResult.coupon) {
        return NextResponse.json(
          {
            error: couponResult.error || "Invalid coupon code",
          },
          { status: 400 }
        );
      }

      couponCode = normalizedCode;
      couponDiscount = couponResult.discount;
      couponDiscountInPaise = Math.round(couponDiscount * 100);
    }

    const finalAmountInPaise = Math.max(
      0,
      subtotalInPaise - couponDiscountInPaise
    );

    if (finalAmountInPaise <= 0) {
      return NextResponse.json(
        { error: "Invalid final order amount" },
        { status: 400 }
      );
    }

    // Partial COD is only honored server-side if the order actually
    // qualifies — protects against a stale/tampered client request.
    const usePartialCod =
      payload.paymentType === "partial_cod" &&
      isPartialCodEligible(finalAmountInPaise);

    const paymentType = usePartialCod ? "partial_cod" : "full";
    // Capped at the order's own total — at real order values this is just
    // the usual token amount, but it means the "pay now" amount can never
    // exceed what the order is actually worth (matters for very low test
    // totals, e.g. the admin ₹1 coupon).
    const tokenAmountInPaise = usePartialCod
      ? getEffectiveTokenAmountInPaise(finalAmountInPaise)
      : 0;
    const chargeNowInPaise = usePartialCod
      ? tokenAmountInPaise
      : finalAmountInPaise;
    const balanceDueInPaise = usePartialCod
      ? finalAmountInPaise - tokenAmountInPaise
      : 0;

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error("Missing Razorpay credentials");
    }

    const orderNumber = createOrderNumber();

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: chargeNowInPaise,
      currency: "INR",
      receipt: orderNumber,
      notes: {
        orderNumber,
        couponCode: couponCode || "",
        subtotalInPaise: String(subtotalInPaise),
        couponDiscountInPaise: String(couponDiscountInPaise),
        finalAmountInPaise: String(finalAmountInPaise),
        paymentType,
        tokenAmountInPaise: String(tokenAmountInPaise),
        balanceDueInPaise: String(balanceDueInPaise),
      },
    });

    const supabase = getSupabaseAdmin();

    const { error } = await supabase.from("orders").insert({
      order_number: orderNumber,

      customer_name: payload.customer.name,
      customer_phone: payload.customer.phone,
      customer_email: payload.customer.email || null,
      customer_address: payload.customer.address,
      customer_city: payload.customer.city,
      customer_state: payload.customer.state,
      customer_pincode: payload.customer.pincode,

      items: orderCalc.items,

      subtotal_in_paise: subtotalInPaise,
      coupon_code: couponCode,
      coupon_discount_in_paise: couponDiscountInPaise,
      amount_in_paise: finalAmountInPaise,

      payment_type: paymentType,
      token_amount_in_paise: tokenAmountInPaise,
      balance_due_in_paise: balanceDueInPaise,
      cod_balance_status: usePartialCod ? "pending" : "not_applicable",

      payment_status: "pending",
      razorpay_order_id: razorpayOrder.id,
      shipping_status: "pending",
    });

    if (error) throw error;

    // Best-effort link to the funnel-tracking row so it's no longer just
    // an anonymous abandoned session — never let this block a real order.
    if (payload.sessionKey) {
      try {
        await supabase
          .from("checkout_sessions")
          .update({
            order_number: orderNumber,
            order_created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("session_key", payload.sessionKey);
      } catch (linkError) {
        console.error("checkout_sessions order link failed:", linkError);
      }
    }

    return NextResponse.json({
      orderNumber,
      razorpayOrderId: razorpayOrder.id,
      // amount = what Razorpay actually charges right now (token amount
      // for partial_cod, full amount otherwise). Used directly as the
      // Razorpay Checkout `amount` option.
      amount: chargeNowInPaise,
      subtotal: subtotal,
      subtotalInPaise,
      couponCode,
      couponDiscount,
      couponDiscountInPaise,
      // finalTotal / finalAmountInPaise = full order value, regardless of
      // how much is charged online right now.
      finalTotal: finalAmountInPaise / 100,
      finalAmountInPaise,
      paymentType,
      tokenAmount: tokenAmountInPaise / 100,
      tokenAmountInPaise,
      balanceDue: balanceDueInPaise / 100,
      balanceDueInPaise,
      currency: "INR",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Order creation failed",
      },
      { status: 400 }
    );
  }
}