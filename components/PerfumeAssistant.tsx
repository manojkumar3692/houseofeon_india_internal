"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./PerfumeAssistant.module.css";
import {
  trackAssistantOpened,
  trackAssistantMessageSent,
  trackAssistantError,
} from "@/lib/analytics";

// Web Speech API isn't in TS's default DOM lib, and shape differs slightly
// between the standard and webkit-prefixed versions — declare just the
// pieces this component actually touches rather than pulling in a full
// third-party type package (npm installs are blocked in this environment
// anyway).
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

type ChatMessage = { role: "user" | "assistant"; content: string };

const OPENING_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm the House of Eon assistant. Ask me about scents, longevity, pricing, or delivery — by typing or tapping the mic to talk.",
};

const SUGGESTIONS = [
  "Which scent suits a first date?",
  "How long does it actually last?",
  "What makes this different from a ₹3,000 perfume?",
];

// Two independent circuit breakers to keep token spend bounded, on top of
// the server's per-IP rate limit: a hard cap on total messages in one
// widget session (covers someone chatting endlessly, on-topic or not), and
// a lower cap on *consecutive* off-topic replies (covers someone using it
// as a free general chatbot). Either one trips the same lockout — further
// messages don't call OpenAI at all, they just get pointed to WhatsApp.
const MAX_SESSION_MESSAGES = 12;
const MAX_OFF_TOPIC_STREAK = 2;

const supportWhatsapp = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "";
const whatsappUrl = supportWhatsapp
  ? `https://wa.me/${supportWhatsapp}`
  : undefined;

export default function PerfumeAssistant() {
  const pathname = usePathname() || "";

  const isScentFix = pathname.startsWith("/scent-fix");
  const productSlugMatch = pathname.match(/^\/products\/([^/]+)\/?$/);
  const isProductPage = Boolean(productSlugMatch);
  const productSlug = productSlugMatch?.[1];

  // Widget only makes sense on /scent-fix and individual product pages —
  // everywhere else it self-gates to nothing, matching how Header/Footer
  // already hide themselves on routes that don't want them.
  const isEligiblePage = isScentFix || isProductPage;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([OPENING_MESSAGE]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [offTopicStreak, setOffTopicStreak] = useState(0);
  const [lockReason, setLockReason] = useState<"session_cap" | "off_topic_cap" | null>(
    null
  );

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const lastInputWasVoiceRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setMicSupported(Boolean(SpeechRecognitionCtor));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  if (!isEligiblePage) return null;

  function handleOpen() {
    setIsOpen(true);
    if (!hasOpenedOnce) {
      setHasOpenedOnce(true);
      trackAssistantOpened(isScentFix ? "scent-fix" : "product");
    }
  }

  async function sendMessage(text: string, inputMode: "text" | "voice") {
    const trimmed = text.trim();
    if (!trimmed || isSending || lockReason) return;

    setError(null);
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInputText("");
    setIsSending(true);
    trackAssistantMessageSent(inputMode);

    const nextSentCount = sentCount + 1;
    setSentCount(nextSentCount);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.slice(-12),
          productSlug,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.reply) {
        throw new Error(data?.error || "The assistant is temporarily unavailable.");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);

      // Only speak the reply aloud if the customer actually used voice —
      // someone typing quietly next to a sleeping baby doesn't want their
      // phone talking back at them.
      if (inputMode === "voice" && typeof window !== "undefined" && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(data.reply);
        utterance.rate = 1.02;
        window.speechSynthesis.speak(utterance);
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
      const message =
        err instanceof Error ? err.message : "Something went wrong — try again.";
      setError(message);
      trackAssistantError(message);
    } finally {
      setIsSending(false);
    }
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    lastInputWasVoiceRef.current = false;
    sendMessage(inputText, "text");
  }

  function toggleListening() {
    if (typeof window === "undefined") return;
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
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
      if (transcript) {
        lastInputWasVoiceRef.current = true;
        sendMessage(transcript, "voice");
      }
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

  const posClass = isScentFix ? styles.posScentFix : styles.posProduct;
  const panelPosClass = isScentFix ? styles.panelScentFix : styles.panelProduct;

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          className={`${styles.launcher} ${posClass}`}
          onClick={handleOpen}
          aria-label="Open perfume assistant"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              d="M21 11.5a8.5 8.5 0 0 1-12.36 7.58L3 20l1.08-4.24A8.5 8.5 0 1 1 21 11.5Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className={`${styles.panel} ${panelPosClass}`} role="dialog" aria-label="House of Eon assistant">
          <div className={styles.header}>
            <div>
              <div className={styles.headerTitle}>House of Eon Assistant</div>
              <div className={styles.headerSub}>Scent help, sizing, delivery — ask away</div>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setIsOpen(false)}
              aria-label="Close assistant"
            >
              ×
            </button>
          </div>

          <div className={styles.messages}>
            {messages.map((message, i) => (
              <div
                key={i}
                className={`${styles.bubbleRow} ${
                  message.role === "user" ? styles.bubbleRowUser : ""
                }`}
              >
                <div
                  className={`${styles.bubble} ${
                    message.role === "user" ? styles.bubbleUser : styles.bubbleAssistant
                  }`}
                >
                  {message.content}
                </div>
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

            <div ref={messagesEndRef} />
          </div>

          {error && !lockReason && <div className={styles.errorNote}>{error}</div>}

          {lockReason && (
            <div className={styles.errorNote}>
              {lockReason === "off_topic_cap"
                ? "This chat is just for House of Eon fragrance help. For anything else, our team's happy to talk on WhatsApp:"
                : "That's a lot of questions! Let's continue on WhatsApp so our team can help directly:"}{" "}
              {whatsappUrl ? (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  Chat on WhatsApp
                </a>
              ) : (
                "Reach us via the WhatsApp link on the site."
              )}
            </div>
          )}

          {!lockReason && messages.length === 1 && (
            <div className={styles.suggestRow}>
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className={styles.suggestChip}
                  onClick={() => sendMessage(suggestion, "text")}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {isListening && (
            <div className={styles.listeningNote}>Listening… speak now</div>
          )}

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
                  <path
                    d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M19 11a7 7 0 0 1-14 0M12 18v3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}

            <input
              type="text"
              className={styles.input}
              placeholder={
                lockReason ? "Chat continues on WhatsApp" : "Ask about scents, sizing, delivery…"
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isSending || Boolean(lockReason)}
            />

            <button
              type="submit"
              className={styles.sendBtn}
              disabled={isSending || !inputText.trim() || Boolean(lockReason)}
              aria-label="Send message"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
