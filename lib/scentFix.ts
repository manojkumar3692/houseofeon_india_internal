import { Product, getProductById, products } from "@/lib/products";

// ---------------------------------------------------------------------------
// Scent families
// ---------------------------------------------------------------------------
// A small internal taxonomy used ONLY to route quiz answers to one of our 6
// products. This never gets shown to the customer as "smells like X" — we
// only ever say "same <family> family", because claiming a House of Eon
// perfume smells like a named competitor brand is a trademark risk and a
// fast way to get the ad account (and the claim itself) rejected.
export type ScentFamily =
  | "warm-sweet-vanilla-oud"
  | "fresh-citrus-aquatic"
  | "icy-strong-projection"
  | "spicy-intense-leather"
  | "floral-elegant"
  | "amber-oud-luxury";

export const FAMILY_LABEL: Record<ScentFamily, string> = {
  "warm-sweet-vanilla-oud": "warm, sweet vanilla-tonka",
  "fresh-citrus-aquatic": "fresh, citrus-aquatic",
  "icy-strong-projection": "icy, sharp and loud",
  "spicy-intense-leather": "spicy, intense leather",
  "floral-elegant": "soft, elegant floral",
  "amber-oud-luxury": "rich amber-oud luxury",
};

export const PRODUCT_FAMILY: Record<string, ScentFamily> = {
  "desert-tonka": "warm-sweet-vanilla-oud",
  "arctic-wave": "fresh-citrus-aquatic",
  zyrox: "icy-strong-projection",
  rank: "spicy-intense-leather",
  syra: "floral-elegant",
  "silent-gold": "amber-oud-luxury",
};

// ---------------------------------------------------------------------------
// Q1 — "Name a perfume you actually loved"
// ---------------------------------------------------------------------------
// Free text only — no named competitor brands as tappable options. Naming
// a specific brand as a selectable "option" reads as an equivalence claim
// even if the copy never says "smells like", and it's not worth the
// trademark risk. Whatever the customer types is matched against the
// keyword buckets below to bias toward a scent FAMILY instead.
type FamilyWeights = Partial<Record<ScentFamily, number>>;

// Keyword buckets so a free-typed answer biases sensibly toward a family.
// Matching is case-insensitive substring matching against whatever the
// customer types — including if they type a brand name themselves; we
// just never present one as a tappable choice.
const FREE_TEXT_KEYWORDS: { family: ScentFamily; words: string[] }[] = [
  {
    family: "warm-sweet-vanilla-oud",
    words: [
      "vanilla", "tonka", "oud", "amber", "sweet", "warm", "spice",
      "cinnamon", "gourmand", "le male", "jpg", "gaultier",
    ],
  },
  {
    family: "fresh-citrus-aquatic",
    words: [
      "citrus", "fresh", "aqua", "marine", "sea", "lemon", "bergamot", "light",
      "clean", "sauvage", "chanel", "bleu",
    ],
  },
  {
    family: "icy-strong-projection",
    words: [
      "ice", "icy", "cool", "mint", "loud", "strong", "club", "party", "eros",
      "versace",
    ],
  },
  {
    family: "spicy-intense-leather",
    words: ["leather", "smoky", "smoke", "tobacco", "intense", "dark", "night", "pepper"],
  },
  {
    family: "floral-elegant",
    words: [
      "floral", "flower", "rose", "jasmine", "soft", "feminine", "elegant",
      "bloom", "gucci",
    ],
  },
  {
    family: "amber-oud-luxury",
    words: ["luxury", "gold", "resin", "rich", "gift", "premium", "royal"],
  },
];

// A perfume name typed by the customer isn't shown back to them as an
// "equivalent" anywhere — buildWhyLine() below only ever quotes their own
// words back ("You said you love …"), never asserts a match to a brand.

export function getFamilyWeightsFromText(text: string): FamilyWeights {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return {};

  const weights: FamilyWeights = {};
  for (const bucket of FREE_TEXT_KEYWORDS) {
    const matched = bucket.words.some((word) => normalized.includes(word));
    if (matched) {
      weights[bucket.family] = (weights[bucket.family] || 0) + 2;
    }
  }
  return weights;
}

// ---------------------------------------------------------------------------
// Q2 — When does your current perfume die?
// ---------------------------------------------------------------------------
export type Q2Answer = "before-lunch" | "by-evening" | "lasts-fine";

export const Q2_OPTIONS: { id: Q2Answer; label: string }[] = [
  { id: "before-lunch", label: "Before lunch" },
  { id: "by-evening", label: "By evening" },
  { id: "lasts-fine", label: "It lasts fine" },
];

// ---------------------------------------------------------------------------
// Q3 — Who notices it?
// ---------------------------------------------------------------------------
export type Q3Answer = "only-me" | "people-close" | "whole-room";

export const Q3_OPTIONS: { id: Q3Answer; label: string }[] = [
  { id: "only-me", label: "Only me" },
  { id: "people-close", label: "People standing close" },
  { id: "whole-room", label: "The whole room" },
];

