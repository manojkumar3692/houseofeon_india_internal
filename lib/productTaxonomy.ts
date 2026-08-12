import { Product, products } from "@/lib/products";

// ---------------------------------------------------------------------------
// EON Concierge needs a few structured fields the product catalog doesn't
// carry yet (fragrance family, recommended weather/time, stock status, a
// flat "why buy this" list). Rather than hand-typing new claims per product
// — which risks drifting from what's actually true, or inventing scent
// specifics nobody verified — everything here is DERIVED from fields that
// already exist and are real: `mood`, `notes`, `occasion`, `highlights`.
// If a product's real data changes, these derived fields update with it.
//
// Two fields the brief asked for are deliberately NOT derived here:
// - A true top/middle/base NOTE PYRAID (as opposed to the descriptive
//   scentProfile.opening/heart/dryDown prose that already exists) would
//   require real perfumer composition data we don't have — guessing which
//   of the flat `notes` array counts as "top" vs "base" would be
//   fabricating structure, not deriving it.
// - `suitableAgeGroup` has no honest source in the current data at all —
//   age-targeting a fragrance isn't something the existing copy speaks to,
//   so it's left out rather than invented.
// ---------------------------------------------------------------------------

export type FragranceFamily =
  | "Fresh / Aquatic-Citrus"
  | "Spicy Woody"
  | "Warm Amber / Gourmand"
  | "Floral Musk";

export type RecommendedWeather = "Hot / Summer" | "Cool / Winter" | "Everyday Indian climate";
export type RecommendedTime = "Day" | "Evening & Night" | "Day & Night";
export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export type ProductTaxonomy = {
  fragranceFamily: FragranceFamily;
  recommendedWeather: RecommendedWeather;
  recommendedTime: RecommendedTime;
  stockStatus: StockStatus;
  keySellingPoints: string[];
};

const WEATHER_KEYWORDS: Record<string, RecommendedWeather> = {
  summer: "Hot / Summer",
  winter: "Cool / Winter",
};

const DAY_KEYWORDS = ["office", "college", "daily wear", "daytime", "business", "brunch"];
const NIGHT_KEYWORDS = ["evening", "date night", "festive wear", "night", "parties", "special moments"];

function deriveFragranceFamily(product: Product): FragranceFamily {
  const notesText = product.notes.join(" ").toLowerCase();
  const moodText = product.mood.join(" ").toLowerCase();

  if (/floral|vanilla|fruity/.test(notesText) && /elegant|feminine|soft/.test(moodText)) {
    return "Floral Musk";
  }
  if (/aquatic|citrus|marine|icy|mint/.test(notesText)) {
    return "Fresh / Aquatic-Citrus";
  }
  if (/amber|tonka|resin|saffron|golden/.test(notesText)) {
    return "Warm Amber / Gourmand";
  }
  if (/spice|leather|musk|woods/.test(notesText)) {
    return "Spicy Woody";
  }
  return "Warm Amber / Gourmand";
}

function deriveRecommendedWeather(product: Product): RecommendedWeather {
  for (const occasion of product.occasion) {
    const match = WEATHER_KEYWORDS[occasion.toLowerCase()];
    if (match) return match;
  }
  return "Everyday Indian climate";
}

function deriveRecommendedTime(product: Product): RecommendedTime {
  const occasionText = product.occasion.map((o) => o.toLowerCase());
  const hasDay = occasionText.some((o) => DAY_KEYWORDS.some((k) => o.includes(k)));
  const hasNight = occasionText.some((o) => NIGHT_KEYWORDS.some((k) => o.includes(k)));

  if (hasDay && hasNight) return "Day & Night";
  if (hasNight) return "Evening & Night";
  return "Day";
}

export function getProductTaxonomy(product: Product): ProductTaxonomy {
  return {
    fragranceFamily: deriveFragranceFamily(product),
    recommendedWeather: deriveRecommendedWeather(product),
    recommendedTime: deriveRecommendedTime(product),
    // No live inventory feed wired up — every product currently sells
    // normally on the site, so "in_stock" is accurate today. If real
    // stock tracking gets added later, this is the one line to change.
    stockStatus: "in_stock",
    keySellingPoints: (product.highlights || []).map((h) => h.text),
  };
}

export function getProductTaxonomyBySlug(slug: string): ProductTaxonomy | null {
  const product = products.find((p) => p.slug === slug);
  return product ? getProductTaxonomy(product) : null;
}
