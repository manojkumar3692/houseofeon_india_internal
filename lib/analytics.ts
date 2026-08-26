import { hashEmailForMeta, hashPhoneForMeta } from "@/lib/checkoutSession";
import {
  getConciergeSessionId,
  captureLandingContext,
  getConciergeVariant,
} from "@/lib/assistantSession";

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Extra safety net specifically for the Purchase event: even if this page
// somehow loads on the production hostname (e.g. a staging deploy that
// shares the real domain), don't report a Purchase unless Razorpay is
// actually configured in live mode. Test-mode payments never move real
// money and shouldn't count as conversions.
const IS_RAZORPAY_LIVE_MODE = (
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ""
).startsWith("rzp_live_");

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

// Fires once per checkout session, the moment a phone number is captured —
// well before the customer finishes the form or pays. This is the earliest
// point an anonymous browser becomes an identifiable person, so it's the
// most valuable single event for retargeting: it lets Meta build a "showed
// real intent" audience (and later show a dynamic ad for the exact product
// in their cart) even for people who never reach Purchase.
//
// Re-initializing the pixel with hashed contact info (Advanced Matching)
// updates the customer-matching data Meta uses for this and all subsequent
// events in the session — best-effort, since a hashing failure should never
// block the rest of checkout.
export async function trackCheckoutLead({
  name,
  phone,
  email,
  items,
  value,
}: {
  name?: string;
  phone?: string;
  email?: string;
  items: AnalyticsItem[];
  value: number;
}) {
  if (typeof window === "undefined") return;

  if (window.fbq && META_PIXEL_ID && (phone || email)) {
    try {
      const advancedMatching: Record<string, string> = {};
      if (email) advancedMatching.em = await hashEmailForMeta(email);
      if (phone) advancedMatching.ph = await hashPhoneForMeta(phone);
      window.fbq("init", META_PIXEL_ID, advancedMatching);
    } catch {
      // Silent — the Lead event below still fires without Advanced Matching.
    }
  }

  trackGAEvent("generate_lead", {
    currency: "INR",
    value,
    items,
  });

  trackMetaEvent("Lead", {
    currency: "INR",
    value,
    content_type: "product",
    content_ids: items.map((item) => item.item_id),
    contents: items.map((item) => ({
      id: item.item_id,
      quantity: item.quantity || 1,
      item_price: item.price,
    })),
  });
}

