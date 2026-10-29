import { products, Product } from "@/lib/products";

// ---------------------------------------------------------------------------
// Trial Pack — pick 3 of the eligible fragrances, 8ml vials, ₹299 flat.
// Real business numbers (price/vial size/pick count), not derived —
// confirmed directly, so these are treated the same way EON20/bundle
// pricing constants are: a single source of truth every route/page reads
// from, never hand-typed per file.
// ---------------------------------------------------------------------------

export const TRIAL_PACK_PRICE_INR = 299;
export const TRIAL_VIAL_SIZE_ML = 8;
export const TRIAL_PICK_COUNT = 3;

export const TRIAL_FULL_SIZE_PRICE_INR = 749;

// The one-time full-size offer window — see lib/trialCredit.ts for how this is
// enforced (measured from the trial order's created_at).
export const TRIAL_CREDIT_EXPIRY_DAYS = 90;

const TRIAL_PRODUCT_ORDER = [
  "rank",
  "desert-tonka",
  "silent-gold",
  "zyrox",
  "arctic-wave",
  "riva",
  "syra",
];

export function getTrialEligibleProducts(): Product[] {
  const position = (id: string) => {
    const index = TRIAL_PRODUCT_ORDER.indexOf(id);
    return index === -1 ? TRIAL_PRODUCT_ORDER.length : index;
  };
  return [...products].sort((a, b) => position(a.id) - position(b.id));
}

export function isTrialEligibleProductId(productId: string): boolean {
  return getTrialEligibleProducts().some((p) => p.id === productId);
}

export function getTrialPackAmountInPaise(): number {
  return TRIAL_PACK_PRICE_INR * 100;
}

// Existing paid ₹249 orders keep the credit promised when purchased.
export function isLegacyTrialOffer(amountInPaise: number): boolean {
  return amountInPaise === 24900;
}
