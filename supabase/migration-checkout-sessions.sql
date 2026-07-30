-- Run this once in the Supabase SQL editor.
--
-- Captures the checkout funnel progressively, starting well before a
-- customer clicks "Pay" — as soon as they've viewed the checkout page or
-- typed a phone number, not just when an order row is finally created.
-- One row per browser session (keyed by a client-generated session_key
-- stored in sessionStorage), upserted in place as the customer progresses,
-- rather than a fresh row per attempt. This is what lets you see exactly
-- which stage people stall at, and gives you contact details + cart
-- contents even for people who never finished checking out.
--
-- Stage timestamps are set server-side (not from client-supplied values)
-- so they can't be skewed by a customer's device clock.

create table if not exists public.checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  session_key text not null unique,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_activity_at timestamptz,

  -- Funnel stage timestamps — nullable, filled in as each stage happens.
  -- order_created_at and paid_at are set only by the server (orders/create
  -- and orders/verify respectively), never by the client-facing endpoint,
  -- since those two are the "ground truth" transitions.
  page_viewed_at timestamptz,
  phone_captured_at timestamptz,
  submitted_at timestamptz,
  razorpay_opened_at timestamptz,
  razorpay_dismissed_at timestamptz,
  payment_failed_at timestamptz,
  order_created_at timestamptz,
  paid_at timestamptz,

  -- Contact + address fields, filled in progressively as each is blurred.
  name text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  pincode text,

  payment_method text,
  payment_failed_reason text,

  -- The field the customer was last interacting with — the single best
  -- "why did they leave" signal, especially when paired with a beacon
  -- fired at tab-close/app-switch time.
  last_active_field text,

  -- Cart snapshot at time of capture — what they actually intended to buy,
  -- so abandonment can be analyzed per-product, not just in aggregate.
  cart_items jsonb,
  cart_value_in_paise integer,

  -- Acquisition context — lets you tell whether drop-off differs by entry
  -- point (ad campaign vs organic vs the swipe game vs direct PDP).
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  device_type text,

  -- Links back to the real order once one is actually created.
  order_number text
);

create index if not exists idx_checkout_sessions_session_key
  on public.checkout_sessions(session_key);

create index if not exists idx_checkout_sessions_order_number
  on public.checkout_sessions(order_number);

-- Fast lookup for "people who showed intent but never paid" — the core
-- retargeting/reporting query this table exists for.
create index if not exists idx_checkout_sessions_unpaid
  on public.checkout_sessions(created_at)
  where paid_at is null;
