import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { products } from '@/lib/products';

export function unavailable(): never {
  throw Object.assign(new Error('Unavailable'), { code: 'UNSUPPORTED' });
}

export async function listCatalog({ cursor, limit }: { cursor: string | null; limit: number }) {
  const catalog = products.filter(p => p.size.toLowerCase() === '50ml');
  const offset = cursor === null ? 0 : Number(cursor);
  if ((cursor !== null && !/^[1-9]\d*$/.test(cursor)) || !Number.isSafeInteger(offset) ||
      offset < 0 || offset >= Math.max(catalog.length, 1) || !Number.isInteger(limit) || limit < 1 || limit > 100) unavailable();
  // This is a read of the shared stock source, independent of the storefront's
  // enforcement flag. Never return optimistic stock or create a reservation.
  const { data, error } = await getSupabaseAdmin().rpc('get_storefront_inventory_availability');
  if (error || !Array.isArray(data)) throw new Error('Inventory source unavailable');
  const asOf = new Date().toISOString();
  const items = catalog.slice(offset, offset + limit).map(p => {
    const rows = data.filter(r => r.product_key === p.id && String(r.size).toLowerCase() === '50ml');
    if (rows.length !== 1) throw new Error('Inventory mapping unavailable');
    const row = rows[0];
    if (!Number.isSafeInteger(row.available_stock) || row.available_stock < 0 ||
        typeof row.available !== 'boolean' || typeof row.storefront_enabled !== 'boolean' ||
        !Number.isSafeInteger(p.price * 100) || p.price <= 0) throw new Error('Invalid catalog facts');
    return { productId: p.id, variantId: `${p.id}:50ml`, sku: `${p.id}:50ml`, name: p.name,
      currency: 'INR', priceMinor: p.price * 100,
      availableToSell: row.available && row.storefront_enabled ? row.available_stock : 0,
      fulfillmentType: 'physical', updatedAt: asOf };
  });
  const next = offset + items.length;
  return { items, nextCursor: next < catalog.length ? String(next) : null };
}
