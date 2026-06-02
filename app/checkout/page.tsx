"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCart } from "@/components/CartContext";
import { formatINR } from "@/lib/money";
import {
  trackBeginCheckout,
  trackPaymentFailed,
  trackPurchase,
} from "@/lib/analytics";

type CustomerForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
};



export default function CheckoutPage() {
  const router = useRouter();
  const { lines, total, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const beginCheckoutTrackedRef = useRef(false);

  const [form, setForm] = useState<CustomerForm>({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    notes: "",
  });

  function update<K extends keyof CustomerForm>(key: K, value: CustomerForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const analyticsItems = useMemo(() => {
    return lines.map((item: any) => ({
      item_id: String(item.id),
      item_name: String(item.name || item.product_name || item.id),
      price: Number(item.price || 0),
      quantity: Number(item.quantity || item.qty || 1),
    }));
  }, [lines]);

  useEffect(() => {
    if (!lines.length) return;
    if (beginCheckoutTrackedRef.current) return;

    beginCheckoutTrackedRef.current = true;

    trackBeginCheckout({
      value: total,
      items: analyticsItems,
    });
  }, [lines.length, total, analyticsItems]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!lines.length) {
      setError("Cart is empty.");
      return;
    }

    const RazorpayConstructor = window.Razorpay;

    if (!RazorpayConstructor) {
      setError("Payment system is still loading. Please try again.");
      return;
    }

    setLoading(true);

    try {
      const createResponse = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: form, items: lines }),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        trackPaymentFailed(createData.error || "Could not create order");
        throw new Error(createData.error || "Could not create order");
      }

      const razorpay = new RazorpayConstructor({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: createData.amount,
        currency: "INR",
        name: process.env.NEXT_PUBLIC_BRAND_NAME || "House of Eon",
        description: `Order ${createData.orderNumber}`,
        order_id: createData.razorpayOrderId,
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        notes: {
          orderNumber: createData.orderNumber,
        },
        theme: {
          color: "#1f1711",
        },
        handler: async (response: any) => {
          try {
            const verifyResponse = await fetch("/api/orders/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
              trackPaymentFailed(
                verifyData.error || "Payment verification failed"
              );
              throw new Error(
                verifyData.error || "Payment verification failed"
              );
            }

            trackPurchase({
              orderId: verifyData.orderNumber,
              value: total,
              items: analyticsItems,
            });

            clearCart();
            router.push(`/success?order=${verifyData.orderNumber}`);
          } catch (err) {
            const message =
              err instanceof Error
                ? err.message
                : "Payment verification failed";

            trackPaymentFailed(message);
            setError(message);
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            trackPaymentFailed("customer_closed_razorpay_modal");
            setLoading(false);
          },
        },
      });

      razorpay.open();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";

      trackPaymentFailed(message);
      setError(message);
      setLoading(false);
    }
  }

  return (
    <section className="section">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <div className="container">
        <h1 className="section-title">Checkout</h1>

        <div className="hero-grid" style={{ alignItems: "start" }}>
          <form className="card form" onSubmit={submit}>
            <div className="two">
              <input
                className="input"
                required
                placeholder="Full name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />

              <input
                className="input"
                required
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>

            <input
              className="input"
              type="email"
              placeholder="Email optional"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />

            <textarea
              className="textarea"
              required
              placeholder="Full address"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
            />

            <div className="two">
              <input
                className="input"
                required
                placeholder="City"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
              />

              <input
                className="input"
                required
                placeholder="State"
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
              />
            </div>

            <input
              className="input"
              required
              placeholder="Pincode"
              value={form.pincode}
              onChange={(e) => update("pincode", e.target.value)}
            />

            <textarea
              className="textarea"
              placeholder="Notes optional"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />

            {error ? <div className="notice">{error}</div> : null}

            <button className="btn" disabled={loading} type="submit">
              {loading ? "Opening payment..." : `Pay ${formatINR(total)}`}
            </button>
          </form>

          <div className="card">
            <h2>Payment summary</h2>

            <p className="cart-row">
              <span>Total</span>
              <b>{formatINR(total)}</b>
            </p>

            <p className="muted">
              After successful Razorpay payment, your order will be saved and
              emailed to office.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}