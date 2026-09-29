import "server-only";

import { createHash, randomUUID } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type OrderItem = {
  productId?: string;
  id?: string;
  name?: string;
  price?: number;
  quantity?: number;
  lineTotal?: number;
};

type OrderRecord = {
  id?: string;
  order_number: string;
  order_type?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  customer_city?: string | null;
  customer_state?: string | null;
  customer_pincode?: string | null;
  items?: OrderItem[] | null;
  trial_selected_scents?: string[] | null;
  amount_in_paise: number;
  payment_status?: string | null;
  payment_captured_at?: string | null;
};

type AttributionRecord = {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  landing_url?: string | null;
  referrer?: string | null;
  visitor_id?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  client_ip_address?: string | null;
  client_user_agent?: string | null;
};

type OutboxRecord = {
  id: string;
  event_id: string;
  event_name: "Purchase";
  order_number: string;
  event_time: string;
  attempts: number;
  lease_token: string;
};

type MetaConfig = {
  accessToken: string;
  pixelId: string;
  graphVersion: string;
  testEventCode?: string;
};

type DeliveryResult = {
  ok: boolean;
  retryable: boolean;
  httpStatus?: number;
  response?: Record<string, unknown>;
  error?: string;
};

const MAX_META_EVENT_AGE_MS = 6 * 24 * 60 * 60 * 1000;

function value(value: unknown, max = 500): string | undefined {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, max)
    : undefined;
}

function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

function normalizePhone(input: string): string {
  let digits = input.replace(/[^0-9]/g, "");
  if (digits.length === 10) digits = `91${digits}`;
  return digits.replace(/^0+/, "");
}

function normalizeText(input: string): string {
  return input
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function hashField(
  input: string | null | undefined,
  normalize: (input: string) => string
): string[] | undefined {
  if (!input) return undefined;
  const normalized = normalize(input);
  return normalized ? [sha256(normalized)] : undefined;
}

function validMetaCookie(input: string | null | undefined): string | undefined {
  const bounded = value(input, 500);
  return bounded && /^fb\.1\.\d+\..+/.test(bounded) ? bounded : undefined;
}

function validUrl(input: string | null | undefined): string | undefined {
  try {
    const candidate = value(input, 1500);
    if (!candidate) return undefined;
    const url = new URL(candidate);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function customerNameParts(name: string | null | undefined) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0],
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : undefined,
  };
}

function contentForOrder(order: OrderRecord) {
  const selectedScents = Array.isArray(order.trial_selected_scents)
    ? order.trial_selected_scents.filter((id): id is string => typeof id === "string" && Boolean(id))
    : [];

  if (order.order_type === "trial_pack" && selectedScents.length) {
    const itemPrice = order.amount_in_paise / 100 / selectedScents.length;
    return selectedScents.map((id) => ({ id, quantity: 1, item_price: itemPrice }));
  }

  return (Array.isArray(order.items) ? order.items : [])
    .map((item) => {
      const id = value(item.productId || item.id, 200);
      if (!id) return null;
      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const price = Number(item.price);
      return {
        id,
        quantity,
        ...(Number.isFinite(price) && price >= 0 ? { item_price: price } : {}),
      };
    })
    .filter(Boolean) as Array<{ id: string; quantity: number; item_price?: number }>;
}

export function buildMetaPurchasePayload(
  order: OrderRecord,
  attribution: AttributionRecord | null,
  eventTime: string
) {
  const contact = attribution || {};
  const fullName = order.customer_name || contact.name;
  const { firstName, lastName } = customerNameParts(fullName);
  const visitorOrOrderId = contact.visitor_id || order.order_number;
  const contents = contentForOrder(order);
  const fallbackSource = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.houseofeon.in"}/checkout`;

  const userData = Object.fromEntries(
    Object.entries({
      em: hashField(order.customer_email || contact.email, normalizeEmail),
      ph: hashField(order.customer_phone || contact.phone, normalizePhone),
      fn: hashField(firstName, normalizeText),
      ln: hashField(lastName, normalizeText),
      ct: hashField(order.customer_city || contact.city, normalizeText),
      st: hashField(order.customer_state || contact.state, normalizeText),
      zp: hashField(order.customer_pincode || contact.pincode, normalizeText),
      country: [sha256("in")],
      external_id: [sha256(visitorOrOrderId)],
      fbp: validMetaCookie(contact.fbp),
      fbc: validMetaCookie(contact.fbc),
      client_ip_address: value(contact.client_ip_address, 100),
      client_user_agent: value(contact.client_user_agent, 1000),
    }).filter(([, fieldValue]) => fieldValue !== undefined)
  );

  return {
    event_name: "Purchase",
    event_time: Math.floor(new Date(eventTime).getTime() / 1000),
    event_id: order.order_number,
    action_source: "website",
    event_source_url: validUrl(contact.landing_url) || validUrl(fallbackSource),
    user_data: userData,
    custom_data: {
      currency: "INR",
      value: order.amount_in_paise / 100,
      order_id: order.order_number,
      content_type: "product",
      content_ids: contents.map((item) => item.id),
      contents,
      num_items: contents.reduce((sum, item) => sum + item.quantity, 0),
    },
  };
}

