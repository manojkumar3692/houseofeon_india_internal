"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./PerfumeAssistant.module.css";
import { useCart } from "@/components/CartContext";
import { getProductBySlug } from "@/lib/products";
import { formatINR } from "@/lib/money";
import type { ProductCardData, ComparisonEntry, OrderStatusData } from "@/lib/assistantTools";
import type { PageType } from "@/lib/assistantContext";
import {
  captureLandingContext,
  getConciergeVariant,
  markConciergeEngaged,
} from "@/lib/assistantSession";
import {
  trackConciergeOpened,
  trackQuickActionClicked,
  trackConciergeMessageSent,
  trackRecommendationShown,
  trackProductCardClicked,
  trackComparisonStarted,
  trackAddToCartFromAI,
  trackCheckoutClickedFromAI,
  trackDeliveryChecked,
  trackOrderTrackingUsed,
  trackWhatsappHandoff,
  trackAssistantError,
} from "@/lib/analytics";

// Web Speech API isn't in TS's default DOM lib — declare just the pieces
// this component touches.
interface SpeechRecognitionResultLike {
  [index: number]: { transcript: string };
}
interface SpeechRecognitionEventLike extends Event {
  results: { [index: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  products?: ProductCardData[];
  comparison?: ComparisonEntry[];
  orderStatus?: OrderStatusData | null;
};

const MAX_SESSION_MESSAGES = 12;
const MAX_OFF_TOPIC_STREAK = 2;

const supportWhatsapp = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "";
function buildWhatsappUrl(text: string) {
  if (!supportWhatsapp) return undefined;
  return `https://wa.me/${supportWhatsapp}?text=${encodeURIComponent(text)}`;
}

const QUICK_ACTIONS: { id: string; label: string }[] = [
  { id: "find_my_scent", label: "Find My Scent" },
  { id: "compare", label: "Compare Perfumes" },
  { id: "fresh_clean", label: "Fresh & Clean" },
  { id: "warm_rich", label: "Warm & Rich" },
  { id: "office", label: "Office" },
  { id: "date_night", label: "Date Night" },
  { id: "gift", label: "Gift" },
  { id: "delivery", label: "Delivery" },
  { id: "track_order", label: "Track Order" },
];

const QUIZ_STEP_1 = ["Fresh & Clean", "Warm & Rich", "Sweet", "Woody", "Not Sure"];
const QUIZ_STEP_2 = ["Office / Everyday", "Dates / Evenings", "Functions / Weddings", "College", "All-rounder"];
const QUIZ_STEP_3 = ["Myself", "Him", "Her", "Gift"];

function getOpeningMessage(pageType: PageType, productName?: string, variant?: "A" | "B" | "C"): string {
  if (pageType === "product" && productName) {
    if (variant === "C") return `Thinking about ${productName}? Ask me before you order.`;
    return `Thinking about ${productName}? Ask me anything before you order.`;
  }
  if (pageType === "cart") {
    return "Need help before checkout? Ask me about your fragrance, delivery or payment.";
  }
  if (pageType === "scent-fix") {
    return "Got a result from the matcher? I can help you decide or answer anything before you order.";
  }
  if (variant === "C") return "Not sure which fragrance suits you? I'll help in 30 seconds.";
  return "Tell me what you like and I'll help you find your EON.";
}

function derivePageType(pathname: string): PageType {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/scent-fix")) return "scent-fix";
  if (pathname === "/cart" || pathname.startsWith("/cart")) return "cart";
  if (/^\/products\/[^/]+\/?$/.test(pathname)) return "product";
  return "other";
}

export default function PerfumeAssistant() {
  const pathname = usePathname() || "";
  const cart = useCart();

  const pageType = derivePageType(pathname);

  // Hidden during payment, in the admin console, and — for now, per
  // explicit request — on product pages and the cart page. Currently live
  // on home, /scent-fix, and everything else ("other"). Easy to widen back
  // by just removing the pageType checks below.
  const isHidden =
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/admin") ||
    pageType === "product" ||
    pageType === "cart";
  const isScentFix = pageType === "scent-fix";
  const productSlugMatch = pathname.match(/^\/products\/([^/]+)\/?$/);
  const productSlug = productSlugMatch?.[1];
  const currentProduct = productSlug ? getProductBySlug(productSlug) : undefined;

  const [variant, setVariant] = useState<"A" | "B" | "C">("B");
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [offTopicStreak, setOffTopicStreak] = useState(0);
  const [lockReason, setLockReason] = useState<"session_cap" | "off_topic_cap" | null>(null);
  const [addedNote, setAddedNote] = useState<string | null>(null);

  // Guided "Find My Scent" flow — max 3 taps, each answer collected here
  // then turned into one natural-language message sent through the same
  // pipeline as free text, so the real search_products tool (not a
  // duplicated client-side copy of the recommendation logic) does the work.
  const [quizStep, setQuizStep] = useState<0 | 1 | 2 | 3>(0);
  const [quizMood, setQuizMood] = useState<string | null>(null);
  const [quizOccasion, setQuizOccasion] = useState<string | null>(null);

  const [showNudge, setShowNudge] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    setMicSupported(Boolean(SpeechRecognitionCtor));
    setVariant(getConciergeVariant().group);
    captureLandingContext();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Proactive nudge — only on product pages, only once per session, never
  // pops the full panel open on its own.
  useEffect(() => {
    if (pageType !== "product" || isOpen || hasOpenedOnce) return;
    try {
      if (window.sessionStorage.getItem("eon_concierge_nudge_dismissed") === "1") return;
    } catch {
      // ignore
    }

    const timer = setTimeout(() => setShowNudge(true), 10000);
    return () => clearTimeout(timer);
  }, [pageType, isOpen, hasOpenedOnce]);

  if (isHidden || variant === "A") return null;

  const openingMessage = getOpeningMessage(pageType, currentProduct?.name, variant);

  function dismissNudge() {
    setShowNudge(false);
    setNudgeDismissed(true);
    try {
      window.sessionStorage.setItem("eon_concierge_nudge_dismissed", "1");
    } catch {
      // ignore
    }
  }

  function handleOpen() {
    setIsOpen(true);
    setShowNudge(false);
    if (!hasOpenedOnce) {
      setHasOpenedOnce(true);
      setMessages([{ role: "assistant", content: openingMessage }]);
      trackConciergeOpened(pageType);
    }
  }

  function handleAddToCart(productId: string, quantity: number, productName: string) {
    cart.addItem(productId, quantity);
    markConciergeEngaged([productName]);
    trackAddToCartFromAI(productName, quantity);
    trackProductCardClicked(productName, "add_to_cart");
    setAddedNote(`${productName} added to cart`);
    window.setTimeout(() => setAddedNote(null), 3500);
  }

  async function sendMessage(text: string, inputMode: "text" | "voice") {
    const trimmed = text.trim();
    if (!trimmed || isSending || lockReason) return;

    setError(null);
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInputText("");
    setIsSending(true);
    trackConciergeMessageSent(inputMode);

    const nextSentCount = sentCount + 1;
    setSentCount(nextSentCount);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })).slice(-12),
          productSlug,
          pageType,
          cartSummary: cart.lines,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.reply) {
        throw new Error(data?.error || "The concierge is temporarily unavailable.");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          products: data.products?.length ? data.products : undefined,
          comparison: data.comparison || undefined,
          orderStatus: data.orderStatus || undefined,
        },
      ]);

      if (inputMode === "voice" && typeof window !== "undefined" && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(data.reply);
        utterance.rate = 1.02;
        window.speechSynthesis.speak(utterance);
      }

      if (data.products?.length) {
        trackRecommendationShown(data.products.map((p: ProductCardData) => p.name));
        markConciergeEngaged(data.products.map((p: ProductCardData) => p.name));
      }
      if (data.comparison?.length) {
        trackComparisonStarted(data.comparison.map((c: ComparisonEntry) => c.name));
      }
      if (data.orderStatus) {
        trackOrderTrackingUsed(Boolean(data.orderStatus.found));
      }

      // Model-initiated cart adds (e.g. "add Zyrox to cart" typed in free
      // text) apply here — the button-click path applies directly via
      // handleAddToCart instead, but both end up calling the same
      // useCart().addItem, so cart state is never duplicated or faked.
      if (Array.isArray(data.clientActions)) {
        for (const action of data.clientActions) {
          if (action.type === "add_to_cart") {
            cart.addItem(action.productId, action.quantity);
            markConciergeEngaged([action.productName]);
            trackAddToCartFromAI(action.productName, action.quantity);
          }
        }
      }

      const nextOffTopicStreak = data.offTopic ? offTopicStreak + 1 : 0;
      setOffTopicStreak(nextOffTopicStreak);

      if (nextOffTopicStreak >= MAX_OFF_TOPIC_STREAK) {
        setLockReason("off_topic_cap");
        trackAssistantError("off_topic_cap_reached");
      } else if (nextSentCount >= MAX_SESSION_MESSAGES) {
        setLockReason("session_cap");
        trackAssistantError("session_cap_reached");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong — try again.";
      setError(message);
      trackAssistantError(message);
    } finally {
      setIsSending(false);
    }
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(inputText, "text");
  }

  function handleQuickAction(actionId: string) {
    trackQuickActionClicked(actionId);

    switch (actionId) {
      case "find_my_scent":
        setQuizStep(1);
        return;
      case "compare":
        sendMessage("Help me compare two House of Eon perfumes.", "text");
        return;
      case "fresh_clean":
        sendMessage("I want something fresh and clean.", "text");
        return;
      case "warm_rich":
        sendMessage("I want something warm and rich.", "text");
        return;
      case "office":
        sendMessage("I need a perfume for office wear.", "text");
        return;
      case "date_night":
        sendMessage("I need a perfume for date night.", "text");
        return;
      case "gift":
        sendMessage("I'm looking for a gift.", "text");
        return;
      case "delivery":
        trackDeliveryChecked();
        sendMessage("What's your delivery time?", "text");
        return;
      case "track_order":
        sendMessage("I want to track my order.", "text");
        return;
    }
  }

  function handleQuizAnswer(step: 1 | 2 | 3, answer: string) {
    if (step === 1) {
      setQuizMood(answer);
      setQuizStep(2);
      return;
    }
    if (step === 2) {
      setQuizOccasion(answer);
      setQuizStep(3);
      return;
    }
    if (step === 3) {
      const moodPart = quizMood && quizMood !== "Not Sure" ? quizMood.toLowerCase() : "any scent that suits me";
      const occasionPart = quizOccasion ? quizOccasion.toLowerCase() : "everyday wear";
      const forPart = answer === "Myself" ? "for myself" : answer === "Gift" ? "as a gift" : `for ${answer.toLowerCase()}`;

      setQuizStep(0);
      setQuizMood(null);
      setQuizOccasion(null);
      sendMessage(`I like ${moodPart}, mostly for ${occasionPart}, shopping ${forPart}. What do you recommend?`, "text");
    }
  }

  function toggleListening() {
    if (typeof window === "undefined") return;
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) sendMessage(transcript, "voice");
    };
    recognition.onerror = () => {
      setIsListening(false);
      setError("Couldn't hear that — try typing instead.");
    };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }

  const posClass = isScentFix ? styles.posScentFix : styles.posDefault;
  const panelPosClass = isScentFix ? styles.panelScentFix : styles.panelDefault;
  const whatsappMessage = currentProduct
    ? `Hi, I need help with ${currentProduct.name}.`
    : "Hi, I need help with my House of Eon order.";
  const whatsappUrl = buildWhatsappUrl(whatsappMessage);

  return (
    <>
      {showNudge && !isOpen && (
        <div className={`${styles.nudge} ${posClass}`}>
          <button type="button" className={styles.nudgeDismiss} onClick={dismissNudge} aria-label="Dismiss">
            ×
          </button>
          <button type="button" className={styles.nudgeText} onClick={handleOpen}>
            Not sure if this one is for you? Ask me.
          </button>
        </div>
      )}

      {!isOpen && (
        <button type="button" className={`${styles.launcher} ${posClass}`} onClick={handleOpen}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path
              d="M21 11.5a8.5 8.5 0 0 1-12.36 7.58L3 20l1.08-4.24A8.5 8.5 0 1 1 21 11.5Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Find My Scent</span>
        </button>
      )}

      {isOpen && (
        <div className={`${styles.panel} ${panelPosClass}`} role="dialog" aria-label="EON Concierge">
          <div className={styles.header}>
            <div>
              <div className={styles.headerTitle}>EON Concierge</div>
              <div className={styles.headerSub}>Scent help, comparisons, orders</div>
            </div>
            <button type="button" className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="Close">
              ×
            </button>
          </div>

          <div className={styles.messages}>
            {messages.map((message, i) => (
              <div key={i}>
                <div className={`${styles.bubbleRow} ${message.role === "user" ? styles.bubbleRowUser : ""}`}>
                  <div className={`${styles.bubble} ${message.role === "user" ? styles.bubbleUser : styles.bubbleAssistant}`}>
                    {message.content}
                  </div>
                </div>

                {message.products && message.products.length > 0 && (
                  <div className={styles.cardRow}>
                    {message.products.slice(0, 3).map((product) => (
                      <div key={product.productId} className={styles.productCard}>
                        <div className={styles.productImageWrap}>
                          <Image src={product.image} alt={product.name} fill sizes="120px" className={styles.productImage} />
                        </div>
                        <div className={styles.productName}>{product.name}</div>
                        <div className={styles.productTag}>{product.keySellingPoint}</div>
                        <div className={styles.productPrice}>{formatINR(product.price)}</div>
                        <div className={styles.productActions}>
                          <Link
                            href={product.productUrl}
                            className={styles.productViewBtn}
                            onClick={() => trackProductCardClicked(product.name, "view")}
                          >
                            View
                          </Link>
                          <button
                            type="button"
                            className={styles.productAddBtn}
                            onClick={() => handleAddToCart(product.productId, 1, product.name)}
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {message.comparison && message.comparison.length > 0 && (
                  <div className={styles.cardRow}>
                    {message.comparison.map((entry) => (
                      <div key={entry.productId} className={styles.compareCard}>
                        <div className={styles.productName}>{entry.name}</div>
                        <div className={styles.compareLine}>
                          <span>Character</span>
                          {entry.character}
                        </div>
                        <div className={styles.compareLine}>
                          <span>Best for</span>
                          {entry.bestFor}
                        </div>
                        <div className={styles.compareLine}>
                          <span>Feel</span>
                          {entry.feel}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {message.orderStatus && (
                  <div className={styles.orderCard}>
                    {message.orderStatus.found ? (
                      <>
                        <div className={styles.productName}>Order {message.orderStatus.orderNumber}</div>
                        <div className={styles.compareLine}>
                          <span>Payment</span>
                          {message.orderStatus.paymentStatus}
                        </div>
                        <div className={styles.compareLine}>
                          <span>Shipping</span>
                          {message.orderStatus.shippingStatus}
                        </div>
                        {message.orderStatus.trackingUrl && (
                          <a href={message.orderStatus.trackingUrl} target="_blank" rel="noopener noreferrer" className={styles.productViewBtn}>
                            Track Shipment
                          </a>
                        )}
                      </>
                    ) : (
                      <div className={styles.compareLine}>We couldn't find a matching order — double-check the order number and phone.</div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isSending && (
              <div className={styles.bubbleRow}>
                <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>
                  <span className={styles.typing}>
                    <span />
                    <span />
                    <span />
                  </span>
                </div>
              </div>
            )}

            {addedNote && <div className={styles.addedNote}>{addedNote} · <Link href="/cart" onClick={() => trackCheckoutClickedFromAI()}>Go to Cart</Link></div>}

            <div ref={messagesEndRef} />
          </div>

          {error && !lockReason && <div className={styles.errorNote}>{error}</div>}

          {lockReason && (
            <div className={styles.errorNote}>
              {lockReason === "off_topic_cap"
                ? "This chat is just for House of Eon fragrance help. For anything else, our team's happy to talk on WhatsApp:"
                : "That's a lot of questions! Let's continue on WhatsApp so our team can help directly:"}{" "}
              {whatsappUrl ? (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsappHandoff(lockReason)}>
                  Chat on WhatsApp
                </a>
              ) : (
                "Reach us via the WhatsApp link on the site."
              )}
            </div>
          )}

          {quizStep > 0 && !lockReason && (
            <div className={styles.quizBox}>
              <div className={styles.quizQuestion}>
                {quizStep === 1 && "What kind of fragrance do you usually enjoy?"}
                {quizStep === 2 && "Where will you wear it most?"}
                {quizStep === 3 && "Who are you shopping for?"}
              </div>
              <div className={styles.suggestRow}>
                {(quizStep === 1 ? QUIZ_STEP_1 : quizStep === 2 ? QUIZ_STEP_2 : QUIZ_STEP_3).map((option) => (
                  <button key={option} type="button" className={styles.suggestChip} onClick={() => handleQuizAnswer(quizStep as 1 | 2 | 3, option)}>
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!lockReason && quizStep === 0 && messages.length <= 1 && (
            <div className={styles.suggestRow}>
              {QUICK_ACTIONS.map((action) => (
                <button key={action.id} type="button" className={styles.suggestChip} onClick={() => handleQuickAction(action.id)}>
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {isListening && <div className={styles.listeningNote}>Listening… speak now</div>}

          <form className={styles.footer} onSubmit={handleTextSubmit}>
            {micSupported && (
              <button
                type="button"
                className={`${styles.iconBtn} ${isListening ? styles.iconBtnActive : ""}`}
                onClick={toggleListening}
                disabled={Boolean(lockReason)}
                aria-label={isListening ? "Stop listening" : "Ask by voice"}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 11a7 7 0 0 1-14 0M12 18v3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}

            <input
              type="text"
              className={styles.input}
              placeholder={lockReason ? "Chat continues on WhatsApp" : "Ask about scents, sizing, delivery…"}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isSending || Boolean(lockReason)}
            />

            <button type="submit" className={styles.sendBtn} disabled={isSending || !inputText.trim() || Boolean(lockReason)} aria-label="Send message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.whatsappHandoff}
              onClick={() => trackWhatsappHandoff("manual")}
            >
              Need help from us? Chat on WhatsApp
            </a>
          )}
        </div>
      )}
    </>
  );
}
