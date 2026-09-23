-- STORE Supabase migration, separate from EON's Neon migration 008.
-- Review/apply at deployment. No prices, costs, credentials or launch settings.
begin;
-- Explicitly approved Arctic Wave price only. No bulk catalogue repricing.
create table if not exists public.store_product_pricing (
  product_id text primary key,
  regular_minor integer not null check (regular_minor > 0),
  selling_minor integer not null check (selling_minor > 0 and selling_minor <= regular_minor),
  currency text not null check (currency='INR'),
  tax_basis text not null check (tax_basis='inclusive'),
  updated_at timestamptz not null default now()
);
alter table public.store_product_pricing enable row level security;
revoke all on public.store_product_pricing from public,anon,authenticated;
grant select on public.store_product_pricing to service_role;
insert into public.store_product_pricing(product_id,regular_minor,selling_minor,currency,tax_basis)
values ('arctic-wave',124900,99900,'INR','inclusive') on conflict (product_id) do nothing;

create table if not exists public.negotiation_checkouts (
  id uuid primary key,
  installation_id uuid not null,
  idempotency_key text not null,
  quote jsonb not null,
  items jsonb not null,
  expires_at timestamptz not null,
  state text not null default 'pending' check (state in ('pending','paid','cancelled','refunded')),
  provider_state text not null default 'unstarted' check (provider_state in ('unstarted','creating','ready')),
  provider_link_id text unique,
  provider_url text,
  order_id uuid unique references public.orders(id),
  payment_id text unique,
  refunded_minor integer not null default 0,
  last_reconciled_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (installation_id, idempotency_key)
);
create table if not exists public.negotiation_outbox (
  event_id uuid primary key default gen_random_uuid(),
  checkout_id uuid not null references public.negotiation_checkouts(id),
  installation_id uuid not null,
  event_type text not null check (event_type in ('checkout.paid','checkout.cancelled','checkout.refunded')),
  occurred_at timestamptz not null default now(),
  delivered_at timestamptz,
  lease_until timestamptz,
  lease_token uuid,
  unique (checkout_id, event_type)
);
alter table public.orders add column if not exists negotiation_quote_id uuid unique;
alter table public.orders add column if not exists negotiation_installation_id uuid;
alter table public.orders add column if not exists negotiation_shipping_minor integer;
alter table public.orders add column if not exists negotiation_state text;
alter table public.orders add column if not exists negotiation_refunded_minor integer not null default 0;
alter table public.negotiation_checkouts enable row level security;
alter table public.negotiation_outbox enable row level security;
revoke all on public.negotiation_checkouts, public.negotiation_outbox from public, anon, authenticated;
grant all on public.negotiation_checkouts, public.negotiation_outbox to service_role;

-- Claim quote and stock in the SAME transaction. A quote cannot be rebound to
-- another key/cart/amount, even if requests race or the HTTP response is lost.
create or replace function public.create_negotiation_checkout(
  p_installation uuid, p_key text, p_quote jsonb, p_items jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare c public.negotiation_checkouts; ttl integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_installation::text || ':' || p_key, 0));
  perform pg_advisory_xact_lock(hashtextextended(p_quote->>'id', 0));
  select * into c from public.negotiation_checkouts where id=(p_quote->>'id')::uuid
    or (installation_id=p_installation and idempotency_key=p_key) for update;
  if found then
    if c.installation_id<>p_installation or c.idempotency_key<>p_key or c.quote<>p_quote then raise exception 'Quote/key conflict'; end if;
    if c.state<>'pending' or c.expires_at<=now() then raise exception 'Quote consumed or expired'; end if;
    return jsonb_build_object('id',c.id,'status','already_created');
  end if;
  ttl := floor(extract(epoch from ((p_quote->>'expiresAt')::timestamptz-now())))::integer;
  if ttl<1 or ttl>3540 or (p_quote->>'amountMinor')::bigint<100 or
    (p_quote->>'shippingMinor')::bigint<>0 or p_quote->>'currency'<>'INR' then raise exception 'Invalid quote'; end if;
  perform public.reserve_storefront_inventory(p_quote->>'id',p_items,greatest(60,ttl+60));
  insert into public.negotiation_checkouts(id,installation_id,idempotency_key,quote,items,expires_at)
    values ((p_quote->>'id')::uuid,p_installation,p_key,p_quote,p_items,(p_quote->>'expiresAt')::timestamptz);
  return jsonb_build_object('id',p_quote->>'id','status','created');
end $$;

