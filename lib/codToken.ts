// Shared config for the "token payment + COD balance" checkout option.
//
// The customer pays a small refundable-in-spirit token amount online via
// Razorpay, and pays the remaining balance in cash to the delivery agent.
// This exists to reduce full-prepaid checkout drop-off while still limiting
// exposure to COD return-to-origin (RTO) risk versus full COD.
//
// Safe to expose to the client (not a secret) — used both in the checkout
// UI and as the server-side source of truth in the order-create route.

const DEFAULT_TOKEN_AMOUNT_INR = 99;

export const COD_TOKEN_AMOUNT_INR = (() => {
  const fromEnv = Number(process.env.NEXT_PUBLIC_COD_TOKEN_AMOUNT_INR);
  return Number.isFinite(fromEnv) && fromEnv > 0
    ? Math.round(fromEnv)
    : DEFAULT_TOKEN_AMOUNT_INR;
})();

export const COD_TOKEN_AMOUNT_IN_PAISE = COD_TOKEN_AMOUNT_INR * 100;

/**
 * Partial COD only makes sense if there's a meaningful balance left to
 * collect on delivery. Require the order total to be at least double the
 * token amount, otherwise fall back to full prepaid / full COD only.
 */
export function isPartialCodEligible(orderTotalInPaise: number) {
  return orderTotalInPaise >= COD_TOKEN_AMOUNT_IN_PAISE * 2;
}