function configuration(): MetaConfig | null {
  const accessToken = value(process.env.META_CONVERSIONS_ACCESS_TOKEN, 2000);
  const pixelId = value(
    process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID,
    100
  );
  if (!accessToken || !pixelId) return null;

  const configuredVersion = value(process.env.META_GRAPH_API_VERSION, 20) || "v25.0";
  const graphVersion = /^v\d+\.\d+$/.test(configuredVersion) ? configuredVersion : "v25.0";
  return {
    accessToken,
    pixelId,
    graphVersion,
    testEventCode: value(process.env.META_TEST_EVENT_CODE, 100),
  };
}

function safeResponse(payload: unknown): Record<string, unknown> | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return undefined;
  const source = payload as Record<string, any>;
  const error = source.error && typeof source.error === "object"
    ? {
        message: value(source.error.message, 500),
        type: value(source.error.type, 100),
        code: Number.isFinite(Number(source.error.code)) ? Number(source.error.code) : undefined,
        error_subcode: Number.isFinite(Number(source.error.error_subcode))
          ? Number(source.error.error_subcode)
          : undefined,
        fbtrace_id: value(source.error.fbtrace_id, 200),
      }
    : undefined;
  return Object.fromEntries(
    Object.entries({
      events_received: Number.isFinite(Number(source.events_received))
        ? Number(source.events_received)
        : undefined,
      messages: Array.isArray(source.messages) ? source.messages.slice(0, 20) : undefined,
      fbtrace_id: value(source.fbtrace_id, 200),
      error,
    }).filter(([, fieldValue]) => fieldValue !== undefined)
  );
}

