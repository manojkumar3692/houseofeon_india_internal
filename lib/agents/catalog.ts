import { z } from "zod";
import { products, type Product } from "@/lib/products";
import { getCatalogOffer } from "@/lib/catalogOffer";
import { getCatalogAvailability } from "@/lib/catalogAvailability";
import { BRAND_POLICIES } from "@/lib/brandPolicy";
import { SITE_URL } from "@/lib/seo";

export const searchInput = z.object({
  query: z.string().trim().max(160).optional().describe("Optional scent/name keywords such as citrus, floral or tonka; omit for all products."),
  maxPrice: z.number().finite().min(0).max(100000).optional().describe("Maximum single-bottle offer price in INR, inclusive."),
  occasion: z.enum(["office", "college", "date", "evening", "wedding", "summer", "after_workout"]).optional(),
  gender: z.enum(["Men", "Women", "Unisex"]).optional().describe("Catalogue label only; anyone may wear any fragrance."),
}).strict();
export const productInput = z.object({ id: z.string().trim().min(1).max(100).describe("Exact catalogue product ID or slug.") }).strict();
export const comparisonInput = z.object({ ids: z.array(z.string().trim().min(1).max(100)).min(2).max(4).refine(ids => new Set(ids).size === ids.length, "Use distinct product IDs.") }).strict();
export const policyInput = z.object({ topic: z.enum(["shipping", "payments", "returns", "cod"]) }).strict();

