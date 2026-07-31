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
 * Both payment options (pay in full, or pay a token now + rest on
 * delivery) are always shown side by side whenever there's a real order
 * total — there's no scenario where showing the token option is unsafe,
 * because getEffectiveTokenAmountInPaise() below guarantees the token
 * charged upfront can never exceed the order's own total. A customer (or
 * an admin testing with a ₹1 coupon) always sees both and can simply pick
 * whichever costs less right now; there's no version of this where
 * "pay the token now" ends up costing more than "pay in full".
 */
export function isPartialCodEligible(orderTotalInPaise: number) {
  return orderTotalInPaise > 0;
}

/**
 * The amount actually charged upfront for the "pay token now, rest on
 * delivery" option. Capped at the order's own total — at ordinary order
 * values (well above the token amount) this is just the token amount as
 * usual; at a very low total (e.g. an admin ₹1 test order), it collapses
 * to the full amount instead of trying to charge more upfront than the
 * order is worth, which would make the "rest on delivery" balance
 * nonsensical.
 */
export function getEffectiveTokenAmountInPaise(orderTotalInPaise: number) {
  return Math.min(COD_TOKEN_AMOUNT_IN_PAISE, Math.max(0, orderTotalInPaise));
}
