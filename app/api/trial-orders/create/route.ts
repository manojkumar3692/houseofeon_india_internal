import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createOrderNumber } from "@/lib/order";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  TRIAL_PICK_COUNT,
  TRIAL_PACK_PRICE_INR,
  TRIAL_VIAL_SIZE_ML,
  getTrialPackAmountInPaise,
  isTrialEligibleProductId,
} from "@/lib/trialPack";
import { getProductById } from "@/lib/products";

// Deliberately its own route rather than folding into /api/orders/create —
// that route's coupon/bundle-quantity math doesn't apply here (fixed price,
// fixed pack, not a quantity-of-bottles cart), so keeping this separate
// avoids adding trial-pack special-casing into the already-complex main
// order flow. Writes into the same `orders` table (order_type='trial_pack')
// so it shows up in admin/track-order/emails like any other order —
// /api/orders/verify and the Razorpay webhook are both generic enough to
// need no changes for this to work end to end.
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
  selectedScents: z.array(z.string()).length(TRIAL_PICK_COUNT),
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());

    const uniqueScents = Array.from(new Set(payload.selectedScents));
    if (uniqueScents.length !== TRIAL_PICK_COUNT) {
      return NextResponse.json(
        { error: `Pick ${TRIAL_PICK_COUNT} different scents.` },
        { status: 400 }
      );
    }

    const scentProducts = uniqueScents.map((id) => getProductById(id));
    if (scentProducts.some((p) => !p) || uniqueScents.some((id) => !isTrialEligibleProductId(id))) {
      return NextResponse.json(
        { error: "One of the selected scents isn't available for the trial pack." },
        { status: 400 }
      );
    }

    const amountInPaise = getTrialPackAmountInPaise();
    const scentNames = scentProducts.map((p) => p!.name).join(", ");

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw new Error("Missing Razorpay credentials");

    const orderNumber = createOrderNumber();

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: orderNumber,
      notes: { orderNumber, orderType: "trial_pack", scents: scentNames },
    });

    const supabase = getSupabaseAdmin();

    const { error } = await supabase.from("orders").insert({
      order_number: orderNumber,
      order_type: "trial_pack",

      customer_name: payload.customer.name,
      customer_phone: payload.customer.phone,
      customer_email: payload.customer.email || null,
      customer_address: payload.customer.address,
      customer_city: payload.customer.city,
      customer_state: payload.customer.state,
      customer_pincode: payload.customer.pincode,

      items: [
        {
          productId: "trial-pack",
          name: `Trial Pack — ${scentNames}`,
          slug: "trial-pack",
          size: `${TRIAL_PICK_COUNT} x ${TRIAL_VIAL_SIZE_ML}ml`,
          price: TRIAL_PACK_PRICE_INR,
          quantity: 1,
          lineTotal: TRIAL_PACK_PRICE_INR,
        },
      ],
      trial_selected_scents: uniqueScents,

      subtotal_in_paise: amountInPaise,
      coupon_code: null,
      coupon_discount_in_paise: 0,
      amount_in_paise: amountInPaise,

      payment_type: "full",
      token_amount_in_paise: 0,
      balance_due_in_paise: 0,
      cod_balance_status: "not_applicable",

      payment_status: "pending",
      razorpay_order_id: razorpayOrder.id,
      shipping_status: "pending",
    });

    if (error) throw error;

    return NextResponse.json({
      orderNumber,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: "INR",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Trial pack order creation failed" },
      { status: 400 }
    );
  }
}
