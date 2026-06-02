import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateOrder, createOrderNumber } from "@/lib/order";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const schema = z.object({
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().min(8),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().min(8),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: z.string().min(4),
    notes: z.string().optional(),
  }),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })).min(1),
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const orderCalc = calculateOrder(payload.items);
    if (!orderCalc.items.length || orderCalc.amountInPaise <= 0) {
      return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw new Error("Missing Razorpay credentials");

    const orderNumber = createOrderNumber();
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const razorpayOrder = await razorpay.orders.create({
      amount: orderCalc.amountInPaise,
      currency: "INR",
      receipt: orderNumber,
      notes: { orderNumber },
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
      notes: payload.customer.notes || null,
      items: orderCalc.items,
      amount_in_paise: orderCalc.amountInPaise,
      payment_status: "pending",
      razorpay_order_id: razorpayOrder.id,
      shipping_status: "pending",
    });

    if (error) throw error;

    return NextResponse.json({
      orderNumber,
      razorpayOrderId: razorpayOrder.id,
      amount: orderCalc.amountInPaise,
      currency: "INR",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Order creation failed" }, { status: 400 });
  }
}
