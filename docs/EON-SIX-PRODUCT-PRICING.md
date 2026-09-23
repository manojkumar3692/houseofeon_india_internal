# Approved six-product pricing update

This supersedes the earlier Arctic-only pricing scope. The owner explicitly
approved all six 50ml perfumes: Desert Tonka, Arctic Wave, Zyrox, RANK, SYRA and
Silent Gold.

- Original/MRP: INR1249 (124900 minor units).
- Selling price without coupons: INR999 (99900 minor units).
- Optional, manually entered EON20: round20% discount to INR200, payableINR799.
- Removing the coupon restoresINR999; it never automatically reapplies.
- Customer shipping remains free.

Existing automatically saved coupons without explicit-entry provenance are
cleared. Explicitly entered coupons persist across cart/checkout navigation.
Product pages/cards/schema/feed show the selling price, not the coupon result.
The connector reads all six prices from store_product_pricing and fails closed
on missing rows or drift. Coupon eligibility and calculated totals stay separate.

Trial/discovery pricing is unchanged. The existing two-or-more bottle bundle
remainsINR799 per bottle (two forINR1598), without coupon stacking. It equals
two manually discounted singles; there is no extra saving against those singles.
Negotiated checkout still charges exactly the signed approved amount without
additional coupons. Negotiation availability remains Arctic Wave/private testers
only: the price update does not enable negotiation on other products.

## Owner rollout

1. Apply supabase/migration-six-perfume-selling-prices.sql to the existing STORE
   Supabase database. It requires the earlier negotiation-checkout migration and
   upserts only the six approved rows. It is idempotent and leaves trial rows,
   inventory, orders, quotes, credentials and launch settings unchanged.
2. Deploy the matching store source. No new environment variable is required.
3. Sync the existing EON connection. Verify six products regular124900/selling99900,
   manual-coupon terms, explicit EON20 payable79900 and customer shipping0.
4. Check a normal single-bottle cart:999 → enter EON20:799 → remove:999.
5. Use a fresh private Arctic offer to test payment. Existing signed offers keep
   their original approved amounts and expiry; never revive cancelled checkouts.

Database application status: NOT APPLIED by this task. App deployment, commit,
push and live payment: NOT PERFORMED by this task.

Validation:71 automated tests pass, including all-six actual cart state flows,
ordinary checkout calculations, catalog database prices, migration replay and
preservation of an unrelated trial row. Production build and local browser
verification are recorded in the task handoff.

Final verification: production build passed. Local browser checks confirmed
Desert Tonka PDP999/strike1249, no-code cart999, explicit EON20 discount200 →799,
removal and checkout999, plus product-list cards999/strike1249. These were local
checks with database writes disabled; no real order or payment was created.
