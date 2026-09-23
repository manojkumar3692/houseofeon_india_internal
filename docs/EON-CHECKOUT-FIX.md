# Negotiated checkout follow-up — 23 September 2026

The reported checkout was cancelled after a definitive Razorpay payment-link
creation rejection. No provider link was saved. The signed quote had less than
15 minutes remaining even when the store checkout was created. Razorpay's
Standard Payment Link documentation describes a 15-minute minimum. Expiry is
therefore the likely cause; the previous implementation discarded the provider
error body, so the exact historical reason cannot be proved.

The owner approved a 30-minute lifetime, now applied by the EON task to new
quotes. Existing cancelled quotes remain closed. The store never extends a
signed quote or changes its amount.

Changes:
- Responsive checkout with product image, exact order summary, labelled address
  fields, fixed postcode, secure payment CTA and a payment-start countdown.
- Expired/cancelled checkout guidance requests a fresh offer. Failed submissions
  refresh state, preventing a stale payment form after provider cancellation.
- New provider-link creation requires more than 16 minutes remaining, including
  a one-minute request buffer. This runs before order creation. Already-created
  links can still be recovered until their actual signed expiry.
- Safe provider error categories distinguish expiry and duplicate-reference
  recovery without logging customer information or raw provider responses.
  Duplicate-reference rejection never cancels a potentially existing link.

Changed implementation: app/checkout/negotiated/[id]/view.tsx and
checkout.module.css; app/api/negotiation/checkout/[id]/route.ts;
lib/negotiation/payments.ts. Tests: negotiation-payments.test.cjs and
negotiation-checkout-ui.test.cjs.

Validation: full automated suite, production build, and desktop/390px mobile
visual checks using actual component rendering with synthetic offer data.
No live payment/link was created by this task. Real Razorpay handoff still needs
verification after owner deployment using a fresh 30-minute offer. No new store
migration or environment variable is required.

Separate pricing concern: the reported offer was INR 949.05, above the ordinary
EON20 total of INR 799. Its cart must include the applicable promotion when EON
computes the comparison price. This follow-up does not alter accepted prices or
approved negotiation floors; coordinate the promotion comparison in EON before
public launch.

Reference: https://razorpay.com/docs/api/payments/payment-links/create-standard/

## Latest owner correction: EON20 requires entry for Arctic Wave

Arctic defaults to INR999 (original INR1249) on product cards, PDP, catalog/feed,
cart and checkout. Entering EON20 explicitly gives INR799; removing it restores
INR999 without automatic reapplication. Legacy automatically stored coupons are
cleared for Arctic. Other products keep existing automatic coupon behavior.
Connector prices remain124900/99900 and explicit EON20 evaluation79900; terms
now explain that Arctic's code must be entered. Negotiated amounts remain exact,
with no additional coupon stacking. This supersedes earlier autoapply wording.

Validation:68/68 automated tests and production build pass. Local real-browser
PDP/cart/checkout checks confirm999 by default, manualcode799 and removal999.
No payment/order was created. The earlier checkout layout/payment-window fixes
remain included in the source; deploy these latest store changes before a fresh
private payment test. No new migration or environment setting is needed.

## Superseding approval: all six perfumes

The owner subsequently approved the same1249/999/manual-EON20-799 model for
all six50ml perfumes. See EON-SIX-PRODUCT-PRICING.md and the new store migration
migration-six-perfume-selling-prices.sql. Earlier Arctic-only statements above
are historical. Private negotiation remains Arctic-only.
