# Arctic Wave private negotiation pilot

Local implementation only. No deployment, commit, credential rotation, database
migration, live payment or activation was performed. This document supersedes
the read-only rollout instructions in NEGOTIATION-READ-ONLY.md.

## Verified pricing and approved correction

Before this change the store used code-defined `product.price = 1249`. Both the
product-page ₹999 display and cart auto-apply came from EON20, not a separate
sale. The order API calculated `Math.round(1249 * 20 / 100) = 250`, payable ₹999.
Read-only inspection of the connected Supabase schema found no regular/selling
price table. Stock was database-backed; finance product costs were separate.

The owner subsequently explicitly approved this **Arctic Wave-only** correction:

| Fact | INR | Minor units |
| --- | ---: | ---: |
| Original/MRP | 1,249 | 124900 |
| Selling before coupons | 999 | 99900 |
| EON20 discount | 200 | 20000 |
| With EON20 | 799 | 79900 |
| Customer shipping | 0 | 0 |

The existing coupon function rounds the discount in whole rupees:
`Math.round(999 * 20 / 100) = 200`; subtracting gives exactly ₹799, not ₹799.20.
No global coupon math or other product prices changed. The existing two-bottle
bundle remains ₹799 per bottle and excludes EON20. Arctic's two-bottle card no
longer claims a saving over two individually discounted Arctic bottles.

The migration seeds only this approved product into `store_product_pricing`.
Catalog/context read its database values, then verify they agree with storefront
pricing. Missing data or drift fails closed; the connector never silently
hardcodes a replacement price. Other products keep their existing code source.
Changing this row later requires a matching storefront pricing update before
the pilot can continue. No existing production record was changed during work.

Verified external IDs remain `arctic-wave` / `arctic-wave:50ml`. The actual
inventory SKU is `ARCTIC-WAVE-50ML`; it is not substituted for the existing
external variant identity. The database stock read observed 23 units at the
time of inspection; runtime availability accounts for reservations.

## Implemented store operations

- Existing signed `/api/negotiation/v3` retains workspace, installation, secret
  aliases, HMAC, replay nonce RPC and canonical endpoint.
- Catalog adds documented `pricing` and `storeTerms` on every page. EON20
  metadata explains rounding, bundle exclusion, one-code limit, no configured
  expiry, and no combination with negotiated quotes.
- Context validates the actual exact cart and evaluates EON20 using ordinary
  order/coupon functions. Unknown codes, multiple codes, admin-only codes and
  identity-bound trial credit are rejected for this pilot. Missing cost,
  approved floor, delivery expense, processor expense and sales history remain null. `economics`
  capability means signed economic-context support, not cost approval.
- Only Arctic Wave 50ml, **quantity one, prepaid, India postcode** supports
  negotiated checkout. Other quantities/products/payment types are not enabled.
- Signed checkout persists a single immutable quote and stock reservation in
  one transaction. Stable revisions bind prices, codes, destination, stock and
  checkout availability. Quote/key conflicts, reuse and stale context fail.
- A tab-scoped checkout bearer token travels in the URL fragment and is removed
  before analytics. The dedicated checkout accepts delivery details, never a
  client price, cart, coupon or alternate payment type. It does not enter the
  normal coupon flow.
- The provider receives exact item total plus approved shipping, full payment
  only, no provider offer, the signed quote's expiry (rounded down to seconds),
  and a stable unique reference. The store permits quote lifetimes up to 59
  minutes to fit its verified stock-reservation TTL limit. It never extends an
  EON quote to satisfy the provider.
- Retries return the existing quote/order/payment link. Only one database claim
  may create a provider link. An uncertain write is recovered by reference, not
  blindly repeated. A definitive validation rejection cancels the checkout;
  a timeout/409/5xx remains pending recovery. If no provider link can be found
  after an ambiguous request, keep it blocked for operator review; never reset
  its creation claim while a provider request might still complete.
