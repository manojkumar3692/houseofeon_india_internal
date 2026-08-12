// ---------------------------------------------------------------------------
// Lightweight session/context state for EON Concierge — no new backend, just
// sessionStorage/localStorage, mirroring the existing pattern in
// lib/checkoutSession.ts (getCheckoutSessionKey/getUtmParams). Everything
// here is scoped to one browser tab session; nothing sensitive is stored.
// ---------------------------------------------------------------------------

const SESSION_ID_KEY = "eon_concierge_session_id";
const LANDING_CONTEXT_KEY = "eon_concierge_landing_context";
const VARIANT_KEY = "eon_concierge_variant";
const ENGAGEMENT_KEY = "eon_concierge_engaged";

export type LandingContext = {
  utmSource?: string;
  utmCampaign?: string;
  utmContent?: string;
  referrer?: string;
  landingPath?: string;
};

export function getConciergeSessionId(): string {
  if (typeof window === "undefined") return "";

  try {
    const existing = window.sessionStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `eon-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    window.sessionStorage.setItem(SESSION_ID_KEY, id);
    return id;
  } catch {
    return "";
  }
}

// Captures UTM params + referrer + landing path exactly once per browser
// session (first call wins) — so if the customer navigates deeper into the
// site before opening the concierge, we still know which ad brought them
// in. This is read silently for context continuity; the concierge is
// instructed never to surface it to the customer directly.
export function captureLandingContext(): LandingContext {
  if (typeof window === "undefined") return {};

  try {
    const existing = window.sessionStorage.getItem(LANDING_CONTEXT_KEY);
    if (existing) return JSON.parse(existing);

    const params = new URLSearchParams(window.location.search);
    const context: LandingContext = {
      utmSource: params.get("utm_source") || undefined,
      utmCampaign: params.get("utm_campaign") || undefined,
      utmContent: params.get("utm_content") || undefined,
      referrer: document.referrer || undefined,
      landingPath: window.location.pathname,
    };

    window.sessionStorage.setItem(LANDING_CONTEXT_KEY, JSON.stringify(context));
    return context;
  } catch {
    return {};
  }
}

export type ConciergeVariant = {
  // "A" = concierge hidden entirely (the no-concierge control group).
  // "B" / "C" = concierge shown with a different opening line.
  group: "A" | "B" | "C";
};

// A/B testing is OFF by default (every visitor gets the concierge, opening
// line B) — flip NEXT_PUBLIC_CONCIERGE_AB_TEST=true to start a real
// experiment. Assignment is randomized once per browser and persisted in
// localStorage so a given visitor stays in the same group across sessions,
// which is what makes a before/after conversion comparison valid.
export function getConciergeVariant(): ConciergeVariant {
  const abTestEnabled = process.env.NEXT_PUBLIC_CONCIERGE_AB_TEST === "true";

  if (!abTestEnabled) return { group: "B" };
  if (typeof window === "undefined") return { group: "B" };

  try {
    const existing = window.localStorage.getItem(VARIANT_KEY);
    if (existing === "A" || existing === "B" || existing === "C") {
      return { group: existing };
    }

    const roll = Math.random();
    const group: ConciergeVariant["group"] = roll < 1 / 3 ? "A" : roll < 2 / 3 ? "B" : "C";
    window.localStorage.setItem(VARIANT_KEY, group);
    return { group };
  } catch {
    return { group: "B" };
  }
}

// Marks that this browser session had a real concierge interaction (opened
// it, or it recommended/discussed a product) — read back at purchase time
// so analytics can report "purchase after concierge interaction" without
// needing a server-side session store.
export function markConciergeEngaged(productNames: string[] = []) {
  if (typeof window === "undefined") return;

  try {
    const existingRaw = window.sessionStorage.getItem(ENGAGEMENT_KEY);
    const existing: string[] = existingRaw ? JSON.parse(existingRaw) : [];
    const merged = Array.from(new Set([...existing, ...productNames]));
    window.sessionStorage.setItem(ENGAGEMENT_KEY, JSON.stringify(merged));
  } catch {
    // Non-critical — worst case this purchase doesn't get attributed.
  }
}

export function getConciergeEngagement(): { engaged: boolean; products: string[] } {
  if (typeof window === "undefined") return { engaged: false, products: [] };

  try {
    const raw = window.sessionStorage.getItem(ENGAGEMENT_KEY);
    if (!raw) return { engaged: false, products: [] };
    const products: string[] = JSON.parse(raw);
    return { engaged: true, products };
  } catch {
    return { engaged: false, products: [] };
  }
}
