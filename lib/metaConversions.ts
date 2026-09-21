import { createHash } from "crypto";
import { isIP } from "net";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { metaPurchaseEventId } from "@/lib/metaPurchaseId";

const PRODUCTION_ORIGIN = "https://www.houseofeon.in";
const TABLE = "meta_purchase_events";

type BrowserContext = {
  fbp?: string;
  fbc?: string;
  client_user_agent?: string;
  client_ip_address?: string;
};

type TrialOrder = {
  order_number: string;
  order_type?: string | null;
  created_at: string;
  payment_status: string;
  payment_captured_at?: string | null;
  amount_in_paise: number;
  customer_phone?: string | null;
  customer_email?: string | null;
  trial_selected_scents?: string[] | null;
};

function enabled(requestUrl: string): boolean {
  if (process.env.META_CAPI_ENABLED !== "true") return false;
  if (process.env.NODE_ENV !== "production") return false;
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") return false;
  if (!process.env.RAZORPAY_KEY_ID?.startsWith("rzp_live_")) return false;
  try {
    return new URL(requestUrl).origin === PRODUCTION_ORIGIN;
  } catch {
    return false;
  }
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function browserContext(request: Request): BrowserContext {
  const cookies = new Map(
    (request.headers.get("cookie") || "").split(";").map((entry) => {
      const separator = entry.indexOf("=");
      return [entry.slice(0, separator).trim(), entry.slice(separator + 1).trim()];
    })
  );
  const context: BrowserContext = {};
  for (const [cookie, field] of [["_fbp", "fbp"], ["_fbc", "fbc"]] as const) {
    const value = cookies.get(cookie);
    if (value && value.length <= 2048 && /^fb\.\d+\.\d{13}\.[A-Za-z0-9_-]+$/.test(value)) {
      context[field] = value;
    }
  }
  // Only derive fbc from an actual click ID. Never fabricate click attribution.
  if (!context.fbc) {
    try {
      const source = new URL(request.headers.get("referer") || "");
      const clickId = source.searchParams.get("fbclid");
      if (source.origin === PRODUCTION_ORIGIN && clickId && /^[A-Za-z0-9_-]{1,1000}$/.test(clickId)) {
        context.fbc = `fb.1.${Date.now()}.${clickId}`;
      }
    } catch { /* A referrer is optional. */ }
  }
  const userAgent = request.headers.get("user-agent");
  if (userAgent) context.client_user_agent = userAgent.slice(0, 1024);
  // Trust only Vercel's platform-supplied header, never arbitrary forwarded IPs.
  const ip = process.env.VERCEL === "1"
    ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim()
    : undefined;
  if (ip && isIP(ip)) context.client_ip_address = ip;
  return context;
}

// Separate from orders: a tracking migration/configuration failure must never
// make order creation fail or release a successful order's inventory reservation.
export async function saveTrialMetaContext(orderNumber: string, request: Request): Promise<void> {
  if (!enabled(request.url)) return;
  try {
    const { error } = await getSupabaseAdmin().from(TABLE).upsert({
      order_number: orderNumber,
      event_id: metaPurchaseEventId(orderNumber),
      browser_context: browserContext(request),
    }, { onConflict: "order_number", ignoreDuplicates: true })
      .abortSignal(AbortSignal.timeout(1500));
    if (error) throw new Error("context_storage_failed");
  } catch {
    // No customer data, provider responses or credentials in tracking logs.
    console.error("Meta purchase: browser context could not be saved", orderNumber);
  }
}

/** Sends only paid trial orders with a persisted capture timestamp. Called by
 * the signed payment webhook and the authenticated recovery worker. */
export async function sendTrialMetaPurchase(order: TrialOrder, requestUrl: string): Promise<void> {
  if (!enabled(requestUrl) || order.order_type !== "trial_pack") return;
  if (order.payment_status !== "paid" || !order.payment_captured_at) return;

  // A rollout cutoff prevents replaying legacy browser purchases which had no
  // eventID and therefore cannot be deduplicated against a new server event.
  const start = Date.parse(process.env.META_CAPI_START_AT || "");
  const created = Date.parse(order.created_at);
  if (!Number.isFinite(start)) throw new Error("Meta purchase: rollout timestamp missing or invalid");
  if (!Number.isFinite(created)) throw new Error("Meta purchase: invalid order timestamp");
  if (created < start) return;

  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  const version = process.env.META_CAPI_API_VERSION || "v23.0";
  if (!/^\d+$/.test(pixelId) || !token || !/^v\d+\.0$/.test(version)) {
    throw new Error("Meta purchase: server configuration incomplete");
  }

  const supabase = getSupabaseAdmin();
  const eventId = metaPurchaseEventId(order.order_number);
  // Also supports successful payments whose browser/context write was lost.
  const { error: insertError } = await supabase.from(TABLE).upsert({
    order_number: order.order_number,
    event_id: eventId,
  }, { onConflict: "order_number", ignoreDuplicates: true });
  if (insertError) throw new Error("Meta purchase: delivery record unavailable");
  const { data: delivery, error: readError } = await supabase.from(TABLE)
    .select("browser_context,sent_at")
    .eq("order_number", order.order_number).single();
  if (readError || !delivery) throw new Error("Meta purchase: delivery record unavailable");
  if (delivery.sent_at) return;

  // Rotate attempted records behind untouched ones so one bad record cannot
  // starve newer purchases in the scheduled worker's bounded batch.
  const { error: attemptError } = await supabase.from(TABLE).update({
    last_attempt_at: new Date().toISOString(),
  }).eq("order_number", order.order_number);
  if (attemptError) throw new Error("Meta purchase: attempt could not be saved");

  const eventTime = Math.floor(Date.parse(order.payment_captured_at) / 1000);
  if (!Number.isFinite(eventTime) || !Number.isSafeInteger(order.amount_in_paise) || order.amount_in_paise <= 0) {
    throw new Error("Meta purchase: invalid confirmed order");
  }
  const userData: Record<string, string | string[]> = {};
  const email = order.customer_email?.trim().toLowerCase();
  let phone = order.customer_phone?.replace(/\D/g, "") || "";
  if (phone.length === 10) phone = `91${phone}`;
  if (phone.startsWith("0") && phone.length === 11) phone = `91${phone.slice(1)}`;
  if (email) userData.em = [hash(email)];
  if (phone) userData.ph = [hash(phone)];
  const context = delivery.browser_context as BrowserContext | null;
  for (const field of ["fbp", "fbc", "client_user_agent", "client_ip_address"] as const) {
    if (context?.[field]) userData[field] = context[field];
  }
  const scentIds = order.trial_selected_scents?.length ? order.trial_selected_scents : ["trial-pack"];
  const value = order.amount_in_paise / 100;
  const event = {
    event_name: "Purchase",
    event_id: eventId,
    event_time: eventTime,
    action_source: "website",
    event_source_url: `${PRODUCTION_ORIGIN}/trial-pack`,
    user_data: userData,
    custom_data: {
      currency: "INR",
      value,
      order_id: order.order_number,
      content_type: "product",
      content_ids: scentIds,
      contents: scentIds.map((id) => ({ id, quantity: 1, item_price: value / scentIds.length })),
      num_items: scentIds.length,
    },
  };

  let failure = "network_or_timeout";
  try {
    const response = await fetch(`https://graph.facebook.com/${version}/${pixelId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ data: [event] }),
      signal: AbortSignal.timeout(2500),
      cache: "no-store",
    });
    failure = `http_${response.status}`;
    const result = await response.json();
    if (!response.ok || result.error || result.events_received !== 1) {
      failure = `rejected_${response.status}`;
      throw new Error("Meta did not acknowledge the purchase");
    }
    failure = "acknowledgement_storage_failed";
    const { error } = await supabase.from(TABLE).update({
      sent_at: new Date().toISOString(),
      last_attempt_at: new Date().toISOString(),
      last_error: null,
    }).eq("order_number", order.order_number);
    if (error) throw new Error("Acknowledgement could not be saved");
  } catch {
    // A retry uses the same event ID and original capture time even when Meta
    // accepted the previous request but the response/database write was lost.
    try {
      await supabase.from(TABLE).update({
        last_attempt_at: new Date().toISOString(), last_error: failure,
      }).eq("order_number", order.order_number);
    } catch { /* The scheduled worker can retry when the database recovers. */ }
    throw new Error(`Meta purchase: ${failure}`);
  }
}

// Invoked by a scheduler, independently of payment processing. The database
// backfill also recovers payments whose after() task/context write never ran.
export async function retryTrialMetaPurchases(requestUrl: string) {
  if (!enabled(requestUrl)) return { enabled: false, attempted: 0, failed: 0 };
  const start = Date.parse(process.env.META_CAPI_START_AT || "");
  if (!Number.isFinite(start)) throw new Error("Meta purchase: invalid rollout timestamp");
  const supabase = getSupabaseAdmin();
  const { error: queueError } = await supabase.rpc("enqueue_trial_meta_purchases", {
    p_start_at: new Date(start).toISOString(),
  });
  if (queueError) throw new Error("Meta purchase: recovery queue unavailable");

  const { data, error } = await supabase.from(TABLE)
    .select("order_number,orders!inner(*)")
    .is("sent_at", null)
    .eq("orders.order_type", "trial_pack")
    .eq("orders.payment_status", "paid")
    .not("orders.payment_captured_at", "is", null)
    .gte("orders.created_at", new Date(start).toISOString())
    .order("last_attempt_at", { ascending: true, nullsFirst: true })
    .limit(10);
  if (error) throw new Error("Meta purchase: recovery queue could not be read");
  let failed = 0;
  for (const row of data || []) {
    try {
      // Supabase can represent a relationship as an object or a one-item array.
      const order = Array.isArray(row.orders) ? row.orders[0] : row.orders;
      if (!order) throw new Error("Order unavailable");
      await sendTrialMetaPurchase(order as unknown as TrialOrder, requestUrl);
    } catch {
      failed++;
      console.error("Meta purchase recovery failed", row.order_number);
    }
  }
  return { enabled: true, attempted: data?.length || 0, failed };
}
