-- Match the launched RIVA catalogue price in the store pricing table.
-- Requires migration-negotiation-checkout.sql. Does not seed inventory counts.
begin;
insert into public.store_product_pricing
  (product_id,regular_minor,selling_minor,currency,tax_basis)
values ('riva',124900,99900,'INR','inclusive')
on conflict(product_id) do update set
  regular_minor=excluded.regular_minor,selling_minor=excluded.selling_minor,
  currency=excluded.currency,tax_basis=excluded.tax_basis,updated_at=now();
commit;
