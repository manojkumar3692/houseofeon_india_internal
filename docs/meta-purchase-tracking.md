# Trial-pack Meta purchase tracking

The browser Pixel and Conversions API both use `Purchase` and
`purchase:<order_number>` as the event ID. The browser passes it in the fourth
`fbq` argument (`eventID`); the server passes `event_id` to the same dataset.
The server sends only trial-pack orders recorded as paid by the signed Razorpay
`payment.captured` webhook. Regular checkout, COD calculations, emails, inventory
and shipment behavior are unchanged.

## Activation

1. Apply `supabase/migration-meta-purchases.sql` after the existing trial-pack and
   Razorpay webhook migrations. It adds a private delivery ledger and recovery
   function; it does not change the orders table. Only the service role can read
   or write the ledger.
2. Deploy this code with `META_CAPI_ENABLED=false` first. This deploys browser
   event IDs before server events can be emitted.
3. Set server-only `META_CAPI_ACCESS_TOKEN` to a Conversions API token with access
   to the dataset identified by the existing `NEXT_PUBLIC_META_PIXEL_ID`. Do not
   create a second pixel or expose the token through a `NEXT_PUBLIC_` variable.
   `META_CAPI_API_VERSION` defaults to `v23.0` and is configurable.
4. Set `META_CAPI_START_AT` to an ISO UTC timestamp at/after step 2's deployment,
   for example the actual activation time. Orders created before this cutoff
   are excluded to avoid duplicating historical browser events without IDs.
5. Set a strong random `CRON_SECRET`. Configure an authenticated scheduler to
   call `GET https://www.houseofeon.in/api/internal/meta-purchases/retry` every
   five minutes, with `Authorization: Bearer <CRON_SECRET>`. Use the scheduler's
   secret storage. The endpoint processes up to 10 pending paid orders per run.
   The scheduler must alert on non-2xx responses. No scheduler is provisioned by
   this code; configure one before enabling CAPI. A Vercel Cron can use this
   route and `CRON_SECRET` if the hosting plan supports that frequency.
6. Set `META_CAPI_ENABLED=true` in the production deployment and redeploy.
   Production mode, the exact `https://www.houseofeon.in` request origin and a
   live server Razorpay key are all required. Vercel preview deployments are
   explicitly excluded. Local/test payments never send server purchases.

Do not replay older purchases merely to make Ads Manager match the store.
Received purchase events and ad-attributed results remain different metrics.

## Delivery and failure behavior

- Order creation saves browser `_fbp`/`_fbc`, user agent and, on Vercel, the
  trusted client IP in a separate ledger. A missing cookie or failed context
  write never rejects an order. No click ID is invented: an `fbc` fallback is
  generated only from a real `fbclid` on the same-origin referrer.
- After the paid-order work, a separate Next.js `after()` task attempts Meta
  delivery with a 2.5-second HTTP timeout. Meta failures do not alter Razorpay's
  successful webhook response, paid status, emails or shipments.
- Only an explicit `events_received: 1` acknowledgement marks a delivery sent.
  The private ledger records acknowledgement time and sanitized failure codes.
- The scheduled worker backfills missing ledger rows from confirmed paid trial
  orders, including cases where context storage or the background task failed.
  It retries unsent deliveries using the original capture timestamp and event
  ID. Attempt ordering prevents a failing record from blocking the entire queue.
- Concurrent sends and lost acknowledgements reuse the same ID for Meta's
  deduplication. Persisted `sent_at` prevents resending acknowledged orders on
  later webhook replays. Do not clear it or change the rollout cutoff casually.
- Email and phone are normalized and SHA-256 hashed before sending. Cookies,
  client IP and user agent use Meta's unhashed fields. The webhook request's
  Razorpay user agent/IP are never passed off as the customer's browser.
- Server value comes from the stored trial order, in INR, and scent IDs match
  the existing browser purchase contents. Browser purchase timing is unchanged:
  it still runs after signature verification; the server path requires capture.
- Retries depend on the configured scheduler. Prolonged outages still require
  intervention: Meta enforces event-age and deduplication windows. Do not change
  an event's timestamp to make an old rejected event appear new.

## Verification

Run `node --test tests/meta-purchases.test.cjs` (Node 20+) and TypeScript checks.
These tests use mocked providers and cannot validate live Meta acceptance.

After activation, inspect a subsequent real paid trial order in Events Manager:
verify the dataset, server `Purchase`, INR value, matching browser/server event
IDs and deduplication diagnostics when both paths are present. Inspect the
corresponding ledger row for `sent_at`. Confirm the scheduled endpoint returns
`enabled: true` and no failures. An accepted event alone does not prove ad
attribution or customer matching quality.

For an outstanding-delivery audit, run this read-only query in Supabase:

```sql
select o.order_number, o.payment_captured_at, m.sent_at,
       m.last_attempt_at, m.last_error
from public.orders o
left join public.meta_purchase_events m using (order_number)
where o.order_type = 'trial_pack'
  and o.payment_status = 'paid'
  and o.payment_captured_at is not null
  and o.created_at >= '<META_CAPI_START_AT>'::timestamptz
  and m.sent_at is null
order by o.payment_captured_at;
```

Rollback: set `META_CAPI_ENABLED=false` and redeploy. Browser tracking remains
active and the private ledger can remain in place. Disable the retry scheduler
if desired; do not delete paid orders or payment state.

Protocol references: [Meta's official Conversions API SDK example](https://github.com/facebook/facebook-nodejs-business-sdk#conversions-api)
and [Pixel/server deduplication](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events/).
