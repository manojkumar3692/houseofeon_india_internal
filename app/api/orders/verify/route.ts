import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const schema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

// IMPORTANT: this route is the customer's browser reporting back after the
// Razorpay Checkout popup closes — it is NOT the source of truth for
// whether the order is actually paid. It only proves the payment_id/
// order_id pair it received really was issued by Razorpay (the signature
// can only be generated with our secret key), which is enough to let the
// customer through to the success page and to record which payment_id
// this attempt produced. Whether that payment actually resulted in money
// being captured is decided independently and exclusively by
// /api/webhooks/razorpay, called directly by Razorpay's own servers — this
// is what closes the gap where a payment stuck at "created" on Razorpay's
// side could previously still end up looking "paid" here, based on nothing
// but a single message from the customer's device.
export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new Error("Missing Razorpay secret");
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${payload.razorpay_order_id}|${payload.razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== payload.razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("razorpay_order_id", payload.razorpay_order_id)
      .single();

    if (fetchError || !order) {
      throw fetchError || new Error("Order not found");
    }

    // Deliberately does NOT set payment_status here — only records which
    // payment_id this signature-verified attempt produced, so it's visible
    // even before the webhook lands. If the webhook (the actual authority)
    // already processed this order — e.g. it arrived first, which can
    // happen since it's a direct server-to-server call — this simply
    // leaves payment_status/payment_captured_at untouched rather than
    // risking overwriting a state this route has no business deciding.
    const { data: updated, error: updateError } = await supabase
      .from("orders")
      .update({
        razorpay_payment_id: payload.razorpay_payment_id,
      })
      .eq("id", order.id)
      .select("*")
      .single();

    if (updateError || !updated) {
      throw updateError || new Error("Order update failed");
    }

    return NextResponse.json({
      ok: true,
      orderNumber: updated.order_number,
      paymentType: updated.payment_type,
      balanceDueInPaise: updated.balance_due_in_paise,
    });
  } catch (error) {
    console.error("Payment verification failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Payment verification failed",
      },
      { status: 400 }
    );
  }
}