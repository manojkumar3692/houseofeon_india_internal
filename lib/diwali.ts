import { getProductById } from "./products";
import { calculateOrder } from "./order";

// A single campaign window, never a rolling or annually recurring countdown.
export const DIWALI_START = Date.parse("2026-11-02T00:00:00+05:30");
export const DIWALI_END = Date.parse("2026-11-15T00:00:00+05:30");
export const DIWALI_PRICE = 699;
export function isDiwaliActive(now = Date.now()) {
  return now >= DIWALI_START && now < DIWALI_END;
}
export function diwaliDiscount(items: { productId: string; quantity: number }[] | undefined, now = Date.now()) {
  if (!isDiwaliActive(now)) return { valid: false, error: "The DIWALI offer has ended. Regular pricing now applies.", discount: 0, coupon: null };
  if (!items?.length || items.some(item => !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20 || getProductById(item.productId)?.size.toLowerCase() !== "50ml")) {
    return { valid: false, error: "DIWALI is valid only on 50ML perfumes. Trial packs and trial credit are excluded.", discount: 0, coupon: null };
  }
  const order = calculateOrder(items);
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  return { valid: true, error: "", discount: Math.max(0, order.total - DIWALI_PRICE * quantity), coupon: { code: "DIWALI", label: "Diwali · ₹699 per 50ML bottle, shipping included", type: "flat" as const, value: 0, active: true } };
}
