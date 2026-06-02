export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
  }
}

export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
};

export function trackGAEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window === "undefined") return;
  if (!window.gtag) return;

  window.gtag("event", eventName, params || {});
}

export function trackMetaEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window === "undefined") return;
  if (!window.fbq) return;

  window.fbq("track", eventName, params || {});
}

export function trackViewContent(product: {
  id: string;
  name: string;
  price: number;
}) {
  trackGAEvent("view_item", {
    currency: "INR",
    value: product.price,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity: 1,
      },
    ],
  });

  trackMetaEvent("ViewContent", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    currency: "INR",
    value: product.price,
  });
}

export function trackAddToCart(product: {
  id: string;
  name: string;
  price: number;
  quantity?: number;
}) {
  const quantity = product.quantity || 1;

  trackGAEvent("add_to_cart", {
    currency: "INR",
    value: product.price * quantity,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity,
      },
    ],
  });

  trackMetaEvent("AddToCart", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    currency: "INR",
    value: product.price * quantity,
  });
}

export function trackBeginCheckout({
  value,
  items,
}: {
  value: number;
  items: AnalyticsItem[];
}) {
  trackGAEvent("begin_checkout", {
    currency: "INR",
    value,
    items,
  });

  trackMetaEvent("InitiateCheckout", {
    currency: "INR",
    value,
    content_type: "product",
    contents: items.map((item) => ({
      id: item.item_id,
      quantity: item.quantity || 1,
      item_price: item.price,
    })),
  });
}

export function trackPurchase({
  orderId,
  value,
  items,
}: {
  orderId: string;
  value: number;
  items: AnalyticsItem[];
}) {
  trackGAEvent("purchase", {
    transaction_id: orderId,
    currency: "INR",
    value,
    items,
  });

  trackMetaEvent("Purchase", {
    currency: "INR",
    value,
    content_type: "product",
    contents: items.map((item) => ({
      id: item.item_id,
      quantity: item.quantity || 1,
      item_price: item.price,
    })),
  });
}

export function trackPaymentFailed(reason?: string) {
  trackGAEvent("payment_failed", {
    reason: reason || "unknown",
  });

  trackMetaEvent("CustomEvent", {
    event_name: "PaymentFailed",
    reason: reason || "unknown",
  });
}