const occasionTerms = {
  office: ["office", "business"], college: ["college"], date: ["date night"],
  evening: ["evening", "parties"], wedding: ["festive wear"], summer: ["summer"],
  after_workout: ["summer"],
};
// Public availability is a short-lived snapshot, never a stock reservation.
let snapshot: { checkedAt: string; values: Record<string, boolean> | null } | undefined;
let expires = 0;
let pending: Promise<NonNullable<typeof snapshot>> | undefined;
async function availability() {
  if (snapshot && Date.now() < expires) return snapshot;
  if (pending) return pending;
  pending = (async () => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const values = await Promise.race([
        getCatalogAvailability(),
        new Promise<null>(resolve => { timer = setTimeout(() => resolve(null), 4000); }),
      ]);
      snapshot = { values, checkedAt: new Date().toISOString() };
      expires = Date.now() + 30000;
      return snapshot;
    } finally { clearTimeout(timer); pending = undefined; }
  })();
  return pending;
}
function publicProduct(product: Product, stock: Awaited<ReturnType<typeof availability>>) {
  const offer = getCatalogOffer(product.price);
  const status = stock.values?.[product.id];
  return {
    id: product.id, slug: product.slug, name: product.name, brand: "House of Eon",
    url: `${SITE_URL}/products/${product.slug}`, image: `${SITE_URL}${product.image}`,
    description: product.description, size: product.size, concentration: product.concentration,
    notes: product.notes, occasions: product.occasion, genderLabel: product.gender,
    pricing: { currency: "INR", regularPrice: offer.basePrice, price: offer.price,
      couponCode: offer.onSale ? "EON20" : null,
      conditions: offer.onSale ? "Public EON20 offer, automatically applied to eligible single-bottle carts. Cannot combine with bundle pricing or another coupon." : "Single-bottle catalogue price.",
      checkoutUrl: `${SITE_URL}/products/${product.slug}` },
    availability: { status: status === undefined ? "unknown" : status ? "in_stock" : "out_of_stock", checkedAt: stock.checkedAt, cacheSeconds: 30 },
    performance: product.scentProfile?.performance || "Wear varies with skin, weather and application.",
  };
}
function envelope(data: Record<string, unknown>) {
  return { schemaVersion: "1.0", source: "House of Eon public catalogue and published policies", retrievedAt: new Date().toISOString(),
    scope: "Brand-provided information, not an independent market ranking. Confirm stock and final price at checkout.",
    supportUrl: `${SITE_URL}/contact`, ...data };
}
export class AgentInputError extends Error {}
function find(id: string) {
  const product = products.find(p => p.id === id || p.slug === id);
  if (!product) throw new AgentInputError(`Unknown product: ${id}`);
  return product;
}
export async function searchCatalog(input: z.infer<typeof searchInput>) {
  const args = searchInput.parse(input);
  const tokens = (args.query || "").toLowerCase().split(/\s+/).filter(Boolean);
  const matches = products.filter(product => {
    const text = [product.name, ...product.notes, ...product.mood, ...product.occasion].join(" ").toLowerCase();
    return (!args.gender || product.gender === args.gender)
      && (args.maxPrice === undefined || getCatalogOffer(product.price).price <= args.maxPrice)
      && (!args.occasion || product.occasion.some(o => occasionTerms[args.occasion!].includes(o.toLowerCase())))
      && tokens.every(token => text.includes(token));
  });
  const stock = await availability();
  return envelope({ products: matches.map(p => ({ ...publicProduct(p, stock), matchBasis: args.occasion ? `Catalogue occasions matched: ${occasionTerms[args.occasion].join(", ")}.` : "Catalogue keyword and price filters." })),
    count: matches.length, ordering: "Catalogue order; not a quality ranking. Out-of-stock products are explicitly labelled.",
    ...(args.occasion === "after_workout" ? { guidance: "Summer-profile options to consider after showering. This is a catalogue-based suggestion, not a workout performance test. Fragrance does not replace washing or deodorant; respect fragrance-free gyms." } : {}),
    ...(matches.length ? {} : { guidance: "No catalogue match. Broaden filters or ask support; do not infer an unavailable product." }),
  });
}
export async function getPublicProduct(input: z.infer<typeof productInput>) {
  const args = productInput.parse(input);
  const product = find(args.id);
  return envelope({ product: publicProduct(product, await availability()) });
}
export async function comparePublicProducts(input: z.infer<typeof comparisonInput>) {
  const args = comparisonInput.parse(input);
  const selected = args.ids.map(find);
  if (new Set(selected.map(p => p.id)).size !== selected.length) throw new AgentInputError("Use distinct products, not an ID and slug for the same product.");
  const stock = await availability();
  return envelope({ products: selected.map(p => publicProduct(p, stock)), comparisonBasis: "Compare listed notes, occasions, concentration and price. No independent performance winner is asserted." });
}
export async function getPublicPolicy(input: z.infer<typeof policyInput>) {
  const { topic } = policyInput.parse(input);
  return envelope({ topic, answer: BRAND_POLICIES[topic], sourceUrl: `${SITE_URL}${topic === "returns" ? "/pages/return-refund-policy" : "/shipping"}` });
}
export const agentTools = [
  { name: "search_perfumes", description: "Search House of Eon's public perfume catalogue by scent keywords, occasion and INR budget; returns current offer and stock snapshot. No market-wide best-product ranking.", schema: searchInput, execute: searchCatalog },
  { name: "get_perfume", description: "Get one perfume's exact notes, bottle size, current single-bottle offer, availability and source URL.", schema: productInput, execute: getPublicProduct },
  { name: "compare_perfumes", description: "Compare 2–4 distinct House of Eon perfumes using catalogue facts.", schema: comparisonInput, execute: comparePublicProducts },
  { name: "get_store_policy", description: "Read published shipping, payment, COD or return policies. No customer/order lookup and no precise delivery guarantee.", schema: policyInput, execute: getPublicPolicy },
] as const;
export async function runAgentTool(name: string, args: unknown) {
  const tool = agentTools.find(tool => tool.name === name);
  if (!tool) throw new AgentInputError("Unknown tool.");
  const parsed = tool.schema.parse(args);
  // Each schema is paired with its handler in the fixed registry above.
  return (tool.execute as (args: typeof parsed) => Promise<Record<string, unknown>>)(parsed);
}