create or replace function public.claim_negotiation_event(p_id uuid,p_installation uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e public.negotiation_outbox;
begin
  perform pg_advisory_xact_lock(hashtextextended('event:'||p_id::text,0));
  select * into e from public.negotiation_outbox where checkout_id=p_id and installation_id=p_installation
    and delivered_at is null order by occurred_at,case event_type when 'checkout.paid' then 0 else 1 end limit 1 for update;
  if not found or e.lease_until>now() then return null; end if;
  update public.negotiation_outbox set lease_until=now()+interval '60 seconds',lease_token=gen_random_uuid()
    where event_id=e.event_id returning * into e;
  return to_jsonb(e);
end $$;

-- Exactly one request gets permission to call the payment provider. A retry
-- recovers by the stable provider reference; it never blindly creates again.
create or replace function public.prepare_negotiation_payment(p_id uuid,p_installation uuid,p_customer jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c public.negotiation_checkouts; oid uuid; claimed boolean := false; total integer;
begin
  select * into c from public.negotiation_checkouts where id=p_id and installation_id=p_installation for update;
  if not found or c.state<>'pending' or c.expires_at<=now() then raise exception 'Checkout unavailable'; end if;
  if c.provider_state='unstarted' then
    if c.quote#>>'{cart,destination,country}'<>'IN' or c.quote#>>'{cart,destination,postalCode}'<>p_customer->>'pincode' then
      raise exception 'Destination differs from approved cart';
    end if;
    total := (c.quote->>'amountMinor')::integer+(c.quote->>'shippingMinor')::integer;
    insert into public.orders(order_number,customer_name,customer_phone,customer_email,customer_address,
      customer_city,customer_state,customer_pincode,items,subtotal_in_paise,coupon_code,coupon_discount_in_paise,
      amount_in_paise,payment_type,token_amount_in_paise,balance_due_in_paise,cod_balance_status,payment_status,
      shipping_status,inventory_reservation_key,negotiation_quote_id,negotiation_installation_id,negotiation_shipping_minor)
    values ('EON-'||replace(c.id::text,'-',''),p_customer->>'name',p_customer->>'phone',p_customer->>'email',
      p_customer->>'address',p_customer->>'city',p_customer->>'state',p_customer->>'pincode',c.items,
      (c.quote->>'amountMinor')::integer,null,0,total,'full',0,0,'not_applicable','pending','pending',c.id::text,c.id,
      c.installation_id,(c.quote->>'shippingMinor')::integer) returning id into oid;
    update public.negotiation_checkouts set order_id=oid,provider_state='creating' where id=c.id;
    claimed := true;
  end if;
  return jsonb_build_object('claimed',claimed);
end $$;

-- State, ordinary order and durable outbound event are committed together.
-- Provider amounts/currency/binding are verified by the server before this RPC.
create or replace function public.apply_negotiation_state(
  p_id uuid,p_installation uuid,p_state text,p_payment text default null,p_provider_order text default null,
  p_refunded integer default 0,p_provider_cancelled boolean default false
) returns boolean language plpgsql security definer set search_path = public as $$
declare c public.negotiation_checkouts; changed boolean;
begin
  select * into c from public.negotiation_checkouts where id=p_id and installation_id=p_installation for update;
  if not found or p_state not in ('paid','cancelled','refunded') then raise exception 'Invalid transition'; end if;
  if c.state='refunded' then return false; end if;
  if p_state='cancelled' and c.state='paid' then raise exception 'Paid checkout requires refund'; end if;
  if p_state='cancelled' and c.provider_state<>'unstarted' and not p_provider_cancelled then raise exception 'Provider cancellation required'; end if;
  if p_state in ('paid','refunded') and (c.order_id is null or p_payment is null or
      (c.payment_id is not null and c.payment_id<>p_payment)) then raise exception 'Payment mismatch'; end if;
  if p_refunded<0 or p_refunded>(c.quote->>'amountMinor')::integer+(c.quote->>'shippingMinor')::integer then raise exception 'Invalid refund'; end if;
  if p_state='refunded' and p_refunded<>(c.quote->>'amountMinor')::integer+(c.quote->>'shippingMinor')::integer then raise exception 'Incomplete refund'; end if;
  changed := c.state<>p_state;
  -- If reconciliation first sees a full refund, preserve the paid event too.
  if p_state in ('paid','refunded') then
    update public.orders set payment_status='paid',razorpay_payment_id=p_payment,
      razorpay_order_id=coalesce(p_provider_order,razorpay_order_id),payment_captured_at=coalesce(payment_captured_at,now())
      where id=c.order_id and payment_captured_at is null;
    insert into public.negotiation_outbox(checkout_id,installation_id,event_type)
      values(c.id,c.installation_id,'checkout.paid') on conflict do nothing;
  end if;
  if p_state='cancelled' then
    perform public.release_storefront_inventory_reservation(c.id::text,'released');
    update public.orders set shipping_status='cancelled' where id=c.order_id;
  end if;
  -- Keep payment_status='paid' on refunds: the existing inventory trigger
  -- restocks on any non-paid status. A money refund is not proof of a return.
  update public.negotiation_checkouts set state=p_state,payment_id=coalesce(p_payment,payment_id),
    refunded_minor=greatest(refunded_minor,p_refunded) where id=c.id;
  update public.orders set negotiation_state=p_state,
    negotiation_refunded_minor=greatest(negotiation_refunded_minor,p_refunded) where id=c.order_id;
  insert into public.negotiation_outbox(checkout_id,installation_id,event_type)
    values(c.id,c.installation_id,'checkout.'||p_state) on conflict do nothing;
  return changed;
end $$;

revoke all on function public.create_negotiation_checkout(uuid,text,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.prepare_negotiation_payment(uuid,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.apply_negotiation_state(uuid,uuid,text,text,text,integer,boolean) from public,anon,authenticated;
grant execute on function public.create_negotiation_checkout(uuid,text,jsonb,jsonb) to service_role;
grant execute on function public.prepare_negotiation_payment(uuid,uuid,jsonb) to service_role;
grant execute on function public.apply_negotiation_state(uuid,uuid,text,text,text,integer,boolean) to service_role;
revoke all on function public.claim_negotiation_event(uuid,uuid) from public,anon,authenticated;
grant execute on function public.claim_negotiation_event(uuid,uuid) to service_role;
commit;
