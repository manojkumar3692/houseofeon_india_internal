# House of Eon Mini Store

A lean perfume checkout website built with Next.js, Supabase, Razorpay, Resend email, admin orders, and SEO pages.

## What this includes

- Home page
- Product listing
- Product detail pages
- Cart with localStorage
- Checkout form
- Razorpay order creation
- Razorpay signature verification
- Supabase order storage
- Office/customer email notification via Resend
- Admin login
- Admin order list
- Shipping status and tracking URL update
- SEO pages for perfume keywords
- Track order by order number + phone

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Supabase setup

Open Supabase SQL editor and run:

```sql
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  customer_address text not null,
  customer_city text,
  customer_state text,
  customer_pincode text,
  items jsonb not null,
  amount_in_paise integer not null,
  payment_status text not null default 'pending',
  razorpay_order_id text unique,
  razorpay_payment_id text,
  shipping_status text not null default 'pending',
  tracking_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_order_number on public.orders(order_number);
create index if not exists idx_orders_phone on public.orders(customer_phone);
create index if not exists idx_orders_payment_status on public.orders(payment_status);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();
```

This project uses the Supabase service role key only in server route handlers. Do not expose `SUPABASE_SERVICE_ROLE_KEY` in client code.

## Razorpay setup

1. Create Razorpay account.
2. Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID` in `.env.local`.
3. Test checkout in Razorpay test mode first.

## Email setup

1. Create a Resend API key.
2. Verify your sending domain.
3. Set `RESEND_API_KEY`, `EMAIL_FROM`, and `OFFICE_EMAIL`.

If `RESEND_API_KEY` is blank, order emails are skipped but orders still save.

## Admin

Visit `/admin`, enter `ADMIN_PASSWORD`, and manage orders.

## Edit products

Edit `lib/products.ts`.
