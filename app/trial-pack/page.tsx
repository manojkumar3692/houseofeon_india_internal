"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
    <main className="trial-page checkout-page-pad">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <section className="trial-page-hero">
        <div className="container trial-page-hero-grid">
          <div className="trial-page-hero-copy">
            <span className="trial-page-kicker">House of Eon Discovery Set</span>
            <h1>Meet your fragrance before you commit.</h1>
            <p>
              Choose three fragrances. Wear each one on your skin. Find the
              scent that feels unmistakably yours.
            </p>

            <div className="trial-page-offer" aria-label="Discovery Set details">
              <strong>{TRIAL_PICK_COUNT} × {TRIAL_VIAL_SIZE_ML} ml</strong>
              <span aria-hidden="true" />
              <strong>{formatINR(TRIAL_PACK_PRICE_INR)}</strong>
            </div>

            <a className="trial-page-start" href="#build-your-set">
              Build your set <span aria-hidden="true">↓</span>
            </a>
          </div>

          <div className="trial-page-hero-visual">
            <a
              className="trial-page-campaign-crop"
              href="#build-your-set"
              aria-label="Build your House of Eon Discovery Set"
            >
              <Image
                className="trial-page-campaign-image"
                src="/discovery-set-campaign.png"
                alt="Three House of Eon 8 ml discovery fragrances"
                fill
                priority
                sizes="(max-width: 760px) 92vw, 40vw"
              />
            </a>
          </div>
        </div>
      </section>

      <div className="container trial-page-content">
        <section className="trial-page-how" aria-labelledby="discovery-how-title">
          <div className="trial-page-how-title">
            <span>How it works</span>
            <h2 id="discovery-how-title">How your ₹249 comes back.</h2>
          </div>
          <ol>
            <li><span>01</span><div><b>Choose any three</b><small>Create a set around your taste.</small></div></li>
            <li><span>02</span><div><b>Wear, don&apos;t just smell</b><small>Give every fragrance time on skin.</small></div></li>
            <li><span>03</span><div><b>Keep your order number</b><small>It is your key to the ₹249 credit.</small></div></li>
            <li><span>04</span><div><b>Enter it at checkout</b><small>Use the same phone number. ₹249 is deducted automatically.</small></div></li>
          </ol>
          <div className="trial-page-redeem-flow" aria-label="How to redeem the Discovery Set credit">
            <b>No coupon to find</b>
            <span>Full-size checkout</span>
            <i aria-hidden="true">→</i>
            <span>Enter Trial Pack order number</span>
            <i aria-hidden="true">→</i>
            <span>Same phone number</span>
            <i aria-hidden="true">→</i>
            <strong>₹249 deducted</strong>
          </div>
        </section>

        <section className="trial-page-builder" id="build-your-set" aria-labelledby="builder-title">
          <div className="trial-page-builder-head">
            <div>
              <span className="trial-page-kicker">Your edit</span>
              <h2 id="builder-title">Build your Discovery Set.</h2>
              <p>Select exactly three fragrances. Tap again to remove one.</p>
            </div>

            <div className="trial-page-progress" aria-live="polite">
              <div>
                {Array.from({ length: TRIAL_PICK_COUNT }).map((_, index) => (
                  <span className={index < selected.length ? "filled" : ""} key={index} />
                ))}
              </div>
              <b>{selected.length} / {TRIAL_PICK_COUNT}</b>
            </div>
          </div>

          <div className="trial-page-builder-grid">
            <div className="trial-page-picker" id="scents">
            <div className="trial-pack-picker-head">
              <b>
                {selected.length} of {TRIAL_PICK_COUNT} selected
              </b>
              <span>
                {remaining > 0
                  ? `Choose ${remaining} more`
                  : "Your set is ready"}
              </span>
            </div>

            <div className="trial-pack-grid">
              {eligibleProducts.map((product, productIndex) => {
                const isSelected = selected.includes(product.id);
                const isDisabled = !isSelected && remaining === 0;
                const selectedIndex = selected.indexOf(product.id);

                return (
                  <button
                    key={product.id}
                    type="button"
                    className={`trial-pack-scent-card${isSelected ? " selected" : ""}${
                      isDisabled ? " disabled" : ""
                    }`}
                    onClick={() => toggleScent(product.id)}
                    disabled={isDisabled}
                    aria-pressed={isSelected}
                  >
                    <span className="trial-pack-scent-image">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 45vw, 250px"
                      />
                    </span>
                    <span className="trial-pack-scent-content">
                      <span className="trial-pack-scent-order">0{productIndex + 1}</span>
                      <span className="trial-pack-scent-name">{product.name}</span>
                      <span className="trial-pack-scent-notes">
                        {product.notes.slice(0, 3).join(" · ")}
                      </span>
                    </span>
                    <span className="trial-pack-scent-check" aria-hidden="true">
                      {isSelected ? selectedIndex + 1 : "+"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="trial-page-checkout" aria-label="Discovery Set checkout">
            <div className="trial-page-checkout-top">
              <div>
                <span>Your Discovery Set</span>
                <h2>{formatINR(TRIAL_PACK_PRICE_INR)}</h2>
              </div>
              <small>{TRIAL_PICK_COUNT} × {TRIAL_VIAL_SIZE_ML} ml</small>
            </div>

            <div className="trial-page-selection-slots">
              {Array.from({ length: TRIAL_PICK_COUNT }).map((_, index) => {
                const product = eligibleProducts.find((item) => item.id === selected[index]);
                return product ? (
                  <button type="button" key={product.id} onClick={() => toggleScent(product.id)} aria-label={`Remove ${product.name}`}>
                    <Image src={product.image} alt="" width={54} height={54} />
                    <span><b>{product.name}</b><small>{TRIAL_VIAL_SIZE_ML} ml vial</small></span>
                    <i aria-hidden="true">×</i>
                  </button>
                ) : (
                  <div className="trial-page-empty-slot" key={index}>
                    <span>0{index + 1}</span>
                    <small>Choose a fragrance</small>
                  </div>
                );
              })}
            </div>

            {selected.length === TRIAL_PICK_COUNT ? (
              <form className="form trial-page-form" onSubmit={submit}>
                <div className="trial-page-form-head">
                  <span>Delivery details</span>
                  <small>Secure checkout</small>
                </div>

                <div className="two">
                  <input className="input" required autoComplete="name" placeholder="Full name" aria-label="Full name" value={form.name} onChange={(e) => update("name", e.target.value)} />
                  <input className="input" required type="tel" inputMode="tel" autoComplete="tel" placeholder="Phone" aria-label="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                </div>

                <input className="input" type="email" inputMode="email" autoComplete="email" required placeholder="Email for order confirmation" aria-label="Email for order confirmation" value={form.email} onChange={(e) => update("email", e.target.value)} />

                <textarea className="textarea" required autoComplete="street-address" placeholder="Full delivery address" aria-label="Full delivery address" value={form.address} onChange={(e) => update("address", e.target.value)} />

                <div className="two">
                  <input className="input" required autoComplete="address-level2" placeholder="City" aria-label="City" value={form.city} onChange={(e) => update("city", e.target.value)} />
                  <input className="input" required autoComplete="address-level1" placeholder="State" aria-label="State" value={form.state} onChange={(e) => update("state", e.target.value)} />
                </div>

                <input className="input" required type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="postal-code" maxLength={6} placeholder="Pincode" aria-label="Pincode" value={form.pincode} onChange={(e) => update("pincode", e.target.value.replace(/[^0-9]/g, ""))} />

                {error ? <div className="notice">{error}</div> : null}

                <div className="summary-total">
                  <span>Total payable</span>
                  <strong>{formatINR(TRIAL_PACK_PRICE_INR)}</strong>
                </div>

                <button className="btn trial-page-pay" disabled={loading || !razorpayReady} type="submit">
                  {loading ? "Opening payment..." : !razorpayReady ? "Loading payment..." : `Continue to secure payment · ${formatINR(TRIAL_PACK_PRICE_INR)}`}
                </button>
              </form>
            ) : (
              <div className="trial-page-checkout-prompt">
                <span>{remaining}</span>
                <div>
                  <b>{remaining === 1 ? "One fragrance to go" : `${remaining} fragrances to go`}</b>
                  <p>Your delivery details appear once your set is complete.</p>
                </div>
              </div>
            )}

            <div className="trial-page-credit-note">
              <b>No coupon needed — use your order number</b>
              <p>
                Enter your Trial Pack order number at full-size checkout and use
                the same phone number. When they match, ₹249 is deducted
                automatically. Redeem once within 30 days.
              </p>
            </div>
          </aside>
        </div>
        </section>
      </div>
    </main>
  );
}
