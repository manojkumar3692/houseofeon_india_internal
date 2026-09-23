import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getProductById } from '@/lib/products';
import { PILOT_PRODUCT } from './facts';

export async function pilotPricing() {
  const { data, error } = await getSupabaseAdmin().from('store_product_pricing')
    .select('regular_minor,selling_minor,currency,tax_basis').eq('product_id', PILOT_PRODUCT).single();
  const product = getProductById(PILOT_PRODUCT);
  if (error || !data || !product || !Number.isSafeInteger(data.regular_minor) || !Number.isSafeInteger(data.selling_minor) ||
      data.selling_minor <= 0 || data.regular_minor < data.selling_minor || data.currency !== 'INR' || data.tax_basis !== 'inclusive' ||
      data.selling_minor !== product.price * 100 || data.regular_minor !== (product.mrp ?? product.price) * 100) {
    throw Error('Database pricing missing or differs from storefront; synchronize approved pricing before launch');
  }
  return { regularMinor: data.regular_minor as number, sellingMinor: data.selling_minor as number,
    taxBasis: data.tax_basis, source: 'store_product_pricing; verified against storefront product.price' };
}