- Provider-authenticated payment-link events and reconciliation fetch the
  provider's payment independently, check amount/currency/binding and atomically
  update the ordinary order plus signed event outbox. Browser success cannot
  mark payment captured. Admin orders show EON attribution and refund amount.
- Unpaid cancellation cancels the provider link before releasing stock. Paid
  cancellation requires an actual provider refund. Partial refunds stay paid
  with the refunded amount recorded; a complete refund sends
  `checkout.refunded`. The EON contract has no partial-refund amount event.
  Refunding money does not automatically restock a physically shipped bottle;
  approved returns and carrier cancellation remain existing operations work.
- Outbox events use the existing connector signing helper and installation
  credentials. Event IDs/times are stable across retries; timestamp, nonce and
  signature are fresh. Per-checkout delivery leases preserve event order.
  Reporting/recovery continues with the new-checkout pause switch off.

## Supplied widget

The product page mounts the unmodified EON `/widget.js` only for Arctic Wave and
only in a browser tab carrying a tester token. EON itself still validates that
token and controls eligibility, invitation wording, dismissal, cooldown and
the conversation. There is no merchant-origin `/api/negotiate/start` request.

The supplied widget has no SPA teardown API, so it runs in a same-origin frame
that is destroyed when leaving the product page. This avoids old timers and
variant invitations surviving navigation. Hidden frames cannot intercept page
clicks; the frame expands when the supplied invitation/conversation is visible.
Tester tokens stay in the fragment/session storage, never server queries. The
widget's local page-view count and elapsed dwell begin on its page load; no
merchant-side threshold engine has been added.

## Deployment prerequisites (owner performs these)

1. Apply `supabase/migration-negotiation-checkout.sql` to the **existing store
   Supabase database** after review. It depends on the existing inventory RPCs
   and orders schema. EON Neon migration 008 does not create these store tables.
   The existing nonce migration must remain installed. Do not create a new
   connection or replace any credential.
2. Deploy the latest EON application patches from the coordinated EON task:
   merchant-approved delivery/processor-cost fallbacks (nullable payment fee), truthful economics readiness,
   ordered/idempotent custom payment handling (unknown attempts retryable), and
   a user-clicked top-level checkout link from the embedded conversation, explicit
   stored invitation signals, and durable accepted-checkout intent for lost-response
   recovery and resumed-session domain lookup. No additional Neon migration is
   required for these platform patches.
3. Keep existing store credential variables. Set `NEGOTIATION_PUBLIC_KEY` to
   the **existing public installation key** from EON Connect, not installation
   ID or connector secret. Initially leave `NEGOTIATION_WIDGET_ENABLED=false`
   and `NEGOTIATION_CHECKOUT_ENABLED=false`. Enable checkout for signed launch
   checks only after the store migration and Razorpay configuration are ready.
   `INVENTORY_ENFORCEMENT_ENABLED=true` is required for negotiated checkout.
4. Keep the existing signed Razorpay webhook URL/secret. Subscribe to
   `payment_link.paid`, `payment_link.cancelled`, `payment_link.expired`,
   `refund.processed`, plus existing `payment.captured` and `payment.failed`.
5. Configure the backend scheduler to POST `/api/negotiation/events` regularly
   (e.g. every minute) with the existing server-side admin bearer credential.
   This bounded worker retries the outbox and reconciles pending/paid pilot
   orders, including missed refund webhooks. No public/browser event submission
   or new scheduler was activated by this task. Alert on a non-2xx response.
6. Verify the actual Razorpay account permits Payment Links and the intended
   remaining quote TTL. Its documented creation API mentions a 15-minute
   minimum for some accounts; the account's actual limit has **not** been
   tested by creating live links. Do not extend accepted quote expiry. If
   rejected, pause and coordinate an explicitly supported EON quote lifetime.
   Source: https://razorpay.com/docs/api/payments/payment-links/create-standard/

## One-product production acceptance checklist

