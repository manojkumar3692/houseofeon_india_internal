import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get("order")?.trim();
  const phone = searchParams.get("phone")?.trim();

  if (!orderNumber || !phone) {
    return NextResponse.json({ error: "Order number and phone are required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("order_number,payment_status,shipping_status,tracking_url,created_at")
    .eq("order_number", orderNumber)
    .eq("customer_phone", phone)
    .single();

  if (error || !data) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order: data });
}
