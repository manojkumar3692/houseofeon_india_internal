-- Apply before enabling META_CAPI_ENABLED in production.
-- Isolated tracking ledger: no changes to orders, payments or inventory.
create table if not exists public.meta_purchase_events (
  order_number text primary key references public.orders(order_number) on delete cascade,
  event_id text unique not null,
  browser_context jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  last_attempt_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

-- Customer matching data is accessible only through the server service role.
alter table public.meta_purchase_events enable row level security;
revoke all on public.meta_purchase_events from anon, authenticated;
grant select, insert, update on public.meta_purchase_events to service_role;

create index if not exists idx_meta_purchase_pending
  on public.meta_purchase_events(last_attempt_at nulls first)
  where sent_at is null;

-- Recover missing ledger rows even if the browser never returned, context
-- storage failed, or the webhook process stopped before its background task.
create or replace function public.enqueue_trial_meta_purchases(p_start_at timestamptz)
returns void
language sql
security invoker
set search_path = public
as $$
  insert into public.meta_purchase_events(order_number, event_id)
  select o.order_number, 'purchase:' || o.order_number
  from public.orders o
  where o.order_type = 'trial_pack'
    and o.payment_status = 'paid'
    and o.payment_captured_at is not null
    and o.created_at >= p_start_at
    and not exists (
      select 1 from public.meta_purchase_events m where m.order_number = o.order_number
    )
  order by o.payment_captured_at
  limit 500
  on conflict (order_number) do nothing;
$$;
revoke all on function public.enqueue_trial_meta_purchases(timestamptz) from public, anon, authenticated;
grant execute on function public.enqueue_trial_meta_purchases(timestamptz) to service_role;
