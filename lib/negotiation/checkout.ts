import 'server-only';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { cartFacts, pilotCart } from './facts';
import { availableStock } from './readOnly';
import { assertCheckoutEnabled, checkoutEnabled, checkoutToken, identity } from './security';
import type { Cart, Quote } from './types';
import { pilotPricing } from './pricing';

export const customerSchema = z.object({
  name: z.string().trim().min(2).max(100), phone: z.string().regex(/^\+?[0-9]{10,13}$/),
  email: z.string().email().max(200), address: z.string().trim().min(8).max(500),
  city: z.string().trim().min(2).max(100), state: z.string().trim().min(2).max(100),
  pincode: z.string().regex(/^[1-9]\d{5}$/),
}).strict();
export type Customer = z.infer<typeof customerSchema>;
export type Checkout = {
  id: string; installation_id: string; idempotency_key: string; quote: Quote; items: Record<string, unknown>[];
  expires_at: string; state: 'pending' | 'paid' | 'cancelled' | 'refunded';
  provider_state: 'unstarted' | 'creating' | 'ready'; provider_link_id: string | null;
  provider_url: string | null; order_id: string | null; payment_id: string | null;
};

export async function rpc(name: string, args: Record<string, unknown>) {
  const { data, error } = await getSupabaseAdmin().rpc(name, args);
  if (error) throw Error(`Negotiation transaction unavailable: ${name}`);
  return data;
}

export async function checkoutRecord(id: string): Promise<Checkout> {
  const { data, error } = await getSupabaseAdmin().from('negotiation_checkouts').select('*')
    .eq('id', id).eq('installation_id', identity().installationId).single();
  if (error || !data) throw Error('Checkout unavailable');
  return data as Checkout;
}

export async function getContext(cart: Cart) {
  pilotCart(cart);
  await pilotPricing(cart.lines[0].productId);
  return cartFacts(cart, await availableStock(cart.lines[0].productId), checkoutEnabled());
}

export async function createCheckout(quote: Quote, idempotencyKey: string) {
  assertCheckoutEnabled();
  const { product, quantity } = pilotCart(quote.cart);
  if (quantity !== 1 || quote.currency !== 'INR' || quote.cart.paymentMethod !== 'prepaid' ||
      quote.shippingMinor !== 0 || !Number.isSafeInteger(quote.amountMinor) || quote.amountMinor < 100 ||
      Date.parse(quote.expiresAt) <= Date.now() || Date.parse(quote.expiresAt) > Date.now() + 3540000) throw Error('Unsupported or expired quote');
  const { installationId } = identity();
  const db = getSupabaseAdmin();
  const { data: existing, error } = await db.from('negotiation_checkouts').select('id')
    .eq('installation_id', installationId).eq('id', quote.id).maybeSingle();
  if (error) throw Error('Checkout storage unavailable');
  // A retry uses its stored snapshot. Its own reservation already reduced stock.
  if (!existing) {
    const context = await getContext(quote.cart);
    if (!context.checkoutSupported || context.revision !== quote.contextRevision ||
        quote.amountMinor > context.line.unitPriceMinor * quantity ||
        (context.promotions.evaluation && quote.amountMinor > context.promotions.evaluation.itemSubtotalMinor)) throw Error('Context changed');
  }
  const items = [{ productId: product.id, name: product.name, slug: product.slug, size: product.size,
    quantity, price: quote.amountMinor / quantity / 100, lineTotal: quote.amountMinor / 100 }];
  const result = await rpc('create_negotiation_checkout', {
    p_installation: installationId, p_key: idempotencyKey, p_quote: quote, p_items: items,
  });
  return { status: result.status, externalId: result.id,
    checkoutUrl: `https://www.houseofeon.in/checkout/negotiated/${result.id}#${checkoutToken(result.id)}` };
}
