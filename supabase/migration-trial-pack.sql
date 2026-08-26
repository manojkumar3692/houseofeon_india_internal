-- Run this once in the Supabase SQL editor to add support for the
-- Trial Pack (pick-3-scents, 8ml vials, ₹249) and its credit-back
-- mechanic (the trial order's own order_number doubles as a one-time
-- ₹249 discount code toward a full-size order, phone-matched, 30-day
-- window, enforced server-side).
--
-- Safe to run on an existing orders table: all new columns are additive
-- with backfill-safe defaults, so existing rows remain valid (they all
-- get order_type = 'standard').

alter table public.orders
  add column if not exists order_type text not null default 'standard',
  add column if not exists trial_selected_scents jsonb,
  add column if not exists trial_credit_redeemed_at timestamptz;

-- order_type: 'standard' (normal full-size order) | 'trial_pack'
-- trial_selected_scents: array of product ids the customer picked for
--   their trial pack (only set when order_type = 'trial_pack')
-- trial_credit_redeemed_at: set once this trial order's ₹249 credit has
--   been used as a discount code on a later order (see lib/trialCredit.ts)
--   — null means the credit is still available. Only ever set server-side,
--   at the moment the redeeming order is actually confirmed paid (same
--   webhook-is-truth pattern as payment_status itself).

alter table public.orders
  add constraint orders_order_type_check
  check (order_type in ('standard', 'trial_pack')) not valid;

alter table public.orders validate constraint orders_order_type_check;

-- Fast lookup for redemption checks: "is <code> a real, paid, unredeemed
-- trial order" is checked on every coupon-field entry at checkout.
create index if not exists idx_orders_trial_credit_lookup
  on public.orders(order_number)
  where order_type = 'trial_pack' and trial_credit_redeemed_at is null;
