import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Server-authoritative mapping of stage -> timestamp column. The client only
// ever sends a stage *name*; it never gets to name a column directly, and it
// never gets to supply its own timestamp (avoids clock-skew / tampering).
// order_created_at and paid_at are deliberately absent here — those are only
// ever set by /api/orders/create and /api/orders/verify respectively.
const STAGE_COLUMN: Record<string, string> = {
  page_viewed: "page_viewed_at",
  phone_captured: "phone_captured_at",
  submitted: "submitted_at",
  razorpay_opened: "razorpay_opened_at",
  razorpay_dismissed: "razorpay_dismissed_at",
  payment_failed: "payment_failed_at",
};

const cartItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  quantity: z.number(),
  price: z.number(),
});

const fieldsSchema = z
  .object({
    name: z.string().max(200).optional(),
    phone: z.string().max(30).optional(),
    email: z.string().max(200).optional(),
    address: z.string().max(1000).optional(),
    city: z.string().max(200).optional(),
    state: z.string().max(200).optional(),
    pincode: z.string().max(20).optional(),
    paymentMethod: z.string().max(30).optional(),
    paymentFailedReason: z.string().max(500).optional(),
    lastActiveField: z.string().max(60).optional(),
    cartItems: z.array(cartItemSchema).optional(),
    cartValueInPaise: z.number().optional(),
    referrer: z.string().max(500).optional(),
    utmSource: z.string().max(200).optional(),
    utmMedium: z.string().max(200).optional(),
    utmCampaign: z.string().max(200).optional(),
    deviceType: z.string().max(30).optional(),
  })
  .partial();

const schema = z.object({
  sessionKey: z.string().min(1).max(200),
  stage: z.enum([
    "page_viewed",
    "phone_captured",
    "submitted",
    "razorpay_opened",
    "razorpay_dismissed",
    "payment_failed",
  ]).optional(),
  fields: fieldsSchema.optional(),
});

// This is intentionally a public, unauthenticated endpoint — same trust
// level as /api/coupons/validate and /api/orders/create, which are also
// called directly from the browser during checkout. It only ever writes to
// a single narrow, whitelisted table via a fixed set of fields (validated
// above), so there's no arbitrary write surface here beyond that.
export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const supabase = getSupabaseAdmin();

    const nowIso = new Date().toISOString();

    const row: Record<string, unknown> = {
      session_key: payload.sessionKey,
      updated_at: nowIso,
      last_activity_at: nowIso,
    };

    if (payload.fields) {
      const f = payload.fields;
      if (f.name !== undefined) row.name = f.name;
      if (f.phone !== undefined) row.phone = f.phone;
      if (f.email !== undefined) row.email = f.email;
      if (f.address !== undefined) row.address = f.address;
      if (f.city !== undefined) row.city = f.city;
      if (f.state !== undefined) row.state = f.state;
      if (f.pincode !== undefined) row.pincode = f.pincode;
      if (f.paymentMethod !== undefined) row.payment_method = f.paymentMethod;
      if (f.paymentFailedReason !== undefined)
        row.payment_failed_reason = f.paymentFailedReason;
      if (f.lastActiveField !== undefined)
        row.last_active_field = f.lastActiveField;
      if (f.cartItems !== undefined) row.cart_items = f.cartItems;
      if (f.cartValueInPaise !== undefined)
        row.cart_value_in_paise = f.cartValueInPaise;
      if (f.referrer !== undefined) row.referrer = f.referrer;
      if (f.utmSource !== undefined) row.utm_source = f.utmSource;
      if (f.utmMedium !== undefined) row.utm_medium = f.utmMedium;
      if (f.utmCampaign !== undefined) row.utm_campaign = f.utmCampaign;
      if (f.deviceType !== undefined) row.device_type = f.deviceType;
    }

    if (payload.stage) {
      const column = STAGE_COLUMN[payload.stage];
      if (column) row[column] = nowIso;
    }

    const { error } = await supabase
      .from("checkout_sessions")
      .upsert(row, { onConflict: "session_key" });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Never let telemetry failures look alarming — this endpoint is
    // best-effort background capture, so log and return a soft failure
    // rather than surfacing anything to the caller.
    console.error("checkout-session capture failed:", error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
