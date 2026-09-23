# House of EON connector v3 staging rollout

Status: **partial implementation, NOT ready for negotiated checkout or activation**.
No deployment, database migration, live order, dashboard write, credential change,
or platform feature-switch change was performed. Keep the platform's
`NEGOTIATION_ENABLED=false`. The merchant rejects all connector requests outside
Vercel preview environments. The ordinary storefront checkout is unchanged.

## Inspection findings

- Next.js App Router, Supabase server administration, Razorpay orders/payment
  webhooks, Delhivery shipment creation. No repository AGENTS.md was found.
- Prices come from `lib/products.ts` in INR. Exact-cart unit pricing uses
  `getUnitPrice`: quantity 2+ automatically costs INR 799 per unit. No coupons,
  trial credits, COD or partial COD are accepted by this connector.
- Inventory belongs to another application's shared operations database. This
  repo calls `get_storefront_inventory_availability`,
  `reserve_storefront_inventory`, and `release_storefront_inventory_reservation`.
  The README references `hoe-whatsapp-cloud-api-starter` migration
  `supabase/migrations/010_storefront_inventory.sql`, which is not present here.
  The live Supabase schema and reservation/capture triggers have NOT been verified.
- No merchant-approved floor, tax approval, payment fee or shipping-cost policy
  exists in this repository. The migration adds empty, server-only policy tables;
  it inserts no invented economic facts. Shipping requires an approved,
  unexpired per-pincode/per-quantity rate including both cost and customer charge.
- Existing completed orders cannot establish reliable refund, bundle and
  exceptional-promotion exclusions. `sales` is null and sales capability is false.
  Do not substitute raw order history or an unqualified average.
- Current checkout recomputes retail/bundle amounts and creates Razorpay orders
  before saving the merchant order, without a negotiated idempotency ledger.
  It is unsuitable for enforcing a signed quote. `checkout=false`,
  `checkoutSupported=false`, and checkout requests return 422, including retries.
- Existing `payment.captured` webhook verifies Razorpay's signature but only logs
  amount mismatches. Refund events are ignored. Those paths must be extended for
  negotiated orders before any can be created. Failed payment attempts are not
  cancellations, and partial refunds are not full refunds.

## Implemented surface

`POST /api/negotiation/v3` reuses the supplied v3 request/response schemas and
reference handler. Vendored files come from the local negotiation platform's
`lib/commerce/contract.js` and `lib/connector-kit/index.js`. Imports were narrowed
to merchant-safe cryptographic helpers, malformed signatures/nonces are rejected,
nonce-store errors return 503, and outbound events have a timeout. No platform
credential unsealing code or database service key is included in browser code.

Capabilities, one-product catalog, exact-cart context and installation-scoped
reconciliation are implemented. Nonces are atomically persisted by a service-role
RPC. Missing facts, unsupported carts, database errors and inactive inventory fail
closed. Context revisions bind the normalized cart and authoritative facts; their
validity is bounded by both policy expirations and 60 seconds.

The migration adds nullable negotiation IDs to orders and an atomic event outbox.
Only orders with both IDs generate events, leaving ordinary orders unaffected.
`POST /api/negotiation/events` delivers up to five queued events to the fixed
platform origin using the reference event signer. Retry after 503; successful
remote delivery followed by a failed local acknowledgement reuses the same event
ID. It sends no customer records. An authenticated scheduler still needs setup.
This outbox does not itself implement provider cancellation/refund verification.

The product page has a dormant widget slot. It renders only in Vercel preview,
for the single configured product, when both widget and staging-verification
flags are true. Leave both false until the checkout blockers below are resolved.
The reference widget has no testing-mode parameter; preview placement and the
platform's disabled switch are the controls. Never put a secret in its workspace
key or any data attribute.

## Environment variables

Use preview-scoped server environment values; no new NEXT_PUBLIC secrets.

| Variable | Required value / purpose |
| --- | --- |
| `VERCEL_ENV` | Vercel-provided `preview`; production is rejected |
| `NEGOTIATION_CONNECTOR_ENABLED` | Default `false`; set true only for preview protocol testing |
| `NEGOTIATION_WORKSPACE_ID` | Platform-generated workspace UUID |
| `NEGOTIATION_INSTALLATION_ID` | Platform-generated installation UUID |
| `NEGOTIATION_INSTALLATION_SECRET` | Scoped installation secret, at least 32 characters |
| `NEGOTIATION_EVENT_WORKER_SECRET` | Separate merchant-generated random scheduler secret, at least 32 characters |
| `NEGOTIATION_STAGING_PRODUCT_ID` | Exactly one existing 50ml product ID |
| `NEGOTIATION_WIDGET_WORKSPACE_KEY` | Public widget workspace key from platform |
| `NEGOTIATION_WIDGET_ENABLED` | Leave `false` |
| `NEGOTIATION_STAGING_VERIFIED` | Leave `false`; this is not a substitute for test evidence |
| `NEXT_PUBLIC_SUPABASE_URL` | Staging merchant database URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Merchant backend only, never send to platform/browser |
| `INVENTORY_ENFORCEMENT_ENABLED` | Must be true for connector catalog/context; verify shared staging inventory first |
| `RAZORPAY_KEY_ID` | Staging `rzp_test_...` key; live keys rejected by context |
| `RAZORPAY_KEY_SECRET` | Corresponding merchant test secret |
| `RAZORPAY_WEBHOOK_SECRET` | Merchant's matching test webhook secret for later end-to-end tests |
| Platform `NEGOTIATION_ENABLED` | Keep `false` in the negotiation platform deployment |

