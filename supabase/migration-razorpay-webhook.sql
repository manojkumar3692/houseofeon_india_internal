-- Run this once in the Supabase SQL editor.
--
-- Supports the Razorpay webhook becoming the sole authority for "this order
-- is actually paid" — previously that decision was made from a single,
-- one-time message sent by the customer's own browser after checkout,
-- which is why a payment that never actually completed on Razorpay's side
-- (e.g. stuck at "created", never authorized/captured) could still end up
-- looking paid in our own records. The webhook only writes payment_status
-- to 'paid' after Razorpay's own servers confirm payment.captured.

alter table public.orders
  add column if not exists payment_captured_at timestamptz,
  add column if not exists payment_failed_reason text;

-- payment_captured_at: set only by the Razorpay webhook, only on a
--   payment.captured event. If this is null, no money has actually been
--   confirmed captured, regardless of what payment_status says elsewhere.
-- payment_failed_reason: set only by the webhook, only on payment.failed —
--   lets a genuinely failed attempt be told apart from an order nobody
--   ever finished checking out on (both previously just sat at 'pending'
--   forever with no way to distinguish them).

create index if not exists idx_orders_payment_captured_at
  on public.orders(payment_captured_at)
  where payment_captured_at is null;
