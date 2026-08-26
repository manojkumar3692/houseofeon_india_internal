import { products, Product } from "@/lib/products";

// ---------------------------------------------------------------------------
// Trial Pack — pick 3 of the eligible fragrances, 8ml vials, ₹249 flat.
// Real business numbers (price/vial size/pick count), not derived —
// confirmed directly, so these are treated the same way EON20/bundle
// pricing constants are: a single source of truth every route/page reads
// from, never hand-typed per file.
// ---------------------------------------------------------------------------

export const TRIAL_PACK_PRICE_INR = 249;
export const TRIAL_VIAL_SIZE_ML = 8;
export const TRIAL_PICK_COUNT = 3;

// The ₹249 credit-back window — see lib/trialCredit.ts for how this is
// enforced (measured from the trial order's created_at).
export const TRIAL_CREDIT_EXPIRY_DAYS = 30;

// SYRA isn't in the trial pack yet — coming later. Keeping this as an
// explicit slug exclusion (rather than a hand-typed eligible list) means
// any other future product change to lib/products.ts still flows through
// automatically, and re-including SYRA later is a one-line change.
const EXCLUDED_SLUGS = new Set(["syra-women-perfume"]);

export function getTrialEligibleProducts(): Product[] {
  return products.filter((p) => !EXCLUDED_SLUGS.has(p.slug));
}

export function isTrialEligibleProductId(productId: string): boolean {
  return getTrialEligibleProducts().some((p) => p.id === productId);
}

export function getTrialPackAmountInPaise(): number {
  return TRIAL_PACK_PRICE_INR * 100;
}
