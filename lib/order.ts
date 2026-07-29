import { getProductById } from "./products";
import { getUnitPrice, getLineTotal, isBundleQuantity } from "./pricing";

export type CheckoutItem = { productId: string; quantity: number };

export function calculateOrder(items: CheckoutItem[]) {
  const normalizedItems = items.map((item) => ({
    productId: item.productId,
    quantity: Math.max(1, Math.min(20, Number(item.quantity) || 1)),
  }));

  // Bundle pricing (2+ perfumes total, any mix of products) is decided
  // across the whole cart, not per line — so the total has to be known
  // before pricing any individual item.
  const totalCartQuantity = normalizedItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const safeItems = normalizedItems
    .map((item) => {
      const product = getProductById(item.productId);
      if (!product) return null;

      // Bundle pricing takes over the per-unit price here so every
      // downstream consumer of an order (Razorpay amount, DB record,
      // emails, admin) sees the price that was actually charged, not the
      // raw catalog price.
      const unitPrice = getUnitPrice(product.price, totalCartQuantity);

      return {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        size: product.size,
        price: unitPrice,
        quantity: item.quantity,
        lineTotal: getLineTotal(product.price, item.quantity, totalCartQuantity),
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
  const hasBundleLine = isBundleQuantity(totalCartQuantity);

  return { items: safeItems, total, amountInPaise: total * 100, hasBundleLine };
}

export function createOrderNumber() {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `HOE-${stamp}-${random}`;
}
