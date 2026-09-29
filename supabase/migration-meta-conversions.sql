-- First-party Meta attribution + a durable Conversions API outbox.
-- Apply after migration-checkout-sessions.sql and migration-razorpay-webhook.sql.

alter table public.checkout_sessions
  add column if not exists landing_url text,
  add column if not exists fbclid text,
  add column if not exists fbp text,
  add column if not exists fbc text,
  add column if not exists visitor_id text,
  add column if not exists client_ip_address text,
  add column if not exists client_user_agent text;

create index if not exists idx_checkout_sessions_visitor_id
  on public.checkout_sessions(visitor_id)
  where visitor_id is not null;

create table if not exists public.meta_conversion_outbox (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_name text not null check (event_name in ('Purchase')),
  order_number text not null references public.orders(order_number),
  event_time timestamptz not null,

  status text not null default 'pending'
    check (status in ('pending', 'processing', 'delivered', 'permanent_failure')),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz default now(),
  lease_token uuid,
  lease_until timestamptz,

  last_http_status integer,
  last_error text,
  meta_response jsonb,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_meta_conversion_outbox_due
  on public.meta_conversion_outbox(next_attempt_at, created_at)
  where delivered_at is null and status <> 'permanent_failure';

alter table public.meta_conversion_outbox enable row level security;
revoke all on public.meta_conversion_outbox from public, anon, authenticated;
grant all on public.meta_conversion_outbox to service_role;

-- One worker atomically leases one due row. SKIP LOCKED prevents concurrent
-- webhooks/cron invocations from claiming the same delivery attempt. Meta's
-- event_id remains the final safety net if a network response is lost.
create or replace function public.claim_meta_conversion(
  p_lease_token uuid,
  p_lease_seconds integer default 120
)
returns setof public.meta_conversion_outbox
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidate as (
    select id
    from public.meta_conversion_outbox
    where delivered_at is null
      and status <> 'permanent_failure'
      and coalesce(next_attempt_at, now()) <= now()
      and (lease_until is null or lease_until < now())
    order by event_time, created_at
    limit 1
    for update skip locked
  )
  update public.meta_conversion_outbox o
  set status = 'processing',
      attempts = o.attempts + 1,
      lease_token = p_lease_token,
      lease_until = now() + make_interval(secs => greatest(30, least(p_lease_seconds, 600))),
      updated_at = now()
  from candidate
  where o.id = candidate.id
  returning o.*;
end;
$$;

revoke all on function public.claim_meta_conversion(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.claim_meta_conversion(uuid, integer)
  to service_role;

