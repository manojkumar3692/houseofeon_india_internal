import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendOrderEmails } from "@/lib/email";

const schema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

function buildCustomerAddress(updated: any) {
  const line1 = updated.customer_address || "";
  const city = updated.customer_city || "";
  const state = updated.customer_state || "";
  const pincode = updated.customer_pincode || "";

  const cityStateLine = [city, state].filter(Boolean).join(", ");
  const pincodeLine = pincode ? `${cityStateLine} - ${pincode}` : cityStateLine;

  return [line1, pincodeLine].filter(Boolean).join("\n") || "Not provided";
}

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

    const { data: updated, error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        razorpay_payment_id: payload.razorpay_payment_id,
      })
      .eq("id", order.id)
      .select("*")
      .single();

    if (updateError || !updated) {
      throw updateError || new Error("Order update failed");
    }

    try {
      await sendOrderEmails({
        orderNumber: updated.order_number,
        order_id: updated.order_number,

        customerName: updated.customer_name,
        customerPhone: updated.customer_phone,
        customerEmail: updated.customer_email,

        address: buildCustomerAddress(updated),

        amountInPaise: updated.amount_in_paise,
        items: Array.isArray(updated.items) ? updated.items : [],

        razorpayOrderId: updated.razorpay_order_id,
        razorpayPaymentId: updated.razorpay_payment_id,
      });
    } catch (emailError) {
      console.error("Email failed after payment success:", emailError);
    }

    return NextResponse.json({
      ok: true,
      orderNumber: updated.order_number,
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