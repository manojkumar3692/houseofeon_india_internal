"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCart } from "@/components/CartContext";
import TrialPackRescue from "@/components/TrialPackRescue";
import { getProductById } from "@/lib/products";
import { formatINR } from "@/lib/money";
import {
  trackBeginCheckout,
  trackPaymentFailed,
  trackPurchase,
  trackCheckoutLead,
  trackAddPaymentInfo,
  trackPurchaseAfterConcierge,
  trackTrialCreditRedeemed,
  trackCheckoutPaymentRetry,
  trackCheckoutPaymentHelpClicked,
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

const PAYMENT_HELP_URL =
  "https://wa.me/919902376600?text=Hi%20House%20of%20Eon%2C%20I%20need%20help%20completing%20my%20payment.";

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
    applyCoupon,
  } = useCart();

  // The general "Coupon code" box lives on /cart (EON20 etc., no phone
  // needed there). Trial-pack credit codes are phone-matched though (see
  // lib/trialCredit.ts), and phone is only known once someone's actually
  // on this page — so this is a second, checkout-only entry point for
  // "I have a trial pack order number" that reuses the exact same
  // applyCoupon/validate pipeline, just with form.phone attached. Typing a
  // normal coupon code in here works too, it's the same endpoint.
  const [creditInput, setCreditInput] = useState("");
  const [creditMessage, setCreditMessage] = useState("");
  const [creditApplying, setCreditApplying] = useState(false);

  async function handleApplyCredit() {
    if (!form.phone) {
      setCreditMessage("Enter your phone number above first.");
      return;
    }
    setCreditApplying(true);
    const codeAttempted = creditInput;
    const result = await applyCoupon(creditInput, form.phone);
    setCreditMessage(result.message);
    if (result.ok) {
      setCreditInput("");
      // A trial pack order number redeeming here looks just like any other
      // coupon code from applyCoupon's perspective — no separate "this was
      // a trial credit" flag comes back. HOE-YYYYMMDD-XXXXX is the trial
      // order-number format (see lib/order.ts createOrderNumber), which
      // never collides with a real coupon code like EON20, so matching on
      // that shape is a safe way to fire the funnel-specific event without
      // over-counting normal coupon applies.
      if (/^HOE-\d{8}-[A-Z0-9]{5}$/i.test(codeAttempted.trim())) {
        trackTrialCreditRedeemed(codeAttempted.trim().toUpperCase());
      }
    }
    setCreditApplying(false);
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [paymentType, setPaymentType] = useState<"full" | "partial_cod">(
    "full"
  );
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [paymentRecovery, setPaymentRecovery] = useState<string | null>(null);
  const payButtonRef = useRef<HTMLButtonElement>(null);

  // Checkout abandonment rescue (see components/TrialPackRescue.tsx and the
  // discussion that shaped this — deliberately NOT shown to everyone, only
  // on a real abandonment signal, so it doesn't cannibalize full-price
  // purchases from people who were always going to complete checkout).
  const [rescueTrigger, setRescueTrigger] = useState<string | null>(null);
  const rescueShownRef = useRef(false);
  const paymentSucceededRef = useRef(false);
  const hasEngagedRef = useRef(false);
  const lastInteractionAtRef = useRef(Date.now());
  const wasHiddenRef = useRef(false);
  const pageLoadAtRef = useRef(Date.now());
  const paymentRecoveryActiveRef = useRef(false);

  function maybeShowRescue(trigger: string) {
    if (rescueShownRef.current) return;
    if (paymentSucceededRef.current) return;
    if (paymentRecoveryActiveRef.current) return;
    if (!lines.length) return;

    rescueShownRef.current = true;
    setRescueTrigger(trigger);
  }

  function showPaymentRecovery(message: string) {
    paymentRecoveryActiveRef.current = true;
    setPaymentRecovery(message);
    setError("");
  }

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

  const formComplete = useMemo(() => {
    const phoneDigits = form.phone.replace(/[^0-9]/g, "");
    return (
      form.name.trim().length >= 2 &&
      phoneDigits.length >= 10 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
      form.address.trim().length >= 8 &&
      form.city.trim().length >= 2 &&
      form.state.trim().length >= 2 &&
      /^\d{6}$/.test(form.pincode)
    );
  }, [form]);

  function handleStickyPay() {
    const formElement = payButtonRef.current?.form;
    if (!formElement) return;

    if (!formElement.checkValidity()) {
      const firstInvalid = formElement.querySelector<HTMLElement>(":invalid");
      firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => formElement.reportValidity(), 350);
      return;
    }

    payButtonRef.current?.click();
  }

  // Mirrors `form` into a ref so the unload/visibility listener (set up
  // once on mount, see below) can always read the latest values without
  // needing to re-subscribe on every keystroke.
  const formRef = useRef(form);
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  function update<K extends keyof CustomerForm>(key: K, value: CustomerForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    lastInteractionAtRef.current = Date.now();
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
    hasEngagedRef.current = true;
    lastInteractionAtRef.current = Date.now();
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
      if (document.visibilityState === "hidden") {
        sendBeacon();
        wasHiddenRef.current = true;
        return;
      }

      // "Tab returned" — the softest of the rescue signals (could just be
      // someone checking an OTP SMS or comparing prices elsewhere), so it's
      // gated harder than the others: only fires if they'd actually left the
      // tab before, haven't completed payment, and get a short grace period
      // after returning rather than popping the instant the tab refocuses.
      if (wasHiddenRef.current) {
        wasHiddenRef.current = false;
        setTimeout(() => maybeShowRescue("tab_returned"), 1500);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", sendBeacon);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", sendBeacon);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Desktop exit intent — cursor heading toward the tab/address bar.
  // mouseleave with clientY <= 0 is the standard technique; it simply never
  // fires on touch devices (no mouse), so no separate mobile gating is
  // needed, but matchMedia still guards against odd hybrid-device hover
  // events. Armed only after a few seconds on page so it can't fire on the
  // initial mouse jitter right after the page loads.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    function handleMouseLeave(e: MouseEvent) {
      if (Date.now() - pageLoadAtRef.current < 4000) return;
      if (e.clientY > 0) return;
      maybeShowRescue("exit_intent");
    }

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Idle timeout — the other heuristic signal. Only arms after the shopper
  // has actually engaged with the form (so it can't fire on someone who just
  // landed and is still reading), and uses a fairly long threshold so normal
  // slow typing/thinking doesn't get mistaken for abandonment.
  useEffect(() => {
    const IDLE_THRESHOLD_MS = 45000;

    const interval = setInterval(() => {
      if (!hasEngagedRef.current) return;
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastInteractionAtRef.current < IDLE_THRESHOLD_MS) return;
      maybeShowRescue("idle_timeout");
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setPaymentRecovery(null);
    setRescueTrigger(null);
    paymentRecoveryActiveRef.current = false;

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
    captureCheckoutSession("submitted", { lastActiveField: "submit_button" });
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
            paymentSucceededRef.current = true;
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
            showPaymentRecovery(message);
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            captureCheckoutSession("razorpay_dismissed", {
              lastActiveField: "razorpay_modal",
            });
            trackPaymentFailed("customer_closed_razorpay_modal");
            if (!paymentRecoveryActiveRef.current) {
              showPaymentRecovery(
                "The payment window was closed before payment was completed."
              );
            }
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
        showPaymentRecovery(description);
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

            {error && !paymentRecovery ? <div className="notice">{error}</div> : null}

            {paymentRecovery ? (
              <div className="checkout-payment-recovery" role="alert">
                <span>Payment wasn&apos;t completed</span>
                <h3>Your order details are safe.</h3>
                <p>
                  Your cart and delivery details are still here. Retry securely,
                  choose another payment option, or message us for help. If your
                  bank shows a debit, contact us before retrying.
                </p>
                <small>{paymentRecovery}</small>
                <div className="checkout-payment-recovery-actions">
                  <button
                    className="checkout-payment-retry"
                    type="submit"
                    disabled={loading || !razorpayReady}
                    onClick={() => {
                      trackCheckoutPaymentRetry(effectivePaymentType);
                      setPaymentRecovery(null);
                      paymentRecoveryActiveRef.current = false;
                    }}
                  >
                    {loading
                      ? "Opening payment..."
                      : `Retry secure payment · ${formatINR(amountDueNow)}`}
                  </button>

                  {codEligible ? (
                    <button
                      className="checkout-payment-switch"
                      type="button"
                      onClick={() => {
                        const nextType =
                          effectivePaymentType === "full" ? "partial_cod" : "full";
                        setPaymentType(nextType);
                        captureCheckoutSession(undefined, {
                          paymentMethod: nextType,
                          lastActiveField: "payment_recovery",
                        });
                      }}
                    >
                      {effectivePaymentType === "full"
                        ? `Switch to ${formatINR(tokenAmountInr)} now, rest on delivery`
                        : `Switch to full online payment · ${formatINR(finalTotal)}`}
                    </button>
                  ) : null}

                  <a
                    href={PAYMENT_HELP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackCheckoutPaymentHelpClicked(effectivePaymentType)}
                  >
                    Get payment help on WhatsApp
                  </a>
                </div>
              </div>
            ) : null}

            <div className="checkout-payment-assurance" aria-label="Checkout assurances">
              <span>Free shipping</span>
              <span>Delivery in 2–3 working days</span>
              <span>Secured by Razorpay</span>
            </div>

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

            {!paymentRecovery ? (
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
                  ? `Pay ${formatINR(amountDueNow)} now securely`
                  : `Pay ${formatINR(finalTotal)} securely`}
              </button>
            ) : (
              <button ref={payButtonRef} type="submit" hidden aria-hidden="true" />
            )}
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

              <div>
                <span>Shipping</span>
                <b>FREE</b>
              </div>
            </div>

            {!hasBundleLine && (
              <div className="checkout-credit-box">
                <label htmlFor="credit-code">Redeem your Trial Pack credit</label>
                <p className="checkout-credit-sublabel">
                  No coupon needed. Enter your Trial Pack order number and use
                  the same phone number in your delivery details. When they
                  match, ₹249 is deducted automatically.
                </p>
                <div className="checkout-credit-row">
                  <input
                    id="credit-code"
                    className="input"
                    type="text"
                    placeholder="e.g. HOE-20260813-7ZUE1"
                    value={creditInput}
                    onChange={(e) => setCreditInput(e.target.value)}
                    disabled={creditApplying}
                  />
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={handleApplyCredit}
                    disabled={creditApplying || !creditInput.trim()}
                  >
                    {creditApplying ? "Checking…" : "Apply"}
                  </button>
                </div>
                {creditMessage && (
                  <p className="checkout-credit-message">{creditMessage}</p>
                )}
              </div>
            )}

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
                  )} token payment, you will receive an order confirmation. Pay the remaining ${formatINR(
                    balanceDueNow
                  )} in cash to the delivery agent. Tracking details are shared after dispatch.`
                : "After successful payment, you will receive an order confirmation. Tracking details are shared after dispatch."}
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
                <b>Free shipping</b>
                <span>No extra delivery charge at checkout</span>
              </div>
              <div>
                <b>Help when you need it</b>
                <span>Payment support available on WhatsApp</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {lines.length ? (
        <div className="checkout-sticky-pay">
          <div className="checkout-sticky-pay-info">
            <span>
              {formComplete
                ? effectivePaymentType === "partial_cod"
                  ? "Pay now · Free shipping"
                  : "Total · Free shipping"
                : "Free shipping · Secure payment"}
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
            disabled={loading || (formComplete && !razorpayReady)}
            onClick={handleStickyPay}
          >
            {loading
              ? "Opening..."
              : !formComplete
              ? "Complete details"
              : !razorpayReady
              ? "Loading..."
              : effectivePaymentType === "partial_cod"
              ? `Pay ${formatINR(amountDueNow)} now`
              : `Pay ${formatINR(finalTotal)}`}
          </button>
        </div>
      ) : null}

      {rescueTrigger ? (
        <TrialPackRescue
          trigger={rescueTrigger}
          onDismiss={() => setRescueTrigger(null)}
        />
      ) : null}
    </section>
  );
}
