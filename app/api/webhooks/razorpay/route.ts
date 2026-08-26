import crypto from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { buildCustomerAddress } from "@/lib/order";
import { sendOrderEmails } from "@/lib/email";
import { markTrialCreditRedeemed } from "@/lib/trialCredit";

// This route is the ONLY thing allowed to mark an order as truly paid.
// Everything else in the checkout flow (the browser's post-payment callback
// in /api/orders/verify) only ever sees a single, one-time report from the
// customer's own device — which is exactly what let orders look "paid" in
// our records for payments that never actually completed on Razorpay's
// side. This endpoint is called directly by Razorpay's own servers, after
// they've independently confirmed what actually happened to the money, so
// "paid" here always means Razorpay itself confirmed capture — never just
// "the browser said so".
//
// Register this URL in Razorpay Dashboard -> Settings -> Webhooks:
//   https://www.houseofeon.in/api/webhooks/razorpay
// Subscribe to at least: payment.captured, payment.failed
// The "Secret" you set there must match RAZORPAY_WEBHOOK_SECRET below.

type RazorpayPaymentEntity = {
  id: string;
  order_id: string;
  amount: number;
  error_description?: string | null;
  error_reason?: string | null;
};

export async function POST(request: Request) {
  // Signature must be computed over the exact raw bytes Razorpay sent —
  // parsing to JSON first and re-serializing would change whitespace/key
  // order and break the HMAC match, so read as text before anything else.
  const rawBody = await request.text();

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("razorpay webhook: missing RAZORPAY_WEBHOOK_SECRET");
    // 500 so Razorpay retries once this is actually configured, rather
    // than silently dropping events forever.
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = request.headers.get("x-razorpay-signature") || "";

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const signatureValid =
    signature.length === expectedSignature.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

  if (!signatureValid) {
    console.error("razorpay webhook: signature mismatch, rejecting");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = body?.event as string | undefined;
  const supabase = getSupabaseAdmin();

  try {
    if (event === "payment.captured") {
      const entity = body?.payload?.payment?.entity as RazorpayPaymentEntity;
      if (!entity?.order_id) {
        return NextResponse.json({ ok: true, skipped: "missing order_id" });
      }

      const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("razorpay_order_id", entity.order_id)
        .single();

      if (fetchError || !order) {
        console.error(
          "razorpay webhook: payment.captured for unknown order",
          entity.order_id
        );
        // Still 200 — an order we can't find will never resolve on retry.
        return NextResponse.json({ ok: true, skipped: "order not found" });
      }

      // Sanity-check the captured amount against what we expected. Never
      // block the update over this (Razorpay's report of what actually
      // moved is the ground truth, full stop) — just log loudly so a
      // mismatch doesn't go unnoticed.
      if (order.amount_in_paise && entity.amount !== order.amount_in_paise) {
        console.error(
          `razorpay webhook: captured amount ${entity.amount} does not match expected ${order.amount_in_paise} for order ${order.order_number}`
        );
      }

      // Idempotency: Razorpay retries webhooks, and this event can arrive
      // more than once for the same payment. Only treat it as "new" if we
      // haven't already recorded a capture for this order.
      const alreadyCaptured = Boolean(order.payment_captured_at);

      const { data: updated, error: updateError } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          razorpay_payment_id: entity.id,
          payment_captured_at: order.payment_captured_at || new Date().toISOString(),
        })
        .eq("id", order.id)
        .select("*")
        .single();

      if (updateError || !updated) {
        throw updateError || new Error("Order update failed");
      }

      try {
        await supabase
          .from("checkout_sessions")
          .update({
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("order_number", updated.order_number);
      } catch (linkError) {
        console.error("checkout_sessions paid-link failed:", linkError);
      }

      // Only process these the first time this order is confirmed
      // captured — not on every retry of the same webhook event.
      if (!alreadyCaptured) {
        // If a trial-pack credit code was used on this order, this is the
        // moment it actually counts as "redeemed" — same reasoning as
        // payment_status itself only flipping here, not in the client-
        // facing /api/orders/verify route. If coupon_code was a normal
        // static coupon (or none), this is a harmless no-op — see
        // lib/trialCredit.ts's markTrialCreditRedeemed.
        if (updated.coupon_code) {
          await markTrialCreditRedeemed(updated.coupon_code);
        }

        try {
          await sendOrderEmails({
            orderNumber: updated.order_number,
            order_id: updated.order_number,

            customerName: updated.customer_name,
            customerPhone: updated.customer_phone,
            customerEmail: updated.customer_email,

            address: buildCustomerAddress(updated),
            isTrialPack: updated.order_type === "trial_pack",

            amountInPaise: updated.amount_in_paise,
            items: Array.isArray(updated.items) ? updated.items : [],

            razorpayOrderId: updated.razorpay_order_id,
            razorpayPaymentId: updated.razorpay_payment_id,

            paymentType: updated.payment_type,
            tokenAmountInPaise: updated.token_amount_in_paise,
            balanceDueInPaise: updated.balance_due_in_paise,
          });
        } catch (emailError) {
          console.error("Email failed after webhook capture:", emailError);
        }
      }

      return NextResponse.json({ ok: true });
    }

    if (event === "payment.failed") {
      const entity = body?.payload?.payment?.entity as RazorpayPaymentEntity;
      if (!entity?.order_id) {
        return NextResponse.json({ ok: true, skipped: "missing order_id" });
      }

      const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("razorpay_order_id", entity.order_id)
        .single();

      if (fetchError || !order) {
        return NextResponse.json({ ok: true, skipped: "order not found" });
      }

      // Never let a failed attempt downgrade an order that a different,
      // later-succeeding attempt on the same order already captured.
      if (order.payment_status === "paid") {
        return NextResponse.json({ ok: true, skipped: "already paid" });
      }

      const reason =
        entity.error_description || entity.error_reason || "Payment failed";

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_status: "failed",
          payment_failed_reason: reason,
        })
        .eq("id", order.id);

      if (updateError) throw updateError;

      return NextResponse.json({ ok: true });
    }

    // Any other event type (refund.processed, payment.authorized, etc.) —
    // acknowledge without erroring so Razorpay doesn't keep retrying an
    // event we're not yet handling.
    return NextResponse.json({ ok: true, skipped: `unhandled event: ${event}` });
  } catch (error) {
    console.error("razorpay webhook processing failed:", error);
    // Non-200 so Razorpay retries — this branch means something on our
    // side actually broke, not a normal "nothing to do" case.
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
