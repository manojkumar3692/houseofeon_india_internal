import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isInventoryEnforcementEnabled } from "@/lib/inventoryServer";
import { products } from "@/lib/products";

// Null means unknown: omit schema availability and fail the feed fetch so a
// temporary inventory outage cannot publish a false in-stock assertion.
export async function getCatalogAvailability(): Promise<Record<string, boolean> | null> {
  if (!isInventoryEnforcementEnabled()) {
    return Object.fromEntries(products.map((product) => [product.id, true]));
  }
  try {
    const { data, error } = await getSupabaseAdmin().rpc("get_storefront_inventory_availability");
    if (error || !Array.isArray(data)) return null;
    const result: Record<string, boolean> = {};
    for (const row of data) {
      if (String(row.size).toLowerCase() === "50ml" && typeof row.available === "boolean") {
        result[String(row.product_key)] = row.available;
      }
    }
    return result;
  } catch {
    return null;
  }
}
