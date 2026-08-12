"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { formatINR } from "@/lib/money";
import { BASE_PRICE_INR, EON20_DISCOUNTED_PRICE_INR } from "@/lib/pricing";
import {
  trackAddToCart,
  trackScentFixCompleted,
  trackScentFixViewContent,
} from "@/lib/analytics";
import {
  OIL_CONCENTRATION_BADGE,
  Q2_OPTIONS,
  Q3_OPTIONS,
  Q4_OPTIONS,
  ScentFixAnswers,
  ScentFixResult,
  TECHNIQUE_TIPS,
  WHY_WE_LAST_LONGER,
  buildSharedResult,
  getScentFixResult,
  initialScentFixAnswers,
} from "@/lib/scentFix";
import styles from "./scent-fix.module.css";

const TOTAL_STEPS = 4;

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function scrollToRef(ref: React.RefObject<HTMLElement | null>) {
  ref.current?.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "start",
  });
}

export default function ScentFixExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addItem } = useCart();

  const diagnosticRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<ScentFixAnswers>(initialScentFixAnswers);
  const [result, setResult] = useState<ScentFixResult | null>(null);
  const [hasTakenQuiz, setHasTakenQuiz] = useState(false);

  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [captureSkipped, setCaptureSkipped] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const viewContentFiredRef = useRef(false);
  const sharedResultCheckedRef = useRef(false);

  // ViewContent fires once, on load — the real "this landing page was seen"
  // signal for Meta's optimization, distinct from the sitewide PageView.
  useEffect(() => {
    if (viewContentFiredRef.current) return;
    viewContentFiredRef.current = true;
    trackScentFixViewContent();
  }, []);

  // A ?result=<product-id> link (someone sharing their match) shows the
  // result immediately — no quiz required to see it.
  useEffect(() => {
    if (sharedResultCheckedRef.current) return;
    sharedResultCheckedRef.current = true;

    const shared = buildSharedResult(searchParams.get("result"));
    if (shared) setResult(shared);
  }, [searchParams]);

  // The sitewide body background is cream (see globals.css) — this page
  // is meant to be a real dark-mode experience, not a dark card floating
  // on a light page, so the body itself is painted near-black for as
  // long as this route is mounted (covers iOS elastic-overscroll bounce
  // at the top/bottom edges, which would otherwise flash cream).
  useEffect(() => {
    const previousBackground = document.body.style.background;
    document.body.style.background = "#0b0403";
    return () => {
      document.body.style.background = previousBackground;
    };
  }, []);

  function updateUrlForResult(productId: string) {
    const params = new URLSearchParams(window.location.search);
    params.set("result", productId);
    router.replace(`/scent-fix?${params.toString()}`, { scroll: false });
  }

  function finishQuiz(finalAnswers: ScentFixAnswers) {
    const computed = getScentFixResult(finalAnswers);
    setResult(computed);
    setHasTakenQuiz(true);
    trackScentFixCompleted(computed.product.id, computed.product.name);
    updateUrlForResult(computed.product.id);

    window.setTimeout(() => scrollToRef(resultRef), 80);
  }

  function advanceOrFinish(nextAnswers: ScentFixAnswers) {
    if (stepIndex < TOTAL_STEPS - 1) {
      setStepIndex((current) => current + 1);
      return;
    }
    finishQuiz(nextAnswers);
  }

  function submitQ1Text() {
    if (!answers.q1Text.trim()) return;
    advanceOrFinish(answers);
  }

  function skipQ1() {
    advanceOrFinish(answers);
  }

  function selectQ2(value: (typeof Q2_OPTIONS)[number]["id"]) {
    const next = { ...answers, q2: value };
    setAnswers(next);
    advanceOrFinish(next);
  }

  function selectQ3(value: (typeof Q3_OPTIONS)[number]["id"]) {
    const next = { ...answers, q3: value };
    setAnswers(next);
    advanceOrFinish(next);
  }

  function selectQ4(value: (typeof Q4_OPTIONS)[number]["id"]) {
    const next = { ...answers, q4: value };
    setAnswers(next);
    advanceOrFinish(next);
  }

  function goBack() {
    setStepIndex((current) => Math.max(0, current - 1));
  }

  function retake() {
    setAnswers(initialScentFixAnswers);
    setStepIndex(0);
    setResult(null);
    setHasTakenQuiz(false);
    window.setTimeout(() => scrollToRef(diagnosticRef), 80);
  }

  function handleAddToCart() {
    if (!result) return;

    addItem(result.product.id, 1);
    trackAddToCart({
      id: result.product.id,
      name: result.product.name,
      price: EON20_DISCOUNTED_PRICE_INR,
      quantity: 1,
    });
    router.push("/checkout");
  }

  async function handleShare() {
    if (!result) return;

    const shareUrl = `${window.location.origin}/scent-fix?result=${result.product.id}`;
    const shareText = `That ₹3,000 bottle didn't fail — my skin did. My House of Eon match is ${result.product.name}. Check yours 👇`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "My Scent Fix match", text: shareText, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2200);
    } catch {
      // Share sheet dismissed — nothing to surface.
    }
  }

  async function submitCapture(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError("");

    const digits = phone.replace(/[^0-9]/g, "");
    if (digits.length < 10) {
      setSubmitError("Enter a valid phone number.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/quiz-leads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          genderAnswer: answers.q4 || "",
          occasionAnswer: answers.q2 || "",
          moodAnswer: [answers.q1Text, answers.q3].filter(Boolean).join(" / "),
          recommendedProductId: result?.product.id || "",
          recommendedProductName: result?.product.name || "",
          couponCode: "EON20",
          source: "scent-fix",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save your number");

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const showBeforeLunchCallout = hasTakenQuiz && answers.q2 === "before-lunch";

  return (
    <div className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />

      {/* ============ SECTION 1 — THE PAYOFF ============ */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.heroEyebrow}>House of Eon &middot; Scent Fix</span>

          <h1 className={`${styles.display} ${styles.heroTitle}`}>
            <span className={styles.emberWrap}>
              Indian heat
              <span className={styles.emberSpark} style={{ left: "8%", animationDelay: "0s" }} />
              <span className={styles.emberSpark} style={{ left: "42%", animationDelay: "1.1s" }} />
              <span className={styles.emberSpark} style={{ left: "76%", animationDelay: "2.2s" }} />
            </span>{" "}
            kills weak perfume. <em>Ours isn&apos;t weak.</em>
          </h1>

          <div className={styles.heroBlocks}>
            {WHY_WE_LAST_LONGER.map((item, index) => (
              <div className={styles.heroBlock} key={item.title}>
                <span className={styles.heroBlockNum}>
                  0{index + 1}
                </span>
                <p>
                  <strong>{item.title}.</strong> {item.text}
                </p>
              </div>
            ))}
          </div>

          <p className={styles.bridge}>
            Same heat. Same skin. A perfume actually built to survive it.
          </p>

          <button
            type="button"
            className={styles.scrollCue}
            onClick={() => scrollToRef(diagnosticRef)}
          >
            Check yours — 30 seconds
            <span className={styles.scrollCueArrow} aria-hidden="true">
              ↓
            </span>
          </button>
        </div>
      </section>

      {/* ============ SECTION 2 — THE DIAGNOSTIC ============ */}
      <section className={styles.diagnostic} ref={diagnosticRef}>
        <div className={styles.container}>
          <div className={styles.diagCard}>
            <div className={styles.progressRow}>
              {stepIndex > 0 ? (
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={goBack}
                  aria-label="Previous question"
                >
                  ← Back
                </button>
              ) : (
                <span />
              )}

              <span className={styles.progressLabel}>
                {Math.min(stepIndex + 1, TOTAL_STEPS)} / {TOTAL_STEPS}
              </span>
            </div>

            <div
              className={styles.progressBar}
              role="progressbar"
              aria-valuenow={stepIndex + 1}
              aria-valuemin={1}
              aria-valuemax={TOTAL_STEPS}
            >
              <div
                className={styles.progressFill}
                style={{ width: `${((stepIndex + 1) / TOTAL_STEPS) * 100}%` }}
              />
            </div>

            {stepIndex === 0 ? (
              <div className={styles.qBody}>
                <h2 className={styles.questionTitle}>
                  Name a perfume you actually loved.
                </h2>

                <input
                  className={styles.textInput}
                  type="text"
                  placeholder="Type a perfume name…"
                  value={answers.q1Text}
                  onChange={(e) =>
                    setAnswers((current) => ({
                      ...current,
                      q1Text: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitQ1Text();
                  }}
                  aria-label="Name a perfume you actually loved"
                />

                <div className={styles.qFooter}>
                  <button
                    type="button"
                    className={styles.continueBtn}
                    disabled={!answers.q1Text.trim()}
                    onClick={submitQ1Text}
                  >
                    Continue →
                  </button>

                  <button
                    type="button"
                    className={styles.skipLink}
                    onClick={skipQ1}
                  >
                    Not sure — skip this
                  </button>
                </div>
              </div>
            ) : null}

            {stepIndex === 1 ? (
              <div className={styles.qBody}>
                <h2 className={styles.questionTitle}>
                  When does your current perfume die?
                </h2>

                <div className={styles.optionsStack}>
                  {Q2_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={styles.optionBtn}
                      onClick={() => selectQ2(option.id)}
                    >
                      {option.label}
                      <span className={styles.optionArrow} aria-hidden="true">
                        →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {stepIndex === 2 ? (
              <div className={styles.qBody}>
                <h2 className={styles.questionTitle}>Who notices it?</h2>

                <div className={styles.optionsStack}>
                  {Q3_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={styles.optionBtn}
                      onClick={() => selectQ3(option.id)}
                    >
                      {option.label}
                      <span className={styles.optionArrow} aria-hidden="true">
                        →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {stepIndex === 3 ? (
              <div className={styles.qBody}>
                <h2 className={styles.questionTitle}>Shopping for?</h2>

                <div className={styles.optionsStack}>
                  {Q4_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={styles.optionBtn}
                      onClick={() => selectQ4(option.id)}
                    >
                      {option.label}
                      <span className={styles.optionArrow} aria-hidden="true">
                        →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ============ SECTION 3 — THE RESULT ============ */}
      {result ? (
        <section className={styles.result} ref={resultRef}>
          <div className={styles.container}>
            <span className={styles.resultEyebrow}>Your match</span>

            <div className={styles.resultCard}>
              <div className={styles.resultTop}>
                <div className={styles.resultImage}>
                  <Image
                    src={result.product.image}
                    alt={`${result.product.name} perfume by House of Eon`}
                    width={96}
                    height={96}
                  />
                </div>

                <div>
                  <h3 className={`${styles.display} ${styles.resultName}`}>
                    {result.product.name}
                  </h3>
                  <div className={styles.resultMeta}>
                    {result.product.size} · {result.product.concentration}
                  </div>
                  <div className={styles.resultPriceRow}>
                    <span className={styles.resultPrice}>
                      {formatINR(EON20_DISCOUNTED_PRICE_INR)}
                    </span>
                    <span className={styles.resultMrp}>
                      {formatINR(BASE_PRICE_INR)}
                    </span>
                  </div>
                </div>
              </div>

              <p className={styles.whyLine}>{result.whyLine}</p>

              <div className={styles.factRow}>
                <span className={styles.longevityLine}>
                  ⏱ 6-8 hours on skin. Longer on fabric.
                </span>
                <span className={styles.longevityLine}>
                  🧪 {OIL_CONCENTRATION_BADGE}
                </span>
              </div>

              {showBeforeLunchCallout ? (
                <div className={styles.callout}>
                  You spent ₹3,000 on something that quit at 11. This is{" "}
                  {formatINR(EON20_DISCOUNTED_PRICE_INR)}.
                </div>
              ) : null}

              <div className={styles.tipsTitle}>
                Do this today — even before you buy
              </div>

              <div className={styles.tipsList}>
                {TECHNIQUE_TIPS.map((tip) => (
                  <div className={styles.tipRow} key={tip.title}>
                    <span className={styles.tipCheck} aria-hidden="true">
                      ✓
                    </span>
                    <div>
                      <b>{tip.title}</b>
                      <span>{tip.text}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.ctaRow}>
                <button
                  type="button"
                  className={styles.primaryCta}
                  onClick={handleAddToCart}
                >
                  Add to cart — {formatINR(EON20_DISCOUNTED_PRICE_INR)}
                </button>

                <Link href="/products" className={styles.secondaryCta}>
                  See all 6
                </Link>
              </div>

              <button
                type="button"
                className={styles.shareLink}
                onClick={handleShare}
              >
                {shareCopied ? "Link copied ✓" : "Share your match ↗"}
              </button>

              {!hasTakenQuiz ? (
                <button
                  type="button"
                  className={styles.shareLink}
                  onClick={retake}
                >
                  Not you? Take the 30-second diagnostic ↑
                </button>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* ============ SECTION 4 — CAPTURE ============ */}
      {result && !captureSkipped ? (
        <section className={styles.capture}>
          <div className={styles.container}>
            <div className={styles.captureCard}>
              {!submitted ? (
                <>
                  <p className={styles.captureTitle}>
                    Want the full Indian-summer longevity guide + your 20%
                    code?
                  </p>
                  <p className={styles.captureSub}>
                    Sent straight to your WhatsApp. No spam.
                  </p>

                  <form className={styles.captureForm} onSubmit={submitCapture}>
                    <input
                      className={styles.captureInput}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="WhatsApp number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      aria-label="WhatsApp number"
                    />
                    <button
                      type="submit"
                      className={styles.captureSubmit}
                      disabled={submitting}
                    >
                      {submitting ? "Sending…" : "Send it"}
                    </button>
                  </form>

                  {submitError ? (
                    <div className={styles.captureError}>{submitError}</div>
                  ) : null}

                  <button
                    type="button"
                    className={styles.captureSkip}
                    onClick={() => setCaptureSkipped(true)}
                  >
                    Not right now
                  </button>
                </>
              ) : (
                <div className={styles.captureSuccess}>
                  Sent! Look out for a message on WhatsApp.
                  <span>Your code: EON20 — already applied at checkout.</span>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