// Standard "reached the payment step" event — fired when the customer
// clicks Pay, before the Razorpay modal opens. Using the standard
// AddPaymentInfo / add_payment_info event names (rather than a one-off
// custom event) means both platforms' own funnel/optimization tooling
// understands it, and it gives you a clean "reached payment but never
// purchased" audience for retargeting.
export function trackAddPaymentInfo({
  items,
  value,
  paymentMethod,
}: {
  items: AnalyticsItem[];
  value: number;
  paymentMethod: string;
}) {
  trackGAEvent("add_payment_info", {
    currency: "INR",
    value,
    payment_type: paymentMethod,
    items,
  });

  trackMetaEvent("AddPaymentInfo", {
    currency: "INR",
    value,
    content_type: "product",
    content_ids: items.map((item) => item.item_id),
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
  const safeValue = Number(value);

  if (!Number.isFinite(safeValue) || safeValue <= 0) {
    console.warn("Purchase event skipped because value is invalid:", value);
    return;
  }

  if (!IS_RAZORPAY_LIVE_MODE) {
    console.warn(
      "Purchase event skipped because Razorpay is not in live mode:",
      orderId
    );
    return;
  }

  trackGAEvent("purchase", {
    transaction_id: orderId,
    currency: "INR",
    value: safeValue,
    items,
  });

  trackMetaEvent("Purchase", {
    currency: "INR",
    value: safeValue,
    content_type: "product",

    content_ids: items.map((item) => item.item_id),
    content_name: items.map((item) => item.item_name).join(", "),

    contents: items.map((item) => ({
      id: item.item_id,
      quantity: item.quantity || 1,
      item_price: item.price,
    })),

    num_items: items.reduce(
      (sum, item) => sum + (item.quantity || 1),
      0
    ),

    order_id: orderId,
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

// trackQuizStarted / trackQuizCompleted / trackQuizLeadCaptured were the
// /scent-finder quiz's events — removed along with that route. /scent-fix
// uses trackScentFixViewContent / trackScentFixCompleted (further below)
// plus the existing trackAddToCart.

export function trackSwipeGameStarted() {
  trackGAEvent("swipe_game_started");
  trackMetaEvent("CustomEvent", { event_name: "SwipeGameStarted" });
}

export function trackSwipeGameCompleted(productId: string, productName: string) {
  trackGAEvent("swipe_game_completed", {
    item_id: productId,
    item_name: productName,
  });

  trackMetaEvent("CustomEvent", {
    event_name: "SwipeGameCompleted",
    content_ids: [productId],
    content_name: productName,
  });
}

export function trackSwipeLeadCaptured() {
  trackGAEvent("generate_lead", { source: "swipe_game" });
  trackMetaEvent("Lead");
}

export function trackSwipeShared() {
  trackGAEvent("swipe_game_shared");
  trackMetaEvent("CustomEvent", { event_name: "SwipeGameShared" });
}

// /scent-fix — the Meta-ad landing page. Exactly the 3 events the ad
// account cares about: a real ViewContent on load (so Meta's optimization
// sees this as a genuine landing page view, not just a generic PageView),
// a Lead the moment the diagnostic produces a scored match (this is the
// real "did the ad's promise land" signal — it fires whether or not they
// ever hand over a phone number), and AddToCart is just the existing
// trackAddToCart() reused as-is on the CTA.
export function trackScentFixViewContent() {
  trackGAEvent("view_item", { content_name: "Scent Fix" });
  trackMetaEvent("ViewContent", {
    content_name: "Scent Fix",
    content_category: "landing_page",
  });
}

export function trackScentFixCompleted(productId: string, productName: string) {
  trackGAEvent("generate_lead", {
    source: "scent-fix",
    item_id: productId,
    item_name: productName,
  });

  trackMetaEvent("Lead", {
    content_name: "Scent Fix Result",
    content_ids: [productId],
    contents: [{ id: productId, quantity: 1 }],
  });
}

// -----------------------------------------------------------------------
// Full-funnel depth tracking for /scent-fix. The page is built around a
// specific psychological sequence (ad curiosity -> problem -> why it
// happens -> ingredient difference -> where the money goes -> value
// reframe -> personal identity -> recommendation -> social proof -> risk
// reduction -> delivery -> purchase) — these events let that sequence show
// up as an actual funnel in GA/Ads Manager instead of just "landed" vs
// "converted", so a high-traffic-low-conversion problem can be traced to
// the specific section people stop at.
//
// One shared custom event (ScentFixSectionView) parameterized by section,
// rather than 11 differently-named events — easier to build one funnel
// report from than to hunt through 11 separate event names in Ads Manager.
// -----------------------------------------------------------------------
export function trackScentFixSectionView(sectionId: string, sectionIndex: number) {
  trackGAEvent("scent_fix_section_view", {
    section_id: sectionId,
    section_index: sectionIndex,
  });

  trackMetaEvent("CustomEvent", {
    event_name: "ScentFixSectionView",
    section_id: sectionId,
    section_index: sectionIndex,
  });
}

// The "personal identity" tap in Section 8 — which of the 4 feelings a
// visitor picked. This is the single most useful marketing signal on the
// whole page: it tells you which emotional angle (fresh/confident/warm/
// elegant) is actually pulling people in, independent of which product
// they end up buying.
export function trackScentFixFeelingSelected(
  feelingId: string,
  feelingLabel: string
) {
  trackGAEvent("select_content", {
    content_type: "scent_fix_feeling",
    item_id: feelingId,
    item_name: feelingLabel,
  });

  trackMetaEvent("CustomEvent", {
    event_name: "ScentFixFeelingSelected",
    feeling_id: feelingId,
    feeling_label: feelingLabel,
  });
}

// Cycling to the alternate product within a feeling — a soft "not quite,
// show me the next best thing" signal distinct from picking a feeling.
export function trackScentFixShowAnother(productId: string, productName: string) {
  trackGAEvent("scent_fix_show_another", {
    item_id: productId,
    item_name: productName,
  });

  trackMetaEvent("CustomEvent", {
    event_name: "ScentFixShowAnother",
    content_ids: [productId],
    content_name: productName,
  });
}

// Every non-purchase CTA click on the page (Section 1's "Show me why",
// Section 6's "Find my fragrance", the sticky bar, Final's primary/
// secondary) — one shared event parameterized by which button, so the
// funnel report can show exactly which nudge actually moves people.
export function trackScentFixCtaClick(ctaId: string) {
  trackGAEvent("scent_fix_cta_click", { cta_id: ctaId });
  trackMetaEvent("CustomEvent", { event_name: "ScentFixCtaClick", cta_id: ctaId });
}

// -----------------------------------------------------------------------
// EON Concierge (components/PerfumeAssistant.tsx) — full funnel so it's
// possible to answer the actual question that matters: do visitors who
// interact with the concierge convert better than ones who don't. Every
// call carries session_id + landing UTM + concierge A/B group as common
// params (see withConciergeParams) so a GA/Meta report can slice by any of
// those without a server-side join.
// -----------------------------------------------------------------------
function withConciergeParams(params?: Record<string, any>) {
  const landing = captureLandingContext();
  const variant = getConciergeVariant();

  return {
    session_id: getConciergeSessionId(),
    variant: variant.group,
    utm_source: landing.utmSource,
    utm_campaign: landing.utmCampaign,
    utm_content: landing.utmContent,
    ...params,
  };
}

export function trackConciergeOpened(context: "home" | "product" | "cart" | "scent-fix" | "other") {
  trackGAEvent("concierge_opened", withConciergeParams({ context }));
  trackMetaEvent("CustomEvent", { event_name: "ConciergeOpened", context });
}

export function trackQuickActionClicked(actionId: string) {
  trackGAEvent("quick_action_clicked", withConciergeParams({ action_id: actionId }));
}

export function trackConciergeMessageSent(inputMode: "text" | "voice") {
  trackGAEvent("message_sent", withConciergeParams({ input_mode: inputMode }));
}

export function trackRecommendationShown(productNames: string[]) {
  trackGAEvent(
    "recommendation_shown",
    withConciergeParams({ products: productNames.join(", ") })
  );
}

export function trackProductCardClicked(productName: string, action: "view" | "add_to_cart") {
  trackGAEvent(
    "product_card_clicked",
    withConciergeParams({ product_name: productName, action })
  );
}

export function trackComparisonStarted(productNames: string[]) {
  trackGAEvent(
    "comparison_started",
    withConciergeParams({ products: productNames.join(", ") })
  );
}

export function trackAddToCartFromAI(productName: string, quantity: number) {
  trackGAEvent(
    "add_to_cart_from_ai",
    withConciergeParams({ product_name: productName, quantity })
  );
  trackMetaEvent("CustomEvent", { event_name: "AddToCartFromAI", product_name: productName });
}

export function trackCheckoutClickedFromAI() {
  trackGAEvent("checkout_clicked_from_ai", withConciergeParams());
  trackMetaEvent("CustomEvent", { event_name: "CheckoutClickedFromAI" });
}

export function trackDeliveryChecked() {
  trackGAEvent("delivery_checked", withConciergeParams());
}

export function trackOrderTrackingUsed(found: boolean) {
  trackGAEvent("order_tracking_used", withConciergeParams({ found }));
}

export function trackWhatsappHandoff(reason: string) {
  trackGAEvent("whatsapp_handoff", withConciergeParams({ reason }));
  trackMetaEvent("CustomEvent", { event_name: "ConciergeWhatsappHandoff", reason });
}

// Called from app/checkout/page.tsx right alongside the real trackPurchase
// call, only when this browser session had an earlier concierge
// interaction (see lib/assistantSession.ts markConciergeEngaged /
// getConciergeEngagement) — this is the metric that actually answers
// "does the concierge improve conversion."
export function trackPurchaseAfterConcierge(productNames: string[], orderValue: number) {
  trackGAEvent(
    "purchase_after_ai_interaction",
    withConciergeParams({ products: productNames.join(", "), value: orderValue })
  );
}

export function trackAssistantError(reason: string) {
  trackGAEvent("assistant_error", withConciergeParams({ reason }));
}

// Trial Pack funnel (₹249, pick-3, see lib/trialPack.ts / lib/trialCredit.ts).
// Purchase itself still goes through the regular trackBeginCheckout /
// trackAddPaymentInfo / trackPurchase calls (generic GA4/Meta ecommerce
// events, order-type-agnostic) — these four are the funnel-specific markers
// layered on top so the trial pack can be analyzed as its own journey.
export function trackTrialPackViewed() {
  trackGAEvent("trial_pack_viewed");
  trackMetaEvent("CustomEvent", { event_name: "TrialPackViewed" });
}

export function trackTrialScentSelected(productName: string, position: number) {
  trackGAEvent("trial_scent_selected", { product_name: productName, position });
}

export function trackTrialPackPurchased(orderId: string, scentNames: string[]) {
  trackGAEvent("trial_pack_purchased", {
    order_id: orderId,
    scents: scentNames.join(", "),
  });
  trackMetaEvent("CustomEvent", {
    event_name: "TrialPackPurchased",
    order_id: orderId,
  });
}

// Fired from app/checkout/page.tsx when a trial-pack order number is
// successfully applied as a ₹249 credit on a later full-size order.
export function trackTrialCreditRedeemed(trialOrderNumber: string) {
  trackGAEvent("trial_credit_redeemed", { trial_order_number: trialOrderNumber });
}

// Checkout abandonment rescue (see components/TrialPackRescue.tsx). `trigger`
// identifies which signal fired it — "razorpay_dismissed" / "payment_failed"
// (universal, mobile+desktop), "exit_intent" (desktop mouseleave), or
// "idle_timeout" / "tab_returned" (heuristic) — so we can see in GA which
// triggers actually convert vs. just annoy people, and drop the weaker ones
// later without guessing.
export function trackTrialRescueShown(trigger: string) {
  trackGAEvent("trial_rescue_shown", { trigger });
}

export function trackTrialRescueClicked(trigger: string) {
  trackGAEvent("trial_rescue_clicked", { trigger });
  trackMetaEvent("CustomEvent", { event_name: "TrialRescueClicked", trigger });
}

export function trackTrialRescueDismissed(trigger: string) {
  trackGAEvent("trial_rescue_dismissed", { trigger });
}

// The small, deliberately-subordinate trial-pack block on the product
// detail page (below the normal Buy Now / Add to Cart, never competing with
// them) — kept separate from the checkout rescue events above so PDP entry
// and checkout-abandonment entry can be compared, not conflated.
export function trackTrialPackPdpClicked(productId: string, productName: string) {
  trackGAEvent("trial_pack_pdp_clicked", { product_id: productId, product_name: productName });
}

// The bold 4-step "Try our fragrances, risk free" banner (see
// components/TrialPackBanner.tsx) — `source` is "homepage" or
// "pdp_lower_section" so we can tell the quiet PDP text link, the homepage
// strip, and this bigger banner apart in the funnel data.
export function trackTrialBannerClicked(source: string) {
  trackGAEvent("trial_banner_clicked", { source });
}