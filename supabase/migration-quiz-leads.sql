-- Run this once in the Supabase SQL editor to add storage for the Scent
-- Finder quiz's optional lead capture (phone/email left by visitors who
-- want their match + discount code saved for future marketing outreach).

create table if not exists public.quiz_leads (
  id uuid primary key default gen_random_uuid(),

  phone text,
  email text,

  gender_answer text,
  occasion_answer text,
  mood_answer text,

  recommended_product_id text,
  recommended_product_name text,
  coupon_code text default 'EON20',

  created_at timestamptz not null default now()
);

create index if not exists idx_quiz_leads_created_at on public.quiz_leads(created_at);
create index if not exists idx_quiz_leads_phone on public.quiz_leads(phone);
