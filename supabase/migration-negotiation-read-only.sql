-- Minimal production connector prerequisite. No order changes or triggers.
-- Rerunnable and compatible with the earlier staging nonce table.
begin;
create table if not exists public.negotiation_nonces (
  installation_id uuid not null,
  nonce text not null check (length(nonce) between 1 and 240),
  expires_at timestamptz not null,
  primary key (installation_id, nonce)
);
create index if not exists negotiation_nonces_expiry on public.negotiation_nonces(expires_at);
alter table public.negotiation_nonces enable row level security;
revoke all on public.negotiation_nonces from public, anon, authenticated;
grant all on public.negotiation_nonces to service_role;
create or replace function public.claim_negotiation_nonce(p_installation_id uuid, p_nonce text, p_expires_at timestamptz)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_nonce is null or length(p_nonce) not between 1 and 240 then
    raise exception 'Invalid nonce';
  end if;
  delete from negotiation_nonces where expires_at < clock_timestamp();
  insert into negotiation_nonces values (p_installation_id, p_nonce,
    greatest(p_expires_at, clock_timestamp() + interval '61 seconds')) on conflict do nothing;
  return found;
end; $$;
revoke all on function public.claim_negotiation_nonce(uuid,text,timestamptz) from public, anon, authenticated;
grant execute on function public.claim_negotiation_nonce(uuid,text,timestamptz) to service_role;
commit;
