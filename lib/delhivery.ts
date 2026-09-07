import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendDelhiveryFailureEmail } from "@/lib/email";

const DELHIVERY_API_BASE = "https://track.delhivery.com";
const PICKUP_LOCATION = "HOUSE OF EON HUB";

// Fixed packaging instructions supplied by House of Eon.
const PACKAGE = {
  packagingType: "Flyer",
  boxes: 1,
  lengthCm: 25,
  breadthCm: 20,
  heightCm: 10,
  weightGrams: 499,
  shippingMode: "Surface",
} as const;

type OrderItem = {
  name?: string;
  product_name?: string;
  quantity?: number;
  qty?: number;
};

type PaidOrder = {
  id: string;
  order_number: string;
  order_type?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  customer_address?: string | null;
  customer_city?: string | null;
  customer_state?: string | null;
  customer_pincode?: string | null;
  items?: OrderItem[] | null;
  amount_in_paise?: number | null;
  payment_status?: string | null;
  payment_type?: string | null;
  balance_due_in_paise?: number | null;
  delhivery_status?: string | null;
  delhivery_attempts?: number | null;
};

type DelhiveryPackage = {
  status?: string;
  waybill?: string;
  remarks?: unknown;
  refnum?: string;
};

type DelhiveryCreateResponse = {
  success?: boolean;
  packages?: DelhiveryPackage[];
  error?: unknown;
  message?: unknown;
};

function errorText(value: unknown) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function productDescription(items: OrderItem[] | null | undefined) {
  if (!Array.isArray(items) || items.length === 0) return "House of Eon order";
  return items
    .map((item) => {
      const name = item.name || item.product_name || "Product";
      const quantity = item.quantity || item.qty || 1;
      return `${name} x ${quantity}`;
    })
    .join(", ");
}

function totalQuantity(items: OrderItem[] | null | undefined) {
  if (!Array.isArray(items)) return 1;
  return Math.max(
    1,
    items.reduce((sum, item) => sum + (item.quantity || item.qty || 1), 0)
  );
}

async function delhiveryFetch(path: string, init?: RequestInit) {
  const token = process.env.DELHIVERY_API_TOKEN;
  if (!token) throw new Error("DELHIVERY_API_TOKEN is not configured");

  const response = await fetch(`${DELHIVERY_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Token ${token}`,
      ...(init?.headers || {}),
    },
    signal: AbortSignal.timeout(20_000),
  });

  const text = await response.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      `Delhivery API ${response.status}: ${errorText(data).slice(0, 1000)}`
    );
  }

  return data;
}

async function assertServiceable(order: PaidOrder) {
  const pincode = String(order.customer_pincode || "").trim();
  if (!/^\d{6}$/.test(pincode)) {
    throw new Error(`Invalid delivery pincode: ${pincode || "missing"}`);
  }

  const data = await delhiveryFetch(
    `/c/api/pin-codes/json/?filter_codes=${encodeURIComponent(pincode)}`
  );
  const postalCode = data?.delivery_codes?.[0]?.postal_code;
  if (!postalCode) {
    throw new Error(`Pincode ${pincode} is not serviceable by Delhivery`);
  }

  const isPartialCod = order.payment_type === "partial_cod";
  const flag = isPartialCod ? postalCode.cod : postalCode.pre_paid;
  if (String(flag).toUpperCase() !== "Y") {
    throw new Error(
      `Pincode ${pincode} is not serviceable for ${
        isPartialCod ? "COD" : "prepaid"
      } shipments`
    );
  }
}

