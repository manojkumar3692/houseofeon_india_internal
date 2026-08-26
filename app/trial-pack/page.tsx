"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import {
  getTrialEligibleProducts,
  TRIAL_PICK_COUNT,
  TRIAL_PACK_PRICE_INR,
  TRIAL_VIAL_SIZE_ML,
} from "@/lib/trialPack";
import { formatINR } from "@/lib/money";
import {
  trackTrialPackViewed,
  trackTrialScentSelected,
  trackTrialPackPurchased,
  trackBeginCheckout,
  trackAddPaymentInfo,
  trackPurchase,
  trackPaymentFailed,
} from "@/lib/analytics";

type CustomerForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

const EMPTY_FORM: CustomerForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

// Kept deliberately separate from useCart()/CartContext — a trial pack isn't
// a cart line with a quantity and per-unit bundle pricing, it's a fixed
// ₹249-for-3-vials product with its own dedicated order-creation route
// (/api/trial-orders/create). Bolting it onto the cart model would mean
// teaching every bit of bundle/coupon math about a case where none of that
// math applies.
export default function TrialPackPage() {
  const router = useRouter();
  const eligibleProducts = useMemo(() => getTrialEligibleProducts(), []);

  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [razorpayReady, setRazorpayReady] = useState(false);

  useEffect(() => {
    trackTrialPackViewed();
  }, []);

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

  function update<K extends keyof CustomerForm>(key: K, value: CustomerForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleScent(productId: string) {
    setSelected((current) => {
      if (current.includes(productId)) {
        return current.filter((id) => id !== productId);
      }
      if (current.length >= TRIAL_PICK_COUNT) return current;

      const next = [...current, productId];
      const product = eligibleProducts.find((p) => p.id === productId);
      if (product) trackTrialScentSelected(product.name, next.length);
      return next;
    });
  }

  const remaining = TRIAL_PICK_COUNT - selected.length;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (selected.length !== TRIAL_PICK_COUNT) {
      setError(`Pick ${TRIAL_PICK_COUNT} scents to continue.`);
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

    const selectedNames = selected
      .map((id) => eligibleProducts.find((p) => p.id === id)?.name || id);

    trackBeginCheckout({
      value: TRIAL_PACK_PRICE_INR,
      items: selected.map((id) => ({
        item_id: id,
        item_name:
          eligibleProducts.find((p) => p.id === id)?.name || id,
        price: TRIAL_PACK_PRICE_INR / TRIAL_PICK_COUNT,
        quantity: 1,
      })),
    });

    try {
      const createResponse = await fetch("/api/trial-orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: form,
          selectedScents: selected,
        }),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        trackPaymentFailed(createData.error || "Could not create trial pack order");
        throw new Error(createData.error || "Could not create trial pack order");
      }

      trackAddPaymentInfo({
        items: [],
        value: TRIAL_PACK_PRICE_INR,
        paymentMethod: "full",
      });

      const razorpay = new RazorpayConstructor({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: createData.amount,
        currency: "INR",
        name: process.env.NEXT_PUBLIC_BRAND_NAME || "House of Eon",
        description: `Trial Pack ${createData.orderNumber}`,
        order_id: createData.razorpayOrderId,
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        notes: {
          orderNumber: createData.orderNumber,
          orderType: "trial_pack",
        },
        theme: { color: "#1f1711" },
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
              value: TRIAL_PACK_PRICE_INR,
              items: selected.map((id) => ({
                item_id: id,
                item_name:
                  eligibleProducts.find((p) => p.id === id)?.name || id,
                price: TRIAL_PACK_PRICE_INR / TRIAL_PICK_COUNT,
                quantity: 1,
              })),
            });
            trackTrialPackPurchased(verifyData.orderNumber, selectedNames);

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
            trackPaymentFailed("customer_closed_razorpay_modal_trial_pack");
            setError(
              "Payment window closed before completing. Tap Pay to try again."
            );
            setLoading(false);
          },
        },
      });

      razorpay.on("payment.failed", (response: any) => {
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
      const message = err instanceof Error ? err.message : "Something went wrong";
      trackPaymentFailed(message);
      setError(message);
      setLoading(false);
    }
  }

  return (
    <section className="section checkout-page-pad">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <div className="container">
        <div className="eyebrow">Trial Pack</div>
        <h1 className="section-title">Try 3 scents before you commit</h1>
        <p className="muted" style={{ maxWidth: 620 }}>
          Pick any {TRIAL_PICK_COUNT} fragrances below. We&apos;ll send you a{" "}
          {TRIAL_VIAL_SIZE_ML}ml vial of each for {formatINR(TRIAL_PACK_PRICE_INR)} total.
        </p>

        <div className="trial-pack-how">
          <div>
            <span>1</span>
            <b>Pick {TRIAL_PICK_COUNT}, pay {formatINR(TRIAL_PACK_PRICE_INR)}</b>
            <span>
              {TRIAL_PICK_COUNT} × {TRIAL_VIAL_SIZE_ML}ml vials, shipped to you.
            </span>
          </div>
          <div>
            <span>2</span>
            <b>Get a one-time discount code</b>
            <span>
              Your order number itself becomes a {formatINR(TRIAL_PACK_PRICE_INR)}{" "}
              code — this is a discount on a later order, not a cash refund.
            </span>
          </div>
          <div>
            <span>3</span>
            <b>Redeem within 30 days</b>
            <span>
              Enter it at checkout on your next order, using the same phone
              number as this purchase. One-time use.
            </span>
          </div>
        </div>

        <div className="hero-grid" style={{ alignItems: "start" }}>
          <div>
            <div className="trial-pack-picker-head">
              <b>
                {selected.length} of {TRIAL_PICK_COUNT} selected
              </b>
              <span>
                {remaining > 0
                  ? `Pick ${remaining} more`
                  : "All set — scroll down to checkout"}
              </span>
            </div>

            <div className="trial-pack-grid">
              {eligibleProducts.map((product) => {
                const isSelected = selected.includes(product.id);
                const isDisabled = !isSelected && remaining === 0;

                return (
                  <button
                    key={product.id}
                    type="button"
                    className={`trial-pack-scent-card${isSelected ? " selected" : ""}${
                      isDisabled ? " disabled" : ""
                    }`}
                    onClick={() => toggleScent(product.id)}
                    disabled={isDisabled}
                  >
                    <img src={product.image} alt={product.name} />
                    <span className="trial-pack-scent-name">{product.name}</span>
                    <span className="trial-pack-scent-check" aria-hidden="true">
                      {isSelected ? "✓" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card checkout-summary-card">
            <div className="eyebrow">Your Trial Pack</div>
            <h2>{formatINR(TRIAL_PACK_PRICE_INR)} for 3</h2>

            {selected.length ? (
              <div className="checkout-summary-lineitems">
                {selected.map((id) => {
                  const product = eligibleProducts.find((p) => p.id === id);
                  if (!product) return null;
                  return (
                    <div className="checkout-line-item" key={id}>
                      <img src={product.image} alt={product.name} />
                      <div>
                        <b>{product.name}</b>
                        <span>{TRIAL_VIAL_SIZE_ML}ml vial</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="muted">Choose {TRIAL_PICK_COUNT} scents to see them here.</p>
            )}

            <form className="form" onSubmit={submit} style={{ marginTop: 18 }}>
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
                onChange={(e) => update("pincode", e.target.value.replace(/[^0-9]/g, ""))}
              />

              {error ? <div className="notice">{error}</div> : null}

              <div className="summary-total">
                <span>Total payable</span>
                <strong>{formatINR(TRIAL_PACK_PRICE_INR)}</strong>
              </div>

              <button
                className="btn"
                disabled={loading || !razorpayReady || selected.length !== TRIAL_PICK_COUNT}
                type="submit"
              >
                {loading
                  ? "Opening payment..."
                  : !razorpayReady
                  ? "Loading payment..."
                  : `Pay ${formatINR(TRIAL_PACK_PRICE_INR)}`}
              </button>

              <p className="muted" style={{ fontSize: 12.5 }}>
                Your order number will be emailed to you and works as a one-time{" "}
                {formatINR(TRIAL_PACK_PRICE_INR)} discount code (not a cash
                refund) on a full-size order within 30 days, using this same
                phone number — enter it at checkout under &ldquo;Redeem your
                Trial Pack credit&rdquo;.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
