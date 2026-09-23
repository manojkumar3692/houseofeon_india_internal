-- Apply to the STORE Supabase database before deploying the matching store code.
-- Owner approved: all six 50ml perfumes 1249 original /999 selling;
-- EON20 is optional manual entry (discount200 =>799). No trial/bundle changes.
-- Requires migration-negotiation-checkout.sql; does not change credentials,
-- inventory, existing orders, quotes, costs or negotiation activation.
begin;
insert into public.store_product_pricing
  (product_id,regular_minor,selling_minor,currency,tax_basis)
values
  ('arctic-wave',124900,99900,'INR','inclusive'),
  ('desert-tonka',124900,99900,'INR','inclusive'),
  ('zyrox',124900,99900,'INR','inclusive'),
  ('rank',124900,99900,'INR','inclusive'),
  ('syra',124900,99900,'INR','inclusive'),
  ('silent-gold',124900,99900,'INR','inclusive')
on conflict(product_id) do update set
  regular_minor=excluded.regular_minor,selling_minor=excluded.selling_minor,
  currency=excluded.currency,tax_basis=excluded.tax_basis,updated_at=now();
commit;