The event platform origin is intentionally fixed to
`https://eon-negotiation.vercel.app`; it cannot be changed to an arbitrary host
that might receive the installation's signed events.

## Merchant dashboard / staging setup

1. Select an isolated Supabase staging database with the real operations inventory
   migrations and a Vercel preview using a company-owned staging subdomain. Do
   not run the migration against the shared production database yet.
2. In the platform, create/select the company workspace and verify its domain.
   Add a custom connector in Connections using
   `https://<company-owned-staging-subdomain>/api/negotiation/v3`.
   A bare Vercel preview hostname will not satisfy the reference domain check.
3. Obtain the generated workspace ID, installation ID and one-time installation
   secret; store those in merchant preview environment values. Do not enter a
   Supabase key in Connections. Keep the platform disabled.
4. Apply the existing merchant schema and inventory migration to staging, then
   `supabase/migration-negotiation-v3.sql` once. Review RLS and grants: anon and
   authenticated clients have no access to the four new tables or nonce RPC.
5. Merchant approves the selected product's floor, inclusive tax treatment and
   prepaid fee, with approver and expiry. Populate `negotiation_product_policy`.
   Add verified serviceability, merchant cost and customer charge for each exact
   pincode/quantity under test to `negotiation_shipping_rates`. No defaults are
   supplied. Review actual available-to-sell counts before enabling enforcement.
6. Set only the preview connector flag true. Run capabilities/catalog/context
   checks. Imported platform floors initially equal retail; review platform
   product policy against merchant-approved floors. Cart readiness is expected
   to fail while checkout capability remains false.
7. Configure a trusted scheduler to POST to `/api/negotiation/events` with
   `Authorization: Bearer <NEGOTIATION_EVENT_WORKER_SECRET>`. Preserve queued rows
   until delivery is acknowledged; monitor persistent 503s. Test event signatures,
   deduplication and retries with synthetic negotiated orders in staging only.
8. Finish the checkout work and matrix below. Only then configure the public
   widget workspace key and turn on the two widget flags for the one product.
   Production activation requires separate verified implementation, domain/cart
   checks, and explicit rollout authorization; this version has no production path.

## Outstanding checkout work (required before activation)

Obtain the actual inventory schema and prove its locking, reservation TTL and paid
stock conversion semantics. Implement a durable transaction that binds one
installation + idempotency key to an immutable quote payload, and a unique quote
ID to exactly one checkout. Repeated identical requests must return the same
checkout; changed payloads must conflict. Persist quote/cart revision and expiry,
revalidate price, floor, shipping, availability and payment support under the same
stock transaction, and reject stale or changed context before committing.

Add a merchant checkout that collects an address matching the quoted destination
and charges the persisted exact approved amount plus shipping, without coupons or
client price overrides. Handle provider timeouts/ambiguous creation without making
another payable order. Ensure expired reservations cannot leave a payable checkout
that oversells inventory. Verify captured amount/currency/order ownership before
fulfillment. Persist provider-authenticated cancellation and full-refund transitions
and their outbox events atomically, including reordered/duplicate notifications.

## Verification matrix

Local automated tests cover protocol binding, authentication, timestamp boundaries,
malformed input/signatures, concurrent replay attempts, replay-store failure,
response validation, disabled checkout and all three event signatures/failures.
They use mock storage/provider calls and do not prove PostgreSQL concurrency or
payment enforcement.

Staging acceptance still requires: SQL migration/grant checks; live inventory
mapping; missing/expired policies; current/bundle price; stock and price changes;
quote expiry; changed cart/destination; floor and shipping enforcement; duplicate
and concurrent checkout keys; reused quote under a new key; provider timeouts and
crash recovery; capture amount mismatch; late payment after expiry; cancelled and
refunded events; partial refunds; reordered/replayed webhooks; event delivery
outage/recovery; reconciliation; ordinary storefront regression and one-product
widget visibility. Record evidence for every case before changing any activation
flag. None of those live checks has been claimed as passed.

## Local verification results

- Node 22.23.2: all 31 tests passed (`node --test tests/*.test.cjs tests/*.test.mjs`).
- TypeScript passed with `--noEmit --incremental false --ignoreDeprecations 6.0`;
  the allowance is for the existing baseUrl configuration and was not committed.
- `npm run build` passed, including both new API routes. Network access was
  required for the storefront's existing Google Fonts downloads.
- Dependencies installed with `npm ci --ignore-scripts --legacy-peer-deps`; plain
  npm ci encounters the existing ESLint peer-resolution/lockfile conflict.
  The package manifest and lockfile were not changed.
- PostgreSQL migration and live staging/provider tests remain unexecuted.
