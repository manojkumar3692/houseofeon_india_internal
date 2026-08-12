// ---------------------------------------------------------------------------
// Single source of truth for brand/policy answers the concierge is allowed
// to give. This is the "controlled knowledge source" the brief asks for —
// the model calls get_brand_policy(topic) and gets back exactly this text,
// it never improvises policy language. Every line here already exists
// elsewhere on the real site (checkout, footer, product pages) — nothing
// new is being asserted here for the first time.
// ---------------------------------------------------------------------------

export type BrandPolicyTopic =
  | "about"
  | "made_in_india"
  | "concentration"
  | "shipping"
  | "payments"
  | "returns"
  | "cod"
  | "offers";

export const BRAND_POLICIES: Record<BrandPolicyTopic, string> = {
  about:
    "House of Eon is an Indian D2C perfume brand. Every fragrance is formulated with 30-35% pure fragrance oil — the money goes into what's actually in the bottle, not premium packaging, celebrity endorsements or brand markup.",
  made_in_india: "House of Eon fragrances are made in India.",
  concentration:
    "Most House of Eon fragrances are Extrait de Parfum (the strongest, most concentrated form of perfume); a couple are Eau de Parfum. The exact concentration for each fragrance is shown on its product page. Extrait de Parfum generally has more oil concentration and lasts longer than Eau de Parfum or Eau de Toilette.",
  shipping:
    "Delivery is nationwide across India, typically 2-3 working days, with free shipping. We don't do real-time pincode-level ETA lookups yet — for a specific delivery estimate to your area, WhatsApp support can help.",
  payments:
    "Checkout supports full prepaid payment, and on eligible orders, a partial-COD option (pay a small token amount online, the rest in cash on delivery) — eligibility is shown at checkout, not guaranteed for every order.",
  returns:
    "Bottles cannot be returned once opened, for hygiene reasons — this applies to every fragrance, no exceptions. If you're unsure about a scent, ask before ordering rather than counting on a return.",
  cod: "Full cash-on-delivery isn't offered — but a partial-COD option exists on eligible orders (small token paid online, rest paid in cash at the door). Eligibility shows at checkout.",
  offers:
    "Current offers are read live from the site's coupon configuration, not guessed — see get_current_offer.",
};

export function getBrandPolicy(topic: string): string | null {
  const normalized = topic.trim().toLowerCase().replace(/\s+/g, "_") as BrandPolicyTopic;
  return BRAND_POLICIES[normalized] || null;
}
