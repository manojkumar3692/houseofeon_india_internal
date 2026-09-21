// Store only observed acquisition data for this browser tab. These are source
// records for our checkout audit, not a claim about Meta's ad attribution.
const STORAGE_KEY = "houseofeon_visitor_attribution";

type VisitorAttribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
};

let memory: VisitorAttribution | undefined;

function bounded(value: unknown, max: number): string | undefined {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, max)
    : undefined;
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
  };
  const previous = read();
  const referrer = externalReferrer();
  // A new document reached from another site is a new observed entry. Don't
  // carry an old paid tag onto a later untagged Google/referral visit.
  const newExternalEntry = !memory && Boolean(referrer);
  const tagged = Object.values(incoming).some(Boolean);
  const changed = tagged && Object.entries(incoming).some(
    ([key, value]) => value !== previous?.[key as keyof VisitorAttribution]
  );

  // Internal navigation must not erase the observed source. A new tagged
  // visit replaces the entire UTM group: never mix two different campaigns.
  const attribution = previous && !changed && !newExternalEntry ? previous : {
    ...incoming,
    referrer,
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
