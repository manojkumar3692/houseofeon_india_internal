# Read-only merchant onboarding

This replaces the earlier staging-first onboarding. The merchant keeps its
existing hosting and Supabase database. No new database, payment test account,
staging domain or widget is needed to connect catalog and stock.

## What this release permits

The signed v3 endpoint works on production or preview when explicitly enabled.
It exposes the existing code-defined 50ml catalog and reads authoritative stock
from `get_storefront_inventory_availability`. Prices are retail minor-unit INR;
cart-specific bundle pricing is not offered as a negotiated quote. Missing,
ambiguous or invalid inventory fails closed. No customer or order data is read.

Context, checkout, reconciliation and event delivery are unavailable. Capability
flags accurately report these limits. The product-page widget slot is removed;
setting old widget flags cannot activate it. Existing checkout is unchanged.
The only connector write is its isolated replay-security nonce store. Catalog
reads invoke the existing inventory RPC; its deployed definition must be reviewed
for any internal cleanup writes before promising strict database read-only behavior.

## Developer setup (one-time; not a merchant dashboard checklist)

1. Review the connector branch against current main and deploy after approval.
2. In the existing merchant Supabase SQL editor, run only
   `supabase/migration-negotiation-read-only.sql`. It is rerunnable and creates a
   nonce table and restricted atomic RPC. It does not alter orders, inventory,
   policy tables or payment triggers. The superseded full staging migration has been removed from this branch.
3. Keep the existing merchant `NEXT_PUBLIC_SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY` on the backend. Confirm the inventory RPC exposes
   product_key, size, available_stock, available and storefront_enabled with the
   expected types. Neither credentials nor raw database responses go to EON.
4. For the production connection, use
   `https://www.houseofeon.in/api/negotiation/v3` (the existing canonical host,
   avoiding the apex redirect). Configure this endpoint in EON Connections.
   Generating a connection replaces its secret; store the newly issued value
   directly in the merchant's Production environment, never in chat or Git.
5. Set the following four server-only environment variables, then deploy with
   those values. Leave existing Preview values in place until cleanup.

| Variable | Value |
| --- | --- |
| NEGOTIATION_CONNECTOR_ENABLED | true (false or absent disables endpoint) |
| NEGOTIATION_WORKSPACE_ID | Existing platform workspace UUID |
| NEGOTIATION_INSTALLATION_ID | Generated installation UUID |
| NEGOTIATION_CONNECTOR_SECRET | Generated scoped secret |

The older name `NEGOTIATION_INSTALLATION_SECRET` still works. There is no need to
rename an existing installation's setting. If both names exist, they must match;
conflicting values fail closed. Whitespace, short secrets and invalid UUIDs also
fail closed. Keep secrets separate between environments/installations when used.
No `NEGOTIATION_STAGING_PRODUCT_ID`, shipping policy, approved floor, Razorpay key
or event-worker configuration is needed for this release.

## Merchant experience

Select Custom Store, use the endpoint supplied by the integration developer,
and connect. The developer installs/configures the connector once. Test
capabilities, then synchronize the catalog. Review the real prices and stock.
This means **connected for reading data**, not **ready for negotiation**.
New imported products retain the platform's retail-equal floor default.
Keep platform NEGOTIATION_ENABLED disabled. Do not activate or install a widget:
exact-cart readiness intentionally fails until checkout/economics are implemented.

The platform currently still displays generic upstream error codes and requires
manual credentials. A one-token installer is a future platform change, not a
feature implemented by this merchant update. The accepted configuration alias
resolves the existing secret-label mismatch without further renaming.

## Verification and rollback

Tests cover production configuration, legacy/current names, conflicting secrets,
pagination, unavailable inventory, operation blocking and the existing signed
protocol/replay cases. Build and storefront tests should pass before deployment.
Production verification must additionally exercise the actual nonce RPC, RLS,
concurrent claims, database access and platform capabilities/catalog requests.
Those live checks require the deployed configuration and have not run locally.

On failure set NEGOTIATION_CONNECTOR_ENABLED=false and redeploy. Do not alter the
normal storefront checkout or disable its inventory checks. Keep Vercel Preview
protection enabled. After the production read connection is verified, remove the
unused staging connection/domain/variables as a separate cleanup; don't delete
existing production variables or domain records.

## Validation of this change

Before rollout, 41 local tests and the production build passed on main base 879cfd9.
The superseded staging-only code, widget component, broad migration and four
context tests were then removed; deployment validation is recorded in the task.
Production database and credential setup must be verified separately.
