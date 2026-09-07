-- Run once in the Supabase SQL editor before enabling the Delhivery
-- environment variables. These fields make shipment creation observable and
-- idempotent, so a retried Razorpay webhook cannot create a duplicate AWB.

alter table public.orders
  add column if not exists delhivery_status text not null default 'pending',
  add column if not exists delhivery_waybill text,
  add column if not exists delhivery_tracking_url text,
  add column if not exists delhivery_created_at timestamptz,
  add column if not exists delhivery_error text,
  add column if not exists delhivery_attempts integer not null default 0;

alter table public.orders
  add constraint orders_delhivery_status_check
  check (delhivery_status in ('pending', 'processing', 'created', 'failed'))
  not valid;

alter table public.orders validate constraint orders_delhivery_status_check;

create unique index if not exists idx_orders_delhivery_waybill
  on public.orders(delhivery_waybill)
  where delhivery_waybill is not null;

create index if not exists idx_orders_delhivery_pending
  on public.orders(delhivery_status)
  where payment_status = 'paid' and delhivery_status in ('pending', 'failed');
