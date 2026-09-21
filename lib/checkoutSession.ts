// Client-side helpers for progressively capturing the checkout funnel —
// starting from page view / phone entry, not just the final "Pay" click.
// Every capture call here is fire-and-forget: it never blocks the checkout
// UI and silently no-ops on failure, since this is background telemetry,
// not something the actual purchase flow should ever depend on.

import { captureVisitorAttribution } from "@/lib/visitorAttribution";

const SESSION_STORAGE_KEY = "houseofeon_checkout_session_key";

export type CheckoutCartItem = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
};

export type CheckoutStage =
  | "page_viewed"
  | "phone_captured"
  | "submitted"
  | "razorpay_opened"
  | "razorpay_dismissed"
  | "payment_failed";

export type CheckoutSessionFields = Partial<{
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  paymentMethod: string;
  paymentFailedReason: string;
  lastActiveField: string;
  cartItems: CheckoutCartItem[];
  cartValueInPaise: number;
  referrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  deviceType: string;
}>;

// One key per browser tab/session, persisted only for the duration of the
// tab (sessionStorage, not localStorage) — every capture call reuses it so
// they all land on the same checkout_sessions row instead of creating a
// fresh one each time.
export function getCheckoutSessionKey(): string {
  if (typeof window === "undefined") return "";

  try {
    let key = window.sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (!key) {
      key =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      window.sessionStorage.setItem(SESSION_STORAGE_KEY, key);
    }

    return key;
  } catch {
    return "";
  }
}

export function getDeviceType(): string {
  if (typeof window === "undefined") return "unknown";
  return window.innerWidth < 768 ? "mobile" : "desktop";
}

export function getUtmParams(): Pick<
  CheckoutSessionFields,
  "utmSource" | "utmMedium" | "utmCampaign"
> {
  if (typeof window === "undefined") return {};

  const campaign = captureVisitorAttribution();

  return {
    utmSource: campaign.utmSource,
    utmMedium: campaign.utmMedium,
    utmCampaign: campaign.utmCampaign,
  };
}

function getCheckoutAttributionFields(): CheckoutSessionFields {
  const attribution = captureVisitorAttribution();
  if (!Object.values(attribution).some(Boolean)) return {};
  // Empty strings clear obsolete values when a different observed campaign
  // omits a parameter. Undefined would leave the previous database value intact.
  return {
    utmSource: attribution.utmSource || "",
    utmMedium: attribution.utmMedium || "",
    utmCampaign: attribution.utmCampaign || "",
    referrer: attribution.referrer || "",
  };
}

// Regular capture — used for every stage except the moment the page is
// closing. `keepalive: true` gives it a better chance of completing even
// during a same-tab client-side route change right after.
export function captureCheckoutSession(
  stage?: CheckoutStage,
  fields?: CheckoutSessionFields
) {
  if (typeof window === "undefined") return;

  const sessionKey = getCheckoutSessionKey();
  if (!sessionKey) return;

  try {
    fetch("/api/checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Repeat the observed source on later saves as well: the first page-view
      // request can fail while a later field save succeeds.
      body: JSON.stringify({
        sessionKey, stage,
        fields: { ...fields, ...getCheckoutAttributionFields() },
      }),
      keepalive: true,
    }).catch(() => {
      // Silent — background telemetry only.
    });
  } catch {
    // Silent.
  }
}

// Used specifically when the tab is closing / backgrounding (visibilitychange
// -> hidden, or pagehide). A normal fetch can be cancelled mid-flight the
// instant the page unloads; sendBeacon is built exactly for this and
// reliably queues the request even as the page goes away.
export function captureCheckoutSessionBeacon(fields?: CheckoutSessionFields) {
  if (typeof window === "undefined" || !navigator.sendBeacon) return;

  const sessionKey = getCheckoutSessionKey();
  if (!sessionKey) return;

  try {
    const blob = new Blob([JSON.stringify({
      sessionKey,
      fields: { ...fields, ...getCheckoutAttributionFields() },
    })], {
      type: "application/json",
    });
    navigator.sendBeacon("/api/checkout-session", blob);
  } catch {
    // Silent.
  }
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// Meta's Advanced Matching wants a lowercase/trimmed email, SHA-256 hashed.
export async function hashEmailForMeta(email: string): Promise<string> {
  return sha256Hex(email.trim().toLowerCase());
}

// Meta's Advanced Matching wants digits-only, with country code, no leading
// + or 0. Store is India-only, so a bare 10-digit number gets 91 prefixed.
export async function hashPhoneForMeta(phone: string): Promise<string> {
  let digits = phone.replace(/[^0-9]/g, "");
  if (digits.length === 10) digits = `91${digits}`;
  return sha256Hex(digits);
}
