import { getProductById } from "./products";

export type CheckoutItem = { productId: string; quantity: number };

export function calculateOrder(items: CheckoutItem[]) {
  const safeItems = items
    .map((item) => {
      const product = getProductById(item.productId);
      const quantity = Math.max(1, Math.min(20, Number(item.quantity) || 1));
      if (!product) return null;
      return {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        size: product.size,
        price: product.price,
        quantity,
        lineTotal: product.price * quantity,
      };
    })
    .filter(Boolean) as Array<{
    productId: string;
    name: string;
    slug: string;
    size: string;
    price: number;
    quantity: number;
    lineTotal: number;
  }>;

  const total = safeItems.reduce((sum, item) => sum + item.lineTotal, 0);
  return { items: safeItems, total, amountInPaise: total * 100 };
}

export function createOrderNumber() {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `HOE-${stamp}-${random}`;
}