- [ ] Sync Arctic Wave through the existing connection. Verify original124900,
  selling99900, EON20 total79900, customer shipping0, unknown costs still null.
  Confirm other products' prices and enablement did not change.
- [ ] In EON Rules approve actual product cost, preferred price, minimum,
  delivery expense and prepaid processor expense; select imported free customer shipping. Never fill missing
  costs with zero just to pass a check. Run the rule test.
- [ ] Select **Private testers only**, Arctic Wave only, quantity1/prepaid,
  product surface only. Configure **two product views AND 45 seconds on this
  visit**. Complete capabilities and exact-cart readiness tests, connector
  activation, then EON Trigger activation. Saving rules alone is not activation.
- [ ] Enable the store widget and generate EON's one-hour product-scoped tester
  link for `/products/arctic-wave-perfume`. An ordinary fresh browser must see
  no widget. Expired/invalid/other-product tester links must not grant access.
- [ ] First view after45s: no invitation. Second view before45s: no invitation.
  Second view after45s: “Still deciding?” appears. Dismiss and verify cooldown
  across reloads. Navigate to another product and confirm no stale invitation.
- [ ] “Make an offer” opens EON's conversation. Use the eligible postcode and
  EON20 coupon. Verify EON's evaluated ordinary price is ₹799. Accept an offer
  and use the explicit top-level checkout link.
- [ ] Confirm exact product/quantity/item amount/shipping and expiry. Retrying
  acceptance or payment preparation must return the same checkout/order/link.
  Attempt coupon/amount/cart tampering against the dedicated API and confirm
  rejection. An expired link must not take a new payment.
- [ ] Complete one real prepaid payment yourself. Compare provider captured
  amount with the EON quote and store order, confirm quote/installation
  attribution, stock deduction once, normal fulfillment, and signed paid event
  in EON. Replay the webhook and verify no duplicate order/stock/event.
- [ ] Test an unpaid cancellation and a refund of the paid test order through
  existing authorized operations. Verify full-refund reconciliation and event,
  partial-refund handling if used, and no automatic physical restocking.
- [ ] Test temporary delivery failure, then run recovery: same event ID, one EON
  result. Check provider timeouts recover the same reference without creating a
  second payment link. Resolve any ambiguous creation before reopening it.
- [ ] Pause in EON: no new invitation/offer. Turn off the store widget/checkout
  flags as a second stop. Existing captured orders still reconcile and report.
  Ordinary customers remain excluded throughout this acceptance test.

## Local validation and limits

Final local result: **61 tests passed**, production build passed, TypeScript
passed, and `git diff --check` passed. No live payment was performed.

The coordinated EON task independently accepted the store fixtures and reported
87 unit tests plus its build passing. Its isolated database tests also passed:
stored two-view/45-second invitation signals survive the zero-signal conversation
handoff; invitations are consumed once; durable checkout intent survives a lost
response and recovers the same quote/key after its own stock reservation. No
remaining cross-repository contract mismatch was reported. These platform
patches are local and must be included in the owner's EON deployment.

Run with Node22 (the system default Node18 is too old for installed Next):

```
npm run test:negotiation
node --test tests/*.test.cjs tests/*.test.mjs
npm run build
```

Tests use real store calculation/connector modules, mocked provider I/O and an
isolated PGlite PostgreSQL database. Test-only fixtures preserve the existing
inventory functions to exercise actual reservation/order-trigger behavior.
PGlite serializes queries: these tests verify uniqueness/atomic rollback/retry
logic but are not a multi-connection production load test. The actual installed
Supabase functions, permissions and concurrent requests require rollout checks.
The local store's catalog/context fixtures were also accepted by the current
EON repository's actual validators. Local browser checks confirmed Arctic's
product/cart/checkout amounts without creating an order or writing customer data.

The real payment, private-token invitation against the production origin,
provider account TTL, real webhook subscriptions, scheduled recovery and physical
cancellation/refund acceptance remain unperformed. Local readiness is not a
claim that the live integration has passed acceptance.
