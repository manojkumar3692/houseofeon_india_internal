import { formatINR } from "@/lib/money";

type OrderEmailItem = {
  name?: string;
  product_name?: string;
  quantity?: number;
  qty?: number;
  priceInPaise?: number;
  price_in_paise?: number;
  price?: number;
};

type OrderEmailInput = {
  orderId?: string;
  order_id?: string;
  orderNumber?: string;
  order_number?: string;

  customerName?: string;
  customer_name?: string;

  customerPhone?: string;
  customer_phone?: string;
  phone?: string;

  customerEmail?: string | null;
  customer_email?: string | null;
  email?: string | null;

  address?: string;
  customerAddress?: string;
  customer_address?: string;

  amountInPaise?: number;
  amount_in_paise?: number;
  amount?: number;

  razorpayOrderId?: string | null;
  razorpay_order_id?: string | null;

  razorpayPaymentId?: string | null;
  razorpay_payment_id?: string | null;

  items?: OrderEmailItem[];
};

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "House of Eon <orders@example.com>";
const OFFICE_EMAIL = process.env.OFFICE_EMAIL;

function safeString(value: unknown, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function escapeHtml(value: unknown) {
  return safeString(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatAddressForEmail(address: unknown) {
  return escapeHtml(address).replace(/\r?\n/g, "<br/>");
}

function normalizeOrder(order: OrderEmailInput) {
  const orderId =
    order.orderId ||
    order.order_id ||
    order.orderNumber ||
    order.order_number ||
    "UNKNOWN_ORDER";

  const customerName =
    order.customerName ||
    order.customer_name ||
    "Customer";

  const customerPhone =
    order.customerPhone ||
    order.customer_phone ||
    order.phone ||
    "Not provided";

  const customerEmail =
    order.customerEmail ||
    order.customer_email ||
    order.email ||
    null;

  const address =
    order.address ||
    order.customerAddress ||
    order.customer_address ||
    "Not provided";

  const amountInPaise =
    order.amountInPaise ??
    order.amount_in_paise ??
    order.amount ??
    0;

  const razorpayOrderId =
    order.razorpayOrderId ||
    order.razorpay_order_id ||
    "";

  const razorpayPaymentId =
    order.razorpayPaymentId ||
    order.razorpay_payment_id ||
    "";

  const items = Array.isArray(order.items) ? order.items : [];

  return {
    orderId,
    customerName,
    customerPhone,
    customerEmail,
    address,
    amountInPaise,
    razorpayOrderId,
    razorpayPaymentId,
    items,
  };
}

function itemName(item: OrderEmailItem) {
  return item.name || item.product_name || "Product";
}

function itemQuantity(item: OrderEmailItem) {
  return item.quantity || item.qty || 1;
}

function itemPriceInPaise(item: OrderEmailItem) {
  return item.priceInPaise ?? item.price_in_paise ?? item.price ?? 0;
}

function itemsHtml(items: OrderEmailItem[]) {
  if (!items.length) {
    return `
      <tr>
        <td colspan="3" style="padding:8px;border:1px solid #eee;">No items found</td>
      </tr>
    `;
  }

  return items
    .map((item) => {
      return `
        <tr>
          <td style="padding:8px;border:1px solid #eee;">${escapeHtml(itemName(item))}</td>
          <td style="padding:8px;border:1px solid #eee;text-align:center;">${itemQuantity(item)}</td>
          <td style="padding:8px;border:1px solid #eee;text-align:right;">${formatINR(
            itemPriceInPaise(item) / 100
          )}</td>
        </tr>
      `;
    })
    .join("");
}

function customerEmailHtml(rawOrder: OrderEmailInput) {
  const order = normalizeOrder(rawOrder);

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;">
      <h2>Thank you for your order</h2>
      <p>Hi ${escapeHtml(order.customerName)},</p>
      <p>Your House of Eon order has been confirmed.</p>

      <h3>Order Details</h3>
      <p><b>Order ID:</b> ${escapeHtml(order.orderId)}</p>
      <p><b>Payment Status:</b> Paid</p>
      <p><b>Amount:</b> ${formatINR(order.amountInPaise / 100)}</p>

      <table style="border-collapse:collapse;width:100%;max-width:600px;">
        <thead>
          <tr>
            <th style="padding:8px;border:1px solid #eee;text-align:left;">Product</th>
            <th style="padding:8px;border:1px solid #eee;text-align:center;">Qty</th>
            <th style="padding:8px;border:1px solid #eee;text-align:right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml(order.items)}
        </tbody>
      </table>

      <h3>Delivery Address</h3>
      <p>${formatAddressForEmail(order.address)}</p>

      <p>We will share shipping/tracking details once your order is dispatched.</p>
      <p>For support, you can contact us on WhatsApp.</p>

      <p>Regards,<br/>House of Eon</p>
    </div>
  `;
}

function officeEmailHtml(rawOrder: OrderEmailInput) {
  const order = normalizeOrder(rawOrder);

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;">
      <h2>New Paid Order Received</h2>

      <p><b>Order ID:</b> ${escapeHtml(order.orderId)}</p>
      <p><b>Name:</b> ${escapeHtml(order.customerName)}</p>
      <p><b>Phone:</b> ${escapeHtml(order.customerPhone)}</p>
      <p><b>Email:</b> ${
        order.customerEmail ? escapeHtml(order.customerEmail) : "Not provided"
      }</p>
      <p><b>Address:</b><br/>${formatAddressForEmail(order.address)}</p>
      <p><b>Amount:</b> ${formatINR(order.amountInPaise / 100)}</p>
      <p><b>Razorpay Order ID:</b> ${escapeHtml(order.razorpayOrderId)}</p>
      <p><b>Razorpay Payment ID:</b> ${escapeHtml(order.razorpayPaymentId)}</p>

      <h3>Items</h3>
      <table style="border-collapse:collapse;width:100%;max-width:600px;">
        <thead>
          <tr>
            <th style="padding:8px;border:1px solid #eee;text-align:left;">Product</th>
            <th style="padding:8px;border:1px solid #eee;text-align:center;">Qty</th>
            <th style="padding:8px;border:1px solid #eee;text-align:right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml(order.items)}
        </tbody>
      </table>
    </div>
  `;
}

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY missing. Skipping email:", subject);
    return { skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("Email sending failed:", data);
    throw new Error("Email sending failed");
  }

  return data;
}

export async function sendOrderEmails(rawOrder: OrderEmailInput) {
  try {
    const order = normalizeOrder(rawOrder);

    const tasks: Promise<unknown>[] = [];

    if (order.customerEmail) {
      tasks.push(
        sendEmail({
          to: order.customerEmail,
          subject: `Order confirmed - ${order.orderId}`,
          html: customerEmailHtml(rawOrder),
        })
      );
    }

    if (OFFICE_EMAIL) {
      tasks.push(
        sendEmail({
          to: OFFICE_EMAIL,
          subject: `New paid order - ${order.orderId}`,
          html: officeEmailHtml(rawOrder),
        })
      );
    }

    const results = await Promise.allSettled(tasks);

    results.forEach((result) => {
      if (result.status === "rejected") {
        console.error("Order email task failed:", result.reason);
      }
    });

    return results;
  } catch (error) {
    console.error("sendOrderEmails failed, but order/payment should continue:", error);
    return [];
  }
}