import { Product, getProductById, products } from "@/lib/products";

// ---------------------------------------------------------------------------
// Section 8's matcher — "How do you want to feel?" — is a single tap, not a
// multi-question quiz. Each feeling maps to an ordered list of products:
// the first is the primary recommendation, the rest are what "Show me
// another" cycles through. Every one of the 6 products is reachable from
// at least one feeling.
// ---------------------------------------------------------------------------
export type FeelingId =
  | "fresh-clean"
  | "powerful-confident"
  | "warm-addictive"
  | "soft-elegant";

export type Feeling = {
  id: FeelingId;
  label: string;
  sub: string;
  productIds: string[];
};

export const FEELINGS: Feeling[] = [
  {
    id: "fresh-clean",
    label: "Fresh & Clean",
    sub: "I want to smell effortlessly put together.",
    productIds: ["arctic-wave", "zyrox"],
  },
  {
    id: "powerful-confident",
    label: "Powerful & Confident",
    sub: "I want presence.",
    productIds: ["rank", "zyrox"],
  },
  {
    id: "warm-addictive",
    label: "Warm & Addictive",
    sub: "I want them to remember me.",
    productIds: ["desert-tonka", "silent-gold"],
  },
  {
    id: "soft-elegant",
    label: "Soft & Elegant",
    sub: "Quiet luxury.",
    productIds: ["syra", "silent-gold"],
  },
];

export function getFeelingById(id: FeelingId | null): Feeling | null {
  if (!id) return null;
  return FEELINGS.find((f) => f.id === id) || null;
}

// A punchy 3-word tag built from the product's own real mood tags, e.g.
// "POWERFUL. MASCULINE. REFINED." — not invented copy, just reusing data
// that already exists on the product.
export function getProductTagLine(product: Product): string {
  return product.mood.slice(0, 3).map((word) => word.toUpperCase()).join(". ") + ".";
}

export function getFeelingProduct(
  feeling: Feeling,
  index: number
): Product | null {
  const productId = feeling.productIds[index % feeling.productIds.length];
  return getProductById(productId) || null;
}

// Resolves a shared ?result=<product-id> link back to the feeling it
// belongs to, so a forwarded match still opens on the right card.
export function findFeelingForProduct(productId: string): {
  feeling: Feeling;
  index: number;
} | null {
  for (const feeling of FEELINGS) {
    const index = feeling.productIds.indexOf(productId);
    if (index !== -1) return { feeling, index };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Real, verified reviews only (Section 11) — pulled straight from the
// existing product catalog's `reviews` array, never generated. Only
// reviews with `verified: true` (traced to a real order number) are
// eligible here.
// ---------------------------------------------------------------------------
export type CuratedReview = {
  name: string;
  city: string;
  rating: number;
  text: string;
  productName: string;
  orderNumber?: string;
};

export function getCuratedReviews(limit = 6): CuratedReview[] {
  const all: CuratedReview[] = [];

  for (const product of products) {
    for (const review of product.reviews || []) {
      if (!review.verified) continue;
      all.push({
        name: review.name,
        city: review.city,
        rating: review.rating,
        text: review.text,
        productName: product.name,
        orderNumber: review.orderNumber,
      });
    }
  }

  return all.slice(0, limit);
}
