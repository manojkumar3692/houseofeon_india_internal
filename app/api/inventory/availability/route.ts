import { NextResponse } from "next/server";
import { products } from "@/lib/products";
import { getTrialEligibleProducts } from "@/lib/trialPack";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isInventoryEnforcementEnabled } from "@/lib/inventoryServer";

export const dynamic = "force-dynamic";

function fallbackResponse() {
  return [
    ...products.map((product) => ({
      productId: product.id,
      size: "50ml",
      available: true,
      lowStock: false,
      maxQuantity: 20,
      reason: null,
    })),
    ...getTrialEligibleProducts().map((product) => ({
      productId: product.id,
      size: "8ml",
      available: true,
      lowStock: false,
      maxQuantity: 20,
      reason: null,
    })),
  ];
}

export async function GET() {
  const enforced = isInventoryEnforcementEnabled();
  const { data, error } = await getSupabaseAdmin().rpc(
    "get_storefront_inventory_availability"
  );

  if (error) {
    if (enforced) {
      console.error("inventory availability failed:", error.message);
      return NextResponse.json(
        { error: "Inventory availability is temporarily unavailable" },
        { status: 503 }
      );
    }

    return NextResponse.json({ enforced: false, items: fallbackResponse() });
  }

  const items = (data || []).map((row: any) => {
    const availableStock = Math.max(0, Number(row.available_stock || 0));
    const actuallyAvailable = Boolean(row.available);

    return {
      productId: String(row.product_key),
      size: String(row.size).toLowerCase(),
      available: enforced ? actuallyAvailable : true,
      lowStock:
        actuallyAvailable && availableStock <= Number(row.low_stock_threshold || 0),
      maxQuantity: enforced ? Math.min(20, availableStock) : 20,
      reason: actuallyAvailable
        ? null
        : row.storefront_enabled
          ? "out_of_stock"
          : "manually_disabled",
    };
  });

  return NextResponse.json(
    { enforced, items },
    { headers: { "Cache-Control": "no-store" } }
  );
}
