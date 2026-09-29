// Store only observed acquisition data for this browser tab. These are source
// records for our checkout audit, not a claim about Meta's ad attribution.
const STORAGE_KEY = "houseofeon_visitor_attribution";
const VISITOR_COOKIE = "hoe_vid";
const VISITOR_MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

export type VisitorAttribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  landingUrl?: string;
  fbclid?: string;
  fbp?: string;
  fbc?: string;
  visitorId?: string;
};

let memory: VisitorAttribution | undefined;

function bounded(value: unknown, max: number): string | undefined {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, max)
    : undefined;
}

function cookie(name: string): string | undefined {
  try {
    const prefix = `${encodeURIComponent(name)}=`;
    const value = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(prefix))
      ?.slice(prefix.length);
    return value ? bounded(decodeURIComponent(value), 500) : undefined;
  } catch {
    return undefined;
  }
}

function getVisitorId(): string | undefined {
  const existing = bounded(cookie(VISITOR_COOKIE), 100);
  if (existing) return existing;

  try {
    const value =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${VISITOR_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${VISITOR_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
    return value;
  } catch {
    return undefined;
  }
}

function landingUrl(): string | undefined {
  try {
    const base = `${window.location.protocol || "https:"}//${window.location.hostname}`;
    const url = new URL(window.location.href || `${base}${window.location.pathname}${window.location.search}`);
    const safe = new URL(url.origin + url.pathname);
    for (const key of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "fbclid",
    ]) {
      const value = bounded(url.searchParams.get(key), 500);
      if (value) safe.searchParams.set(key, value);
    }
    return bounded(safe.toString(), 1500);
  } catch {
    return bounded(window.location.pathname, 1500);
  }
}

function fbcFromClickId(fbclid: string | undefined): string | undefined {
  if (!fbclid) return undefined;
  return `fb.1.${Date.now()}.${fbclid}`;
}

function read(): VisitorAttribution | undefined {
  if (memory) return memory;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
    return {
      utmSource: bounded(value.utmSource, 200),
      utmMedium: bounded(value.utmMedium, 200),
      utmCampaign: bounded(value.utmCampaign, 200),
      referrer: bounded(value.referrer, 500),
      landingUrl: bounded(value.landingUrl, 1500),
      fbclid: bounded(value.fbclid, 500),
      fbp: bounded(value.fbp, 500),
      fbc: bounded(value.fbc, 500),
      visitorId: bounded(value.visitorId, 100),
    };
  } catch {
    return undefined;
  }
}

function externalReferrer(): string | undefined {
  try {
    const url = new URL(document.referrer);
    const host = window.location.hostname.replace(/^www\./, "");
    if (!["http:", "https:"].includes(url.protocol)) return undefined;
    if (url.hostname.replace(/^www\./, "") === host) return undefined;
    // Origin/path are enough for source auditing; omit query strings which
    // may contain customer information or other sites' private parameters.
    return bounded(`${url.origin}${url.pathname}`, 500);
  } catch {
    return undefined;
  }
}

export function captureVisitorAttribution(): VisitorAttribution {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const incoming = {
    utmSource: bounded(params.get("utm_source"), 200),
    utmMedium: bounded(params.get("utm_medium"), 200),
    utmCampaign: bounded(params.get("utm_campaign"), 200),
    fbclid: bounded(params.get("fbclid"), 500),
  };
  const previous = read();
  const referrer = externalReferrer();
  const visitorId = getVisitorId() || previous?.visitorId;
  const currentFbp = bounded(cookie("_fbp"), 500);
  const currentFbc = bounded(cookie("_fbc"), 500);
  const currentFbcMatchesClick = incoming.fbclid && currentFbc?.endsWith(`.${incoming.fbclid}`)
    ? currentFbc
    : undefined;
  // A new document reached from another site is a new observed entry. Don't
  // carry an old paid tag onto a later untagged Google/referral visit.
  const newExternalEntry = !memory && Boolean(referrer);
  const tagged = Object.values(incoming).some(Boolean);
  const changed = tagged && Object.entries(incoming).some(
    ([key, value]) => value !== previous?.[key as keyof VisitorAttribution]
  );

  // Internal navigation must not erase the observed source. A new tagged
  // visit replaces the entire UTM group: never mix two different campaigns.
  const newEntry = changed || newExternalEntry || !previous;
  const attribution = newEntry
    ? {
        ...incoming,
        referrer,
        landingUrl: landingUrl(),
        visitorId,
        fbp: currentFbp || previous?.fbp,
        // A pre-existing _fbc can still describe an older ad click while
        // Meta's script is loading. Prefer it only when it contains this
        // landing's fbclid; otherwise derive the new click cookie now.
        fbc: currentFbcMatchesClick || fbcFromClickId(incoming.fbclid) || currentFbc || previous?.fbc,
      }
    : {
        ...previous,
        visitorId,
        // Meta creates these cookies asynchronously after our first page
        // effect. Refresh them on every capture so checkout gets the values
        // even when the landing-page capture ran before fbevents.js loaded.
        fbp: currentFbp || previous.fbp,
        fbc: currentFbc || previous.fbc,
      };
  memory = attribution;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // In-memory fallback still works across client-side navigation when
    // storage is unavailable. Tracking must never interrupt checkout.
  }
  return { ...attribution };
}