async function manifestShipment(order: PaidOrder) {
  const isPartialCod = order.payment_type === "partial_cod";
  const codAmount = isPartialCod
    ? Math.max(0, Number(order.balance_due_in_paise || 0)) / 100
    : 0;
  const totalAmount = Math.max(0, Number(order.amount_in_paise || 0)) / 100;
  const pickupName = process.env.DELHIVERY_PICKUP_LOCATION || PICKUP_LOCATION;

  const shipment: Record<string, string | number> = {
    order: order.order_number,
    name: order.customer_name || "Customer",
    phone: order.customer_phone || "",
    add: order.customer_address || "",
    city: order.customer_city || "",
    state: order.customer_state || "",
    pin: order.customer_pincode || "",
    country: "India",
    payment_mode: isPartialCod ? "COD" : "Prepaid",
    cod_amount: codAmount,
    total_amount: totalAmount,
    products_desc: productDescription(order.items),
    quantity: totalQuantity(order.items),
    waybill: "",
    packaging_type: PACKAGE.packagingType,
    shipment_length: PACKAGE.lengthCm,
    shipment_width: PACKAGE.breadthCm,
    shipment_height: PACKAGE.heightCm,
    weight: PACKAGE.weightGrams,
    shipping_mode: PACKAGE.shippingMode,
    seller_name: process.env.DELHIVERY_SELLER_NAME || "House of Eon",
    seller_inv: order.order_number,
    address_type: "home",
  };

  const optionalFields: Record<string, string | undefined> = {
    return_add: process.env.DELHIVERY_RETURN_ADDRESS,
    return_city: process.env.DELHIVERY_RETURN_CITY,
    return_state: process.env.DELHIVERY_RETURN_STATE,
    return_pin: process.env.DELHIVERY_RETURN_PINCODE,
    return_phone: process.env.DELHIVERY_RETURN_PHONE,
    seller_add: process.env.DELHIVERY_RETURN_ADDRESS,
  };
  Object.entries(optionalFields).forEach(([key, value]) => {
    if (value) shipment[key] = value;
  });

  const payload = {
    shipments: [shipment],
    pickup_location: { name: pickupName },
  };
  const form = new URLSearchParams({
    format: "json",
    data: JSON.stringify(payload),
  });

  const result = (await delhiveryFetch("/api/cmu/create.json", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  })) as DelhiveryCreateResponse;

  const packageResult = result?.packages?.[0];
  const success =
    result?.success === true &&
    String(packageResult?.status || "").toLowerCase() === "success" &&
    Boolean(packageResult?.waybill);

  if (!success) {
    throw new Error(
      `Shipment manifestation failed: ${errorText(
        packageResult?.remarks || result?.error || result?.message || result
      ).slice(0, 1000)}`
    );
  }

  return packageResult!.waybill!;
}

async function recordFailure(order: PaidOrder, reason: string) {
  const supabase = getSupabaseAdmin();
  await supabase
    .from("orders")
    .update({ delhivery_status: "failed", delhivery_error: reason })
    .eq("id", order.id);

  await sendDelhiveryFailureEmail({
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    pincode: order.customer_pincode,
    paymentType: order.payment_type,
    reason,
  });
}

/**
 * Creates one Delhivery shipment for a confirmed-paid order. The conditional
 * state transition is the idempotency lock: concurrent/retried webhooks can
 * race here, but only one of them can move pending -> processing.
 */
export async function createDelhiveryShipmentForPaidOrder(orderId: string) {
  const supabase = getSupabaseAdmin();
  const { data: found, error: fetchError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (fetchError || !found) {
    console.error("Delhivery: paid order not found", orderId, fetchError);
    return;
  }

  const order = found as PaidOrder;
  if (order.payment_status !== "paid" || order.delhivery_status === "created") {
    return;
  }

  const attempts = Number(order.delhivery_attempts || 0) + 1;
  const { data: claimed, error: claimError } = await supabase
    .from("orders")
    .update({
      delhivery_status: "processing",
      delhivery_attempts: attempts,
      delhivery_error: null,
    })
    .eq("id", order.id)
    .in("delhivery_status", ["pending", "failed"])
    .select("*")
    .maybeSingle();

  if (claimError) {
    console.error("Delhivery: could not claim order", order.order_number, claimError);
    return;
  }
  if (!claimed) return;

  const claimedOrder = claimed as PaidOrder;
  try {
    await assertServiceable(claimedOrder);
    const waybill = await manifestShipment(claimedOrder);
    const trackingUrl = `https://www.delhivery.com/track/package/${encodeURIComponent(
      waybill
    )}`;

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        delhivery_status: "created",
        delhivery_waybill: waybill,
        delhivery_tracking_url: trackingUrl,
        delhivery_created_at: new Date().toISOString(),
        delhivery_error: null,
        tracking_url: trackingUrl,
      })
      .eq("id", claimedOrder.id);

    if (updateError) throw updateError;
  } catch (error) {
    const reason = error instanceof Error ? error.message : errorText(error);
    console.error(
      `Delhivery shipment failed for ${claimedOrder.order_number}:`,
      reason
    );
    await recordFailure(claimedOrder, reason);
  }
}
