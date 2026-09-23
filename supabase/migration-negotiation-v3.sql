-- Staging only. Uses the existing orders table; creates no catalog/stock copies.
begin;
create table public.negotiation_nonces (
  installation_id uuid not null,
  nonce text not null check (length(nonce) between 1 and 240),
  expires_at timestamptz not null,
  primary key (installation_id, nonce)
);
create index on public.negotiation_nonces(expires_at);
create function public.claim_negotiation_nonce(p_installation_id uuid, p_nonce text, p_expires_at timestamptz)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  delete from negotiation_nonces where expires_at < clock_timestamp();
  insert into negotiation_nonces values (p_installation_id, p_nonce,
    greatest(p_expires_at, clock_timestamp() + interval '61 seconds')) on conflict do nothing;
  return found;
end; $$;
revoke all on function public.claim_negotiation_nonce(uuid,text,timestamptz) from public, anon, authenticated;
grant execute on function public.claim_negotiation_nonce(uuid,text,timestamptz) to service_role;

create table public.negotiation_product_policy (
  product_id text primary key,
  enabled boolean not null default false,
  floor_minor integer not null check (floor_minor >= 0),
  tax_basis text not null check (tax_basis = 'inclusive'),
  prepaid_fee_minor integer not null check (prepaid_fee_minor >= 0),
  approved_by text not null check (length(approved_by) > 0),
  valid_until timestamptz not null,
  updated_at timestamptz not null default now()
);
-- Explicitly approved per-pincode/per-quantity quotes. No free-shipping default.
create table public.negotiation_shipping_rates (
  id uuid primary key default gen_random_uuid(),
  postal_code text not null check (postal_code ~ '^[0-9]{6}$'),
  quantity integer not null check (quantity between 1 and 20),
  serviceable boolean not null,
  merchant_cost_minor integer not null check (merchant_cost_minor >= 0),
  customer_charge_minor integer not null check (customer_charge_minor >= 0),
  approved_by text not null check (length(approved_by) > 0),
  valid_until timestamptz not null,
  unique (postal_code, quantity)
);

alter table public.orders
  add column negotiation_installation_id uuid,
  add column negotiation_external_id uuid unique;

create table public.negotiation_event_outbox (
  event_id uuid primary key default gen_random_uuid(),
  installation_id uuid not null,
  external_id uuid not null,
  type text not null check (type in ('checkout.paid','checkout.cancelled','checkout.refunded')),
  occurred_at timestamptz not null default now(),
  delivered_at timestamptz,
  unique (installation_id, external_id, type)
);
create function public.enqueue_negotiation_order_event()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.negotiation_external_id is null or new.negotiation_installation_id is null then return new; end if;
  if new.payment_status not in ('paid','cancelled','refunded') then return new; end if;
  if new.payment_status = 'paid' and new.payment_captured_at is null then
    raise exception 'Negotiated payment must have verified capture';
  end if;
  insert into negotiation_event_outbox(installation_id,external_id,type)
    values (new.negotiation_installation_id,new.negotiation_external_id,'checkout.' || new.payment_status)
    on conflict do nothing;
  return new;
end; $$;
create trigger negotiation_order_event after insert or update of payment_status,payment_captured_at
  on public.orders for each row execute function public.enqueue_negotiation_order_event();
revoke all on function public.enqueue_negotiation_order_event() from public, anon, authenticated;

alter table public.negotiation_nonces enable row level security;
alter table public.negotiation_product_policy enable row level security;
alter table public.negotiation_shipping_rates enable row level security;
alter table public.negotiation_event_outbox enable row level security;
revoke all on public.negotiation_nonces, public.negotiation_product_policy,
  public.negotiation_shipping_rates, public.negotiation_event_outbox from public, anon, authenticated;
grant all on public.negotiation_nonces, public.negotiation_product_policy,
  public.negotiation_shipping_rates, public.negotiation_event_outbox to service_role;
commit;
