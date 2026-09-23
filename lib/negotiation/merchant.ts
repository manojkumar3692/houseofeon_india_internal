import 'server-only';
import { createHash } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { products } from '@/lib/products';
import { getUnitPrice } from '@/lib/pricing';
import type { Cart } from './types';

export function unavailable(): never { throw Object.assign(new Error('Unavailable'), { code: 'UNSUPPORTED' }); }
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const minor = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

export function stagingProduct() {
  const product = products.find(p => p.id === process.env.NEGOTIATION_STAGING_PRODUCT_ID);
  if (!product || product.size.toLowerCase() !== '50ml') unavailable();
  return product;
}

async function stock(productId: string) {
  // Never use the storefront's optimistic inventory fallback.
  if (process.env.INVENTORY_ENFORCEMENT_ENABLED !== 'true') unavailable();
  const { data, error } = await getSupabaseAdmin().rpc('get_storefront_inventory_availability');
  if (error || !Array.isArray(data)) unavailable();
  const rows = data.filter(r => r.product_key === productId && String(r.size).toLowerCase() === '50ml');
  if (rows.length !== 1 || !minor(rows[0].available_stock) || typeof rows[0].available !== 'boolean' ||
      typeof rows[0].storefront_enabled !== 'boolean') unavailable();
  return rows[0].available === true && rows[0].storefront_enabled === true ? rows[0].available_stock : 0;
}

export async function listCatalog({ cursor, limit }: { cursor: string | null; limit: number }) {
  if (cursor !== null || limit < 1) unavailable();
  const p = stagingProduct();
  return { items: [{ productId: p.id, variantId: `${p.id}:50ml`, sku: `${p.id}:50ml`, name: p.name,
    currency: 'INR', priceMinor: p.price * 100, availableToSell: await stock(p.id),
    fulfillmentType: 'physical', updatedAt: new Date().toISOString() }], nextCursor: null };
}

export async function getContext(cart: Cart) {
  const p = stagingProduct(), line = cart.lines[0];
  if (line.productId !== p.id || line.variantId !== `${p.id}:50ml` || cart.currency !== 'INR' ||
      cart.promotionCodes.length || cart.paymentMethod !== 'prepaid' ||
      cart.destination?.country !== 'IN' || !/^\d{6}$/.test(cart.destination.postalCode)) unavailable();
  const db = getSupabaseAdmin();
  const [inventory, policyResult, shippingResult] = await Promise.all([
    stock(p.id),
    db.from('negotiation_product_policy').select('*').eq('product_id', p.id).eq('enabled', true).single(),
    db.from('negotiation_shipping_rates').select('*').eq('postal_code', cart.destination.postalCode)
      .eq('quantity', line.quantity).eq('serviceable', true).single(),
  ]);
  const policy = policyResult.data, shipping = shippingResult.data;
  const now = Date.now(), price = getUnitPrice(p.price, line.quantity) * 100;
  if (policyResult.error || shippingResult.error || !policy || !shipping || inventory < line.quantity ||
      !minor(policy.floor_minor) || policy.floor_minor > price || policy.tax_basis !== 'inclusive' ||
      !minor(policy.prepaid_fee_minor) || !minor(shipping.merchant_cost_minor) || !minor(shipping.customer_charge_minor) ||
      !Number.isFinite(Date.parse(policy.valid_until)) || Date.parse(policy.valid_until) <= now ||
      !Number.isFinite(Date.parse(shipping.valid_until)) || Date.parse(shipping.valid_until) <= now ||
      !process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_') || !process.env.RAZORPAY_KEY_SECRET) unavailable();
  const result = {
    currency: 'INR', taxBasis: 'inclusive',
    line: { productId: p.id, variantId: `${p.id}:50ml`, name: p.name, quantity: line.quantity,
      unitPriceMinor: price, availableToSell: inventory, approvedFloorMinor: policy.floor_minor, fulfillmentType: 'physical' },
    shipping: { mode: 'zone_table', serviceable: true, merchantCostMinor: shipping.merchant_cost_minor,
      customerChargeMinor: shipping.customer_charge_minor, rateId: shipping.id },
    // Existing orders cannot prove the required refund/promotion exclusions.
    sales: null, promotions: { codes: [], stackable: false },
    payment: { method: 'prepaid', supported: true, feeMinor: policy.prepaid_fee_minor },
    checkoutSupported: false,
  };
  return { ...result, revision: digest({ cart, result, policy, shipping }),
    expiresAt: new Date(Math.min(now + 60000, Date.parse(policy.valid_until), Date.parse(shipping.valid_until))).toISOString() };
}

export async function reconcile(externalId: string) {
  const { data, error } = await getSupabaseAdmin().from('orders')
    .select('negotiation_external_id,payment_status,payment_captured_at')
    .eq('negotiation_installation_id', process.env.NEGOTIATION_INSTALLATION_ID!)
    .eq('negotiation_external_id', externalId).single();
  if (error || !data) unavailable();
  const status = data.payment_status;
  if (!['pending', 'paid', 'cancelled', 'refunded'].includes(status) ||
      (status === 'paid' && !data.payment_captured_at)) unavailable();
  return { externalId, status };
}
