"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type Order = {
  order_number: string;
  payment_status: string;
  shipping_status: string;
  tracking_url?: string | null;
  created_at: string;
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getStepStatus(order: Order, step: "paid" | "packed" | "shipped" | "delivered") {
  const paymentStatus = order.payment_status?.toLowerCase();
  const shippingStatus = order.shipping_status?.toLowerCase();

  if (step === "paid") return paymentStatus === "paid" || paymentStatus === "success";

  if (step === "packed") {
    return ["packed", "shipped", "in_transit", "delivered"].includes(shippingStatus);
  }

  if (step === "shipped") {
    return ["shipped", "in_transit", "delivered"].includes(shippingStatus);
  }

  if (step === "delivered") {
    return shippingStatus === "delivered";
  }

  return false;
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();

    setError("");
    setOrder(null);
    setLoading(true);

    try {
      const response = await fetch(
        `/api/orders/track?order=${encodeURIComponent(
          orderNumber.trim()
        )}&phone=${encodeURIComponent(phone.trim())}`
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Order not found");
        return;
      }

      setOrder(data.order);
    } catch {
      setError("Unable to check order status. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="track-hero">
        <div className="container track-hero-grid">
          <div>
            <div className="eyebrow">Track Your Order</div>
            <h1>Your perfume journey, live.</h1>
            <p>
              Enter your order number and phone number to check payment,
              shipping and tracking status for your House of Eon order.
            </p>

            <div className="home-search-tags">
              <span>Payment status</span>
              <span>Shipping update</span>
              <span>Tracking link</span>
              <span>WhatsApp support</span>
            </div>
          </div>

          <div className="track-hero-card">
            <div className="track-mini-bottle">
              <div className="track-mini-cap" />
              <div className="track-mini-label">EON</div>
            </div>
            <b>Order updates</b>
            <span>Simple, secure and easy to check.</span>
          </div>
        </div>
      </section>

      <section className="section track-section">
        <div className="container track-layout">
          <div className="track-form-card">
            <div className="eyebrow">Check Status</div>
            <h2>Find your order</h2>
            <p>
              Use the same phone number you entered during checkout. Your order
              number is shown on the success page and confirmation email.
            </p>

            <form className="track-form" onSubmit={submit}>
              <label>
                <span>Order number</span>
                <input
                  className="input"
                  required
                  placeholder="Example: HOE1001"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                />
              </label>

              <label>
                <span>Phone number</span>
                <input
                  className="input"
                  required
                  placeholder="Enter checkout phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>

              {error ? <div className="notice">{error}</div> : null}

              <button className="btn track-submit-btn" disabled={loading}>
                {loading ? "Checking..." : "Check status"}
              </button>
            </form>
          </div>

          <div className="track-result-area">
            {order ? (
              <div className="track-result-card">
                <div className="track-result-head">
                  <div>
                    <div className="eyebrow">Order Found</div>
                    <h2>{order.order_number}</h2>
                    <p>Placed on {formatDate(order.created_at)}</p>
                  </div>

                  <span className="track-status-badge">
                    {order.shipping_status}
                  </span>
                </div>

                <div className="track-status-grid">
                  <div>
                    <span>Payment</span>
                    <b>{order.payment_status}</b>
                  </div>

                  <div>
                    <span>Shipping</span>
                    <b>{order.shipping_status}</b>
                  </div>
                </div>

                <div className="track-timeline">
                  <div className={getStepStatus(order, "paid") ? "active" : ""}>
                    <span />
                    <div>
                      <b>Payment confirmed</b>
                      <p>Your payment status is updated.</p>
                    </div>
                  </div>

                  <div className={getStepStatus(order, "packed") ? "active" : ""}>
                    <span />
                    <div>
                      <b>Packing</b>
                      <p>Your perfume is being prepared for dispatch.</p>
                    </div>
                  </div>

                  <div className={getStepStatus(order, "shipped") ? "active" : ""}>
                    <span />
                    <div>
                      <b>Shipped</b>
                      <p>Tracking link will be available after dispatch.</p>
                    </div>
                  </div>

                  <div className={getStepStatus(order, "delivered") ? "active" : ""}>
                    <span />
                    <div>
                      <b>Delivered</b>
                      <p>Your House of Eon order has reached you.</p>
                    </div>
                  </div>
                </div>

                {order.tracking_url ? (
                  <a
                    className="btn track-submit-btn"
                    href={order.tracking_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open tracking link
                  </a>
                ) : (
                  <div className="track-note">
                    Tracking link will appear here once your order is dispatched.
                  </div>
                )}
              </div>
            ) : (
              <div className="track-empty-card">
                <div className="eyebrow">Order Status</div>
                <h2>Enter details to reveal your order update.</h2>
                <p>
                  Once your order is found, you will see payment status,
                  shipping status and tracking link if available.
                </p>

                <div className="track-trust-list">
                  <div>
                    <b>Secure payment</b>
                    <span>Verified after Razorpay success</span>
                  </div>
                  <div>
                    <b>Dispatch updates</b>
                    <span>Tracking added after shipment</span>
                  </div>
                  <div>
                    <b>Need help?</b>
                    <span>Contact support on WhatsApp</span>
                  </div>
                </div>

                <Link href="/products" className="btn secondary">
                  Continue shopping
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}