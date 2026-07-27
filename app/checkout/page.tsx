"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCart } from "@/components/CartContext";
import { getProductById } from "@/lib/products";
import { formatINR } from "@/lib/money";
import {
  trackBeginCheckout,
  trackPaymentFailed,
  trackPurchase,
} from "@/lib/analytics";
import {
  trackCheckoutStartedClarity,
  trackPaymentSuccessClarity,
} from "@/lib/clarity";
import { COD_TOKEN_AMOUNT_INR, isPartialCodEligible } from "@/lib/codToken";

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

  const {
    lines,
    loaded,
    total,
    couponCode,
    couponDiscount,
    finalTotal,
    applyCoupon,
    clearCart,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [paymentType, setPaymentType] = useState<"full" | "partial_cod">(
    "full"
  );

  const codEligible = isPartialCodEligible(Math.round(finalTotal * 100));
  const effectivePaymentType =
    paymentType === "partial_cod" && codEligible ? "partial_cod" : "full";
  const amountDueNow =
    effectivePaymentType === "partial_cod" ? COD_TOKEN_AMOUNT_INR : finalTotal;
  const balanceDueNow =
    effectivePaymentType === "partial_cod"
      ? Math.max(0, finalTotal - COD_TOKEN_AMOUNT_INR)
      : 0;

  const beginCheckoutTrackedRef = useRef(false);
  const defaultCouponAppliedRef = useRef(false);

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

  const totalItems = lines.reduce((sum, line) => sum + line.quantity, 0);

  const analyticsItems = useMemo(() => {
    return lines
      .map((line) => {
        const product = getProductById(line.productId);

        if (!product) return null;

        return {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity: line.quantity,
        };
      })
      .filter(Boolean) as {
      item_id: string;
      item_name: string;
      price: number;
      quantity: number;
    }[];
  }, [lines]);

  useEffect(() => {
    if (!lines.length) return;
    if (beginCheckoutTrackedRef.current) return;

    beginCheckoutTrackedRef.current = true;

    trackBeginCheckout({
      value: finalTotal,
      items: analyticsItems,
    });
    trackCheckoutStartedClarity();
  }, [lines.length, finalTotal, analyticsItems]);

  useEffect(() => {
    if (!loaded || !lines.length || couponCode) return;
    if (defaultCouponAppliedRef.current) return;

    defaultCouponAppliedRef.current = true;
    void applyCoupon("EON20");
  }, [loaded, lines.length, couponCode, applyCoupon]);

  // Fallback in case the Razorpay script tag was already injected by a
  // previous mount (Next.js Script dedupes tags, so onLoad may not refire).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.Razorpay) {
      setRazorpayReady(true);
      return;
    }

    const interval = setInterval(() => {
      if (window.Razorpay) {
        setRazorpayReady(true);
        clearInterval(interval);
      }
    }, 250);

    return () => clearInterval(interval);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!lines.length) {
      setError("Cart is empty.");
      return;
    }

    if (finalTotal <= 0) {
      setError("Invalid order total.");
      return;
    }

    const RazorpayConstructor = window.Razorpay;

    if (!RazorpayConstructor || !razorpayReady) {
      setError(
        "Payment system is still loading — give it a moment and tap Pay again."
      );
      return;
    }

    setLoading(true);

    try {
      const createResponse = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: form,
          items: lines,
          couponCode: couponCode || "",
          paymentType: effectivePaymentType,
        }),
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
          couponCode: couponCode || "",
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
              value: Number(createData.finalTotal ?? finalTotal),
              items: analyticsItems,
            });
            trackPaymentSuccessClarity();
            clearCart();

            const balanceQuery =
              verifyData.paymentType === "partial_cod" &&
              verifyData.balanceDueInPaise > 0
                ? `&balanceDue=${verifyData.balanceDueInPaise}`
                : "";

            router.push(
              `/success?order=${verifyData.orderNumber}${balanceQuery}`
            );
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
            setError(
              "Payment window closed before completing. Your order has been saved — tap Pay to try again."
            );
            setLoading(false);
          },
        },
      });

      razorpay.on("payment.failed", (response) => {
        const description =
          response?.error?.description ||
          response?.error?.reason ||
          "Payment failed. Please try again or use a different payment method.";

        trackPaymentFailed(description);
        setError(description);
        setLoading(false);
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
                autoComplete="name"
                placeholder="Full name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />

              <input
                className="input"
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>

            <input
              className="input"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              placeholder="Email (for order confirmation)"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />

            <textarea
              className="textarea"
              required
              autoComplete="street-address"
              placeholder="Full address"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
            />

            <div className="two">
              <input
                className="input"
                required
                autoComplete="address-level2"
                placeholder="City"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
              />

              <input
                className="input"
                required
                autoComplete="address-level1"
                placeholder="State"
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
              />
            </div>

            <input
              className="input"
              required
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="postal-code"
              maxLength={6}
              placeholder="Pincode"
              value={form.pincode}
              onChange={(e) =>
                update("pincode", e.target.value.replace(/[^0-9]/g, ""))
              }
            />

            <textarea
              className="textarea"
              placeholder="Notes optional"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />

            {codEligible ? (
              <div className="payment-method-picker">
                <span className="payment-method-label">
                  How would you like to pay?
                </span>

                <div className="payment-method-options">
                  <button
                    type="button"
                    className={`payment-method-option${
                      effectivePaymentType === "full" ? " active" : ""
                    }`}
                    onClick={() => setPaymentType("full")}
                  >
                    <b>Pay full amount online</b>
                    <span>{formatINR(finalTotal)} via UPI, card or netbanking</span>
                  </button>

                  <button
                    type="button"
                    className={`payment-method-option${
                      effectivePaymentType === "partial_cod" ? " active" : ""
                    }`}
                    onClick={() => setPaymentType("partial_cod")}
                  >
                    <b>Pay {formatINR(COD_TOKEN_AMOUNT_INR)} now, rest on delivery</b>
                    <span>
                      Balance {formatINR(finalTotal - COD_TOKEN_AMOUNT_INR)} in
                      cash when your order arrives
                    </span>
                  </button>
                </div>
              </div>
            ) : null}

            {error ? <div className="notice">{error}</div> : null}

            <button
              className="btn"
              disabled={loading || !razorpayReady}
              type="submit"
            >
              {loading
                ? "Opening payment..."
                : !razorpayReady
                ? "Loading payment..."
                : effectivePaymentType === "partial_cod"
                ? `Pay ${formatINR(amountDueNow)} now`
                : `Pay ${formatINR(finalTotal)}`}
            </button>
          </form>

          <div className="card checkout-summary-card">
            <div className="eyebrow">Payment Summary</div>
            <h2>Secure checkout</h2>

            <div className="summary-lines">
              <div>
                <span>Items</span>
                <b>{totalItems}</b>
              </div>

              <div>
                <span>Subtotal</span>
                <b>{formatINR(total)}</b>
              </div>

              {couponDiscount > 0 ? (
                <div>
                  <span>Coupon discount</span>
                  <b>-{formatINR(couponDiscount)}</b>
                </div>
              ) : null}

              {couponCode ? (
                <div>
                  <span>Coupon code</span>
                  <b>{couponCode}</b>
                </div>
              ) : null}

              <div>
                <span>Estimated delivery</span>
                <b>2–3 working days</b>
              </div>
            </div>

            {effectivePaymentType === "partial_cod" ? (
              <>
                <div className="summary-lines">
                  <div>
                    <span>Order total</span>
                    <b>{formatINR(finalTotal)}</b>
                  </div>
                  <div>
                    <span>Balance on delivery (cash)</span>
                    <b>{formatINR(balanceDueNow)}</b>
                  </div>
                </div>

                <div className="summary-total">
                  <span>Pay now online</span>
                  <strong>{formatINR(amountDueNow)}</strong>
                </div>
              </>
            ) : (
              <div className="summary-total">
                <span>Total payable</span>
                <strong>{formatINR(finalTotal)}</strong>
              </div>
            )}

            {couponDiscount > 0 ? (
              <div className="cart-savings-note">
                You saved {formatINR(couponDiscount)} with {couponCode}.
              </div>
            ) : null}

            <p className="muted">
              {effectivePaymentType === "partial_cod"
                ? `After your ${formatINR(
                    amountDueNow
                  )} token payment, your order will be saved and emailed to office. Pay the remaining ${formatINR(
                    balanceDueNow
                  )} in cash to the delivery agent.`
                : "After successful Razorpay payment, your order will be saved and emailed to office."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
