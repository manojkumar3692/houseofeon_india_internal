import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export type InventoryOrderItem = Record<string, unknown>;

export function isInventoryEnforcementEnabled() {
  return process.env.INVENTORY_ENFORCEMENT_ENABLED === "true";
}

export async function reserveInventory(
  reservationKey: string,
  items: InventoryOrderItem[]
) {
  if (!isInventoryEnforcementEnabled()) return false;

  const { error } = await getSupabaseAdmin().rpc("reserve_storefront_inventory", {
    p_reservation_key: reservationKey,
    p_items: items,
    p_ttl_seconds: 15 * 60,
  });

  if (error) throw new Error(error.message);
  return true;
}

export async function releaseInventoryReservation(reservationKey: string) {
  if (!reservationKey || !isInventoryEnforcementEnabled()) return;

  const { error } = await getSupabaseAdmin().rpc(
    "release_storefront_inventory_reservation",
    { p_reservation_key: reservationKey, p_status: "released" }
  );

  if (error) {
    console.error("inventory reservation release failed:", error.message);
  }
}