async function postToMeta(
  config: MetaConfig,
  event: ReturnType<typeof buildMetaPurchasePayload>
): Promise<DeliveryResult> {
  const body: Record<string, unknown> = { data: [event] };
  if (config.testEventCode) body.test_event_code = config.testEventCode;

  try {
    const response = await fetch(
      `https://graph.facebook.com/${config.graphVersion}/${encodeURIComponent(config.pixelId)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      }
    );
    const payload = await response.json().catch(() => null);
    const sanitized = safeResponse(payload);
    if (response.ok) {
      return { ok: true, retryable: false, httpStatus: response.status, response: sanitized };
    }
    const message = value((payload as any)?.error?.message, 500) || `Meta returned HTTP ${response.status}`;
    return {
      ok: false,
      retryable: response.status === 408 || response.status === 429 || response.status >= 500,
      httpStatus: response.status,
      response: sanitized,
      error: message,
    };
  } catch (error) {
    return {
      ok: false,
      retryable: true,
      error: value(error instanceof Error ? error.message : "Meta request failed", 500),
    };
  }
}

function retryAt(attempts: number): string {
  const minutes = [1, 5, 15, 60, 360, 720][Math.min(Math.max(attempts - 1, 0), 5)];
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

export async function enqueueMetaPurchase(order: OrderRecord) {
  if (!order.order_number || !order.payment_captured_at) return false;
  const { error } = await getSupabaseAdmin()
    .from("meta_conversion_outbox")
    .upsert(
      {
        event_id: order.order_number,
        event_name: "Purchase",
        order_number: order.order_number,
        event_time: order.payment_captured_at,
      },
      { onConflict: "event_id", ignoreDuplicates: true }
    );
  if (error) throw error;
  return true;
}

async function recoverMissingPurchases() {
  const db = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - MAX_META_EVENT_AGE_MS).toISOString();
  const { data, error } = await db
    .from("orders")
    .select("order_number,payment_captured_at")
    .eq("payment_status", "paid")
    .not("payment_captured_at", "is", null)
    .gte("payment_captured_at", cutoff)
    .order("payment_captured_at", { ascending: true })
    .limit(100);
  if (error) throw error;

  const rows = (data || []).map((order: any) => ({
    event_id: order.order_number,
    event_name: "Purchase",
    order_number: order.order_number,
    event_time: order.payment_captured_at,
  }));
  if (!rows.length) return 0;
  const { error: insertError } = await db
    .from("meta_conversion_outbox")
    .upsert(rows, { onConflict: "event_id", ignoreDuplicates: true });
  if (insertError) throw insertError;
  return rows.length;
}

async function claimOne(): Promise<OutboxRecord | null> {
  const leaseToken = randomUUID();
  const { data, error } = await getSupabaseAdmin().rpc("claim_meta_conversion", {
    p_lease_token: leaseToken,
    p_lease_seconds: 120,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row ? ({ ...row, lease_token: leaseToken } as OutboxRecord) : null;
}

async function attributionForOrder(orderNumber: string): Promise<AttributionRecord | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("checkout_sessions")
    .select(
      "email,phone,name,city,state,pincode,landing_url,referrer,visitor_id,fbp,fbc,client_ip_address,client_user_agent"
    )
    .eq("order_number", orderNumber)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as AttributionRecord | null;
}

async function finishAttempt(row: OutboxRecord, result: DeliveryResult) {
  const now = new Date().toISOString();
  const update = result.ok
    ? {
        status: "delivered",
        delivered_at: now,
        next_attempt_at: null,
        lease_token: null,
        lease_until: null,
        last_http_status: result.httpStatus || null,
        last_error: null,
        meta_response: result.response || null,
        updated_at: now,
      }
    : {
        status: result.retryable ? "pending" : "permanent_failure",
        next_attempt_at: result.retryable ? retryAt(row.attempts) : null,
        lease_token: null,
        lease_until: null,
        last_http_status: result.httpStatus || null,
        last_error: value(result.error, 500) || "Meta delivery failed",
        meta_response: result.response || null,
        updated_at: now,
      };

  const { error } = await getSupabaseAdmin()
    .from("meta_conversion_outbox")
    .update(update)
    .eq("id", row.id)
    .eq("lease_token", row.lease_token);
  if (error) throw error;
}

export async function deliverPendingMetaConversions(limit = 10) {
  const config = configuration();
  if (!config) return { delivered: 0, failed: 0, skipped: "Meta CAPI is not configured" };

  let delivered = 0;
  let failed = 0;
  for (let count = 0; count < Math.max(1, Math.min(limit, 25)); count++) {
    const row = await claimOne();
    if (!row) break;

    try {
      const db = getSupabaseAdmin();
      const { data: order, error } = await db
        .from("orders")
        .select("*")
        .eq("order_number", row.order_number)
        .single();
      if (error || !order) throw error || new Error("Order not found");
      if (order.payment_status !== "paid" || !order.payment_captured_at) {
        await finishAttempt(row, {
          ok: false,
          retryable: false,
          error: "Order is not authoritatively captured",
        });
        failed++;
        continue;
      }

      const attribution = await attributionForOrder(row.order_number);
      const event = buildMetaPurchasePayload(order, attribution, row.event_time);
      const result = await postToMeta(config, event);
      await finishAttempt(row, result);
      if (result.ok) delivered++;
      else failed++;
    } catch (error) {
      await finishAttempt(row, {
        ok: false,
        retryable: true,
        error: error instanceof Error ? error.message : "Meta delivery worker failed",
      });
      failed++;
    }
  }

  return { delivered, failed };
}

export async function runMetaConversionWorker(limit = 10) {
  if (!configuration()) {
    return { recovered: 0, delivered: 0, failed: 0, skipped: "Meta CAPI is not configured" };
  }
  const recovered = await recoverMissingPurchases();
  const result = await deliverPendingMetaConversions(limit);
  return { recovered, ...result };
}