// Per the brief: "whole room" biases Zyrox/RANK, "only me" biases the
// Extrait de Parfum trio (Desert Tonka, Silent Gold, Arctic Wave).
const WHOLE_ROOM_BIAS = ["zyrox", "rank"];
const ONLY_ME_BIAS = ["desert-tonka", "silent-gold", "arctic-wave"];

// ---------------------------------------------------------------------------
// Q4 — Shopping for?
// ---------------------------------------------------------------------------
export type Q4Answer = "Men" | "Women" | "Either";

export const Q4_OPTIONS: { id: Q4Answer; label: string }[] = [
  { id: "Men", label: "Men" },
  { id: "Women", label: "Women" },
  { id: "Either", label: "Either" },
];

// ---------------------------------------------------------------------------
// Full answer shape + scoring
// ---------------------------------------------------------------------------
export type ScentFixAnswers = {
  q1Text: string;
  q2: Q2Answer | null;
  q3: Q3Answer | null;
  q4: Q4Answer | null;
};

export const initialScentFixAnswers: ScentFixAnswers = {
  q1Text: "",
  q2: null,
  q3: null,
  q4: null,
};

export type ScentFixResult = {
  product: Product;
  family: ScentFamily;
  whyLine: string;
};

function genderMatchesQ4(productGender: Product["gender"], q4: Q4Answer | null) {
  if (!q4 || q4 === "Either") return true;
  return productGender === q4 || productGender === "Unisex";
}

export function getScentFixResult(answers: ScentFixAnswers): ScentFixResult {
  const textWeights = getFamilyWeightsFromText(answers.q1Text);

  const pool = products.filter((product) =>
    genderMatchesQ4(product.gender, answers.q4)
  );
  const scoredPool = pool.length ? pool : products;

  const scored = scoredPool.map((product) => {
    const family = PRODUCT_FAMILY[product.id];
    let score = textWeights[family] || 0;

    if (answers.q3 === "whole-room" && WHOLE_ROOM_BIAS.includes(product.id)) {
      score += 2;
    }
    if (answers.q3 === "only-me" && ONLY_ME_BIAS.includes(product.id)) {
      score += 2;
    }

    return { product, family, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const winner = scored[0];

  return {
    product: winner.product,
    family: winner.family,
    whyLine: buildWhyLine(answers, winner.product, winner.family),
  };
}

// Only ever quotes the customer's own words back to them — never asserts
// a match to any brand they may have typed.
function buildWhyLine(
  answers: ScentFixAnswers,
  product: Product,
  family: ScentFamily
): string {
  const familyLabel = FAMILY_LABEL[family];
  const namedThing = answers.q1Text.trim()
    ? `"${answers.q1Text.trim()}"`
    : "";

  if (namedThing) {
    return `You said you love ${namedThing} — that's the same ${familyLabel} family ${product.name} lives in.`;
  }

  return `Based on your answers, ${product.name} sits in the ${familyLabel} family — the closest match we've got.`;
}

// Resolves a shareable ?result=<product-id> URL for a friend who lands on
// it without ever taking the diagnostic themselves — same result shape as
// a real quiz answer, just with a generic (not personalized) why-line.
export function buildSharedResult(param: string | null): ScentFixResult | null {
  if (!param) return null;
  const product = getProductById(param);
  if (!product) return null;

  const family = PRODUCT_FAMILY[product.id];

  return {
    product,
    family,
    whyLine: `${product.name} sits in the ${FAMILY_LABEL[family]} family. Take the 30-second diagnostic below for your own match.`,
  };
}

// ---------------------------------------------------------------------------
// Static technique tips (Section 3) — true regardless of which product wins
// ---------------------------------------------------------------------------
export const TECHNIQUE_TIPS: { title: string; text: string }[] = [
  {
    title: "Moisturise bare skin first",
    text: "Any oil-based lotion works. Dry skin can't hold fragrance oil — this one habit alone buys 2-3 extra hours.",
  },
  {
    title: "Pulse points, then clothes",
    text: "Spray wrists, neck and collarbone — then your clothes too. Fabric holds scent far longer than skin ever will in this heat.",
  },
  {
    title: "Never rub it in",
    text: "Rubbing your wrists together shreds the top notes on contact. Let it dry in the air instead.",
  },
];

// ---------------------------------------------------------------------------
// Why House of Eon lasts longer than a ₹3,000 bottle — the actual product
// facts, not a technique tip. Used in Section 1 (the main explanation) and
// as a compact trust row on the Section 3 result card.
// ---------------------------------------------------------------------------
export const WHY_WE_LAST_LONGER: { title: string; text: string }[] = [
  {
    title: "30-35% pure fragrance oil",
    text: "Most perfumes — including a lot of ₹3,000 bottles — run 15-20% oil, cut with alcohol and water. Ours runs 30-35%. More oil means more of it is still there hours later.",
  },
  {
    title: "No fancy box, no brand tax",
    text: "We don't spend your money on sculpted glass, gift boxes or a celebrity contract. That budget goes into the bottle instead of the shelf.",
  },
  {
    title: "Same ingredient cost, honest price",
    text: "You're paying for what's inside — not the packaging or the name on it. That's the whole reason this is ₹999, not ₹3,000.",
  },
];

export const OIL_CONCENTRATION_BADGE = "30-35% fragrance oil · Built for Indian heat";
