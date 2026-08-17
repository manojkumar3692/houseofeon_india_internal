"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCart } from "@/components/CartContext";
import UrgencyStrip from "@/components/UrgencyStrip";
import { getProductById } from "@/lib/products";
import { formatINR } from "@/lib/money";
import {
  trackBeginCheckout,
  trackPaymentFailed,
  trackPurchase,
  trackCheckoutLead,
  trackAddPaymentInfo,
  trackPurchaseAfterConcierge,
} from "@/lib/analytics";
import { getConciergeEngagement } from "@/lib/assistantSession";
import {
  trackCheckoutStartedClarity,
  trackPaymentSuccessClarity,
} from "@/lib/clarity";
import {
  isPartialCodEligible,
  getEffectiveTokenAmountInPaise,
} from "@/lib/codToken";
import { getUnitPrice } from "@/lib/pricing";
import {
  captureCheckoutSession,
  captureCheckoutSessionBeacon,
  getCheckoutSessionKey,
  getDeviceType,
  getUtmParams,
} from "@/lib/checkoutSession";

type CustomerForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

export default function CheckoutPage() {
  const router = useRouter();

  const {
    lines,
    total,
    hasBundleLine,
    couponCode,
    couponDiscount,
    finalTotal,
    clearCart,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [paymentType, setPaymentType] = useState<"full" | "partial_cod">(
    "full"
  );
  const [summaryOpen, setSummaryOpen] = useState(false);
  const payButtonRef = useRef<HTMLButtonElement>(null);

  const codEligible = isPartialCodEligible(Math.round(finalTotal * 100));
  const effectivePaymentType =
    paymentType === "partial_cod" && codEligible ? "partial_cod" : "full";
  // Capped at the order's own total, same as the server — at real order
  // values this is just the usual token amount (e.g. ₹99), but it means
  // "pay now" can never cost more than paying in full, even at very low
  // test totals (the admin ₹1 coupon), so both options are always safe
  // to show side by side and the customer just picks whichever is cheaper.
  const tokenAmountInr =
    getEffectiveTokenAmountInPaise(Math.round(finalTotal * 100)) / 100;
  const amountDueNow =
    effectivePaymentType === "partial_cod" ? tokenAmountInr : finalTotal;
  const balanceDueNow =
    effectivePaymentType === "partial_cod"
      ? Math.max(0, finalTotal - tokenAmountInr)
      : 0;

  const beginCheckoutTrackedRef = useRef(false);

  // Funnel-capture state: fires at most once per session (Lead event), and
  // tracks the last field the customer touched so a tab-close/app-switch
  // beacon can report exactly where they were when they left.
  const phoneLeadFiredRef = useRef(false);
  const lastActiveFieldRef = useRef<string>("");

  const [form, setForm] = useState<CustomerForm>({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  // Mirrors `form` into a ref so the unload/visibility listener (set up
  // once on mount, see below) can always read the latest values without
  // needing to re-subscribe on every keystroke.
  const formRef = useRef(form);
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  // Autofill-safe capture: browser/mobile autofill can fill several fields
  // at once (name, phone, address, city, pincode all from one saved-address
  // tap) without the customer ever individually focusing and blurring each
  // one — so the per-field onBlur capture below can silently miss most of
  // an autofilled form. This watches the actual form STATE instead of
  // blur/focus events, so it doesn't care how a value got there. Debounced
  // so it doesn't fire on every keystroke, just ~1.2s after things settle.
  useEffect(() => {
    const hasAnyValue = Object.values(form).some((value) => value.trim());
    if (!hasAnyValue) return;

    const timeout = setTimeout(() => {
      captureCheckoutSession(undefined, {
        name: form.name || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        pincode: form.pincode || undefined,
        lastActiveField: lastActiveFieldRef.current || undefined,
      });
    }, 1200);

    return () => clearTimeout(timeout);
  }, [form]);

  function update<K extends keyof CustomerForm>(key: K, value: CustomerForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  // Generic field capture — fired on blur, only when the field actually has
  // a value (an empty blur isn't a meaningful signal). Records both the
  // field's value and that it was the last one the customer interacted with.
  function handleFieldBlur(field: string, value: string) {
    lastActiveFieldRef.current = field;
    if (!value) return;
    captureCheckoutSession(undefined, {
      [field]: value,
      lastActiveField: field,
    } as Record<string, string>);
  }

  function handleFieldFocus(field: string) {
    lastActiveFieldRef.current = field;
  }

  // Phone gets special handling: the moment it looks like a real number,
  // this is the single most valuable capture point in the whole page — it's
  // the earliest moment an anonymous visitor becomes an identifiable
  // person. The Lead event to Meta/GA fires at most once per session even
  // if they revisit the field.
  function handlePhoneBlur(value: string) {
    lastActiveFieldRef.current = "phone";

    const digits = value.replace(/[^0-9]/g, "");
    if (digits.length < 10) return;

    captureCheckoutSession("phone_captured", {
      phone: value,
      lastActiveField: "phone",
    });

    if (!phoneLeadFiredRef.current) {
      phoneLeadFiredRef.current = true;
      trackCheckoutLead({
        name: formRef.current.name || undefined,
        phone: value,
        email: formRef.current.email || undefined,
        items: analyticsItems,
        value: finalTotal,
      });
    }
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
          price: getUnitPrice(product.price, totalItems),
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

  // Line items for the visual order summary — mirrors analyticsItems but
  // keeps the image/size around for rendering, so customers can see exactly
  // what they're paying for without leaving checkout to check the cart.
  //
  // getUnitPrice only bakes in the bundle rate (2+ bottles) — it knows
  // nothing about coupon codes like EON20, which are applied as a separate
  // subtract-from-subtotal step in CartContext. So a raw getUnitPrice
  // number would show ₹1249 for a single bottle even though EON20 (or any
  // other active coupon) has already brought the real total down to ₹999.
  // Scaling every line by the same ratio the cart's total was scaled by
  // keeps these numbers matching whatever coupon math produced finalTotal,
  // without hardcoding EON20 specifically.
  const checkoutLineItems = useMemo(() => {
    const discountFactor = total > 0 ? finalTotal / total : 1;

    return lines
      .map((line) => {
        const product = getProductById(line.productId);
        if (!product) return null;

        const rawLineTotal =
          getUnitPrice(product.price, totalItems) * line.quantity;
        const lineTotal = Math.round(rawLineTotal * discountFactor);

        return {
          productId: product.id,
          name: product.name,
          image: product.image,
          size: product.size,
          quantity: line.quantity,
          unitPrice: Math.round(lineTotal / line.quantity),
          lineTotal,
        };
      })
      .filter(Boolean) as {
      productId: string;
      name: string;
      image: string;
      size: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }[];
  }, [lines, totalItems, total, finalTotal]);

  // A real, order-verified review pulled from whichever product is actually
  // in the cart — shown right at the point of payment so the last thing a
  // customer reads before tapping Pay is proof someone else already
  // received and liked this exact perfume, not generic marketing copy.
  const checkoutReview = useMemo(() => {
    for (const item of checkoutLineItems) {
      const product = getProductById(item.productId);
      const verifiedReview = product?.reviews?.find(
        (review) => review.verified
      );
      if (verifiedReview && product) {
        return { review: verifiedReview, productName: product.name };
      }
    }
    return null;
  }, [checkoutLineItems]);

  useEffect(() => {
    if (!lines.length) return;
    if (beginCheckoutTrackedRef.current) return;

    beginCheckoutTrackedRef.current = true;

    trackBeginCheckout({
      value: finalTotal,
      items: analyticsItems,
    });
    trackCheckoutStartedClarity();

    const utm = getUtmParams();
    captureCheckoutSession("page_viewed", {
      cartItems: analyticsItems.map((item) => ({
        productId: item.item_id,
        name: item.item_name,
        quantity: item.quantity || 1,
        price: item.price,
      })),
      cartValueInPaise: Math.round(finalTotal * 100),
      referrer:
        typeof document !== "undefined" ? document.referrer || undefined : undefined,
      deviceType: getDeviceType(),
      ...utm,
    });
  }, [lines.length, finalTotal, analyticsItems]);

  // EON20 auto-apply now lives in CartContext itself (so it also works on
  // /cart, not just here) — nothing needed on this page anymore.

  // Captures a last-known-state beacon the instant the tab is backgrounded
  // or closed — sendBeacon (unlike a normal fetch) reliably survives the
  // page going away. Set up once on mount; reads the latest form values via
  // formRef/lastActiveFieldRef rather than re-subscribing on every keystroke.
  useEffect(() => {
    function sendBeacon() {
      const f = formRef.current;
      captureCheckoutSessionBeacon({
        name: f.name || undefined,
        phone: f.phone || undefined,
        email: f.email || undefined,
        address: f.address || undefined,
        city: f.city || undefined,
        state: f.state || undefined,
        pincode: f.pincode || undefined,
        lastActiveField: lastActiveFieldRef.current || undefined,
      });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") sendBeacon();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", sendBeacon);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", sendBeacon);
    };
  }, []);

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

    lastActiveFieldRef.current = "submit_button";
    // Full form snapshot, not just the field name — this is the moment
    // we're most sure the form is complete (Razorpay's about to open), and
    // it shouldn't depend on the debounced watcher above having already
    // fired in time.
    captureCheckoutSession("submitted", {
      name: form.name || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      address: form.address || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      pincode: form.pincode || undefined,
      lastActiveField: "submit_button",
    });
    trackAddPaymentInfo({
      items: analyticsItems,
      value: finalTotal,
      paymentMethod: effectivePaymentType,
    });

    try {
      const createResponse = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: form,
          items: lines,
          couponCode: couponCode || "",
          paymentType: effectivePaymentType,
          sessionKey: getCheckoutSessionKey() || undefined,
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

            // Only fires if this browser session actually interacted with
            // EON Concierge earlier (see lib/assistantSession.ts) — this is
            // the metric that answers whether the concierge moves the
            // needle on conversion, not just whether it gets opened.
            const engagement = getConciergeEngagement();
            if (engagement.engaged) {
              trackPurchaseAfterConcierge(
                engagement.products,
                Number(createData.finalTotal ?? finalTotal)
              );
            }

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
            captureCheckoutSession("razorpay_dismissed", {
              lastActiveField: "razorpay_modal",
            });
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

        captureCheckoutSession("payment_failed", {
          paymentFailedReason: description,
        });
        trackPaymentFailed(description);
        setError(description);
        setLoading(false);
      });

      captureCheckoutSession("razorpay_opened");
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
    <section className="section checkout-page-pad">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <div className="container">
        <h1 className="section-title">Checkout</h1>

        {lines.length ? (
          <div className="checkout-mobile-summary">
            <button
              type="button"
              className="checkout-mobile-summary-toggle"
              onClick={() => setSummaryOpen((open) => !open)}
            >
              <span className="checkout-mobile-summary-thumbs">
                {checkoutLineItems.slice(0, 3).map((item) => (
                  <img key={item.productId} src={item.image} alt="" />
                ))}
              </span>

              <span className="checkout-mobile-summary-text">
                <b>Order summary</b>
                <span>
                  {totalItems} item{totalItems > 1 ? "s" : ""} ·{" "}
                  {formatINR(finalTotal)}
                </span>
              </span>

              <span
                className={`checkout-mobile-summary-chevron${
                  summaryOpen ? " open" : ""
                }`}
                aria-hidden="true"
              >
                ⌄
              </span>
            </button>

            {summaryOpen ? (
              <div className="checkout-mobile-summary-body">
                {checkoutLineItems.map((item) => (
                  <div className="checkout-line-item" key={item.productId}>
                    <img src={item.image} alt={item.name} />
                    <div>
                      <b>{item.name}</b>
                      <span>
                        Qty {item.quantity} · {item.size}
                      </span>
                    </div>
                    <span className="checkout-line-item-price">
                      {formatINR(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

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
                onFocus={() => handleFieldFocus("name")}
                onBlur={(e) => handleFieldBlur("name", e.target.value)}
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
                onFocus={() => handleFieldFocus("phone")}
                onBlur={(e) => handlePhoneBlur(e.target.value)}
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
              onFocus={() => handleFieldFocus("email")}
              onBlur={(e) => handleFieldBlur("email", e.target.value)}
            />

            <textarea
              className="textarea"
              required
              autoComplete="street-address"
              placeholder="Full address"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              onFocus={() => handleFieldFocus("address")}
              onBlur={(e) => handleFieldBlur("address", e.target.value)}
            />

            <div className="two">
              <input
                className="input"
                required
                autoComplete="address-level2"
                placeholder="City"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                onFocus={() => handleFieldFocus("city")}
                onBlur={(e) => handleFieldBlur("city", e.target.value)}
              />

              <input
                className="input"
                required
                autoComplete="address-level1"
                placeholder="State"
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
                onFocus={() => handleFieldFocus("state")}
                onBlur={(e) => handleFieldBlur("state", e.target.value)}
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
              onFocus={() => handleFieldFocus("pincode")}
              onBlur={(e) => handleFieldBlur("pincode", e.target.value)}
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
                    onClick={() => {
                      setPaymentType("full");
                      lastActiveFieldRef.current = "payment_method";
                      captureCheckoutSession(undefined, {
                        paymentMethod: "full",
                        lastActiveField: "payment_method",
                      });
                    }}
                  >
                    <b>Pay full amount online</b>
                    <span>{formatINR(finalTotal)} via UPI, card or netbanking</span>
                  </button>

                  <button
                    type="button"
                    className={`payment-method-option${
                      effectivePaymentType === "partial_cod" ? " active" : ""
                    }`}
                    onClick={() => {
                      setPaymentType("partial_cod");
                      lastActiveFieldRef.current = "payment_method";
                      captureCheckoutSession(undefined, {
                        paymentMethod: "partial_cod",
                        lastActiveField: "payment_method",
                      });
                    }}
                  >
                    <b>Pay {formatINR(tokenAmountInr)} now, rest on delivery</b>
                    <span>
                      Balance {formatINR(Math.max(0, finalTotal - tokenAmountInr))} in
                      cash when your order arrives
                    </span>
                  </button>
                </div>
              </div>
            ) : null}

            {error ? <div className="notice">{error}</div> : null}

            {checkoutLineItems.length ? (
              <UrgencyStrip
                productId={checkoutLineItems[0].productId}
                productName={
                  checkoutLineItems.length === 1
                    ? checkoutLineItems[0].name
                    : undefined
                }
                className="urgency-strip-checkout"
              />
            ) : null}

            {checkoutReview ? (
              <div className="checkout-review-snippet">
                <div className="checkout-review-snippet-top">
                  <span className="checkout-review-snippet-stars" aria-hidden="true">
                    {"★".repeat(Math.round(checkoutReview.review.rating))}
                    {"☆".repeat(5 - Math.round(checkoutReview.review.rating))}
                  </span>
                  <span className="checkout-review-snippet-badge">
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path
                        d="M10 1.5l2.34 1.36 2.7-.15 1.02 2.52 2.24 1.62-.87 2.6.87 2.6-2.24 1.62-1.02 2.52-2.7-.15L10 18.5l-2.34-1.36-2.7.15-1.02-2.52-2.24-1.62.87-2.6-.87-2.6 2.24-1.62L4.96 2.71l2.7.15L10 1.5z"
                        fill="currentColor"
                      />
                      <path
                        d="M6.8 10.2l2.1 2.1 4.3-4.6"
                        stroke="#fff"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Verified Buyer
                  </span>
                </div>

                <p className="checkout-review-snippet-text">
                  &ldquo;{checkoutReview.review.text}&rdquo;
                </p>

                <div className="checkout-review-snippet-meta">
                  <b>{checkoutReview.review.name}</b>
                  <span>
                    {checkoutReview.review.city} · Order verified · Bought{" "}
                    {checkoutReview.productName}
                  </span>
                </div>
              </div>
            ) : null}

            <button
              ref={payButtonRef}
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

            {checkoutLineItems.length ? (
              <div className="checkout-summary-lineitems">
                {checkoutLineItems.map((item) => (
                  <div className="checkout-line-item" key={item.productId}>
                    <img src={item.image} alt={item.name} />
                    <div>
                      <b>{item.name}</b>
                      <span>
                        Qty {item.quantity} · {item.size}
                      </span>
                    </div>
                    <span className="checkout-line-item-price">
                      {formatINR(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

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

              {hasBundleLine ? (
                <div>
                  <span>Pricing</span>
                  <b>2-bottle bundle applied</b>
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

            <div className="checkout-trust-strip">
              <div>
                <b>Secure payment</b>
                <span>Powered by Razorpay</span>
              </div>
              <div>
                <b>100% Original</b>
                <span>Every bottle sealed &amp; quality checked</span>
              </div>
              <div>
                <b>The Compliment Getter</b>
                <span>Loved for how long it lasts</span>
              </div>
              <div>
                <b>No returns once opened</b>
                <span>Fragrances can&apos;t be returned once the seal is broken</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {lines.length ? (
        <div className="checkout-sticky-pay">
          <div className="checkout-sticky-pay-info">
            <span>
              {effectivePaymentType === "partial_cod" ? "Pay now" : "Total"}
            </span>
            <b>
              {formatINR(
                effectivePaymentType === "partial_cod"
                  ? amountDueNow
                  : finalTotal
              )}
            </b>
          </div>
          <button
            type="button"
            disabled={loading || !razorpayReady}
            onClick={() => payButtonRef.current?.click()}
          >
            {loading
              ? "Opening..."
              : !razorpayReady
              ? "Loading..."
              : "Pay now"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
