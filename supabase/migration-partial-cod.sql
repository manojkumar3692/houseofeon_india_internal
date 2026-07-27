-- Run this once in the Supabase SQL editor to add support for the
-- "token payment + COD balance" checkout option.
--
-- Safe to run on an existing orders table: all new columns are additive
-- with backfill-safe defaults, so existing rows remain valid.

alter table public.orders
  add column if not exists payment_type text not null default 'full',
  add column if not exists token_amount_in_paise integer not null default 0,
  add column if not exists balance_due_in_paise integer not null default 0,
  add column if not exists cod_balance_status text not null default 'not_applicable';

-- payment_type: 'full' (paid entirely online) | 'partial_cod' (token paid
--   online, balance_due_in_paise collected as cash on delivery)
-- cod_balance_status: 'not_applicable' | 'pending' | 'collected'

alter table public.orders
  add constraint orders_payment_type_check
  check (payment_type in ('full', 'partial_cod')) not valid;

alter table public.orders
  add constraint orders_cod_balance_status_check
  check (cod_balance_status in ('not_applicable', 'pending', 'collected')) not valid;

-- Validate the constraints against existing data (all rows currently have
-- defaults that satisfy them, so this should succeed immediately).
alter table public.orders validate constraint orders_payment_type_check;
alter table public.orders validate constraint orders_cod_balance_status_check;

create index if not exists idx_orders_cod_balance_status
  on public.orders(cod_balance_status)
  where cod_balance_status = 'pending';
