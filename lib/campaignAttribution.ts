export const DIWALI_CAMPAIGN_ID = "diwali_2026";
const STORAGE_KEY = "houseofeon_campaign_attribution";

export type CampaignAttribution = {
  campaignId: string;
  landingPage: string;
  capturedAt: string;
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  gclid?: string;
  fbclid?: string;
  referrer?: string;
};

function readStored(): CampaignAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CampaignAttribution) : null;
  } catch {
    return null;
  }
}

export function captureDiwaliAttribution(): CampaignAttribution | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const referrer = document.referrer || undefined;
  let source = params.get("utm_source") || undefined;
  let medium = params.get("utm_medium") || undefined;

  if (!source && referrer) {
    try {
      const host = new URL(referrer).hostname;
      if (/google\./i.test(host)) {
        source = "google";
        medium = "organic";
      } else if (/instagram\.com|facebook\.com|fb\.com/i.test(host)) {
        source = "meta";
        medium = "social";
      } else if (host !== window.location.hostname) {
        source = host;
        medium = "referral";
      }
    } catch {
      // Keep explicit URL parameters even when a malformed referrer exists.
    }
  }

  const attribution: CampaignAttribution = {
    campaignId: DIWALI_CAMPAIGN_ID,
    landingPage: window.location.pathname,
    capturedAt: new Date().toISOString(),
    source,
    medium,
    campaign: params.get("utm_campaign") || DIWALI_CAMPAIGN_ID,
    content: params.get("utm_content") || undefined,
    term: params.get("utm_term") || undefined,
    gclid: params.get("gclid") || undefined,
    fbclid: params.get("fbclid") || undefined,
    referrer,
  };

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Analytics must never interrupt shopping.
  }

  return attribution;
}

export function getCampaignAttribution(): CampaignAttribution | null {
  return readStored();
}

export function getCampaignEventParams(): Record<string, string> {
  const attribution = readStored();
  if (!attribution) return {};

  return Object.fromEntries(
    Object.entries({
      campaign_id: attribution.campaignId,
      landing_page: attribution.landingPage,
      utm_source: attribution.source,
      utm_medium: attribution.medium,
      utm_campaign: attribution.campaign,
      utm_content: attribution.content,
      utm_term: attribution.term,
      gclid: attribution.gclid,
      fbclid: attribution.fbclid,
    }).filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
}
