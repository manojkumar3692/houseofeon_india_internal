"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/products";
import { formatINR } from "@/lib/money";
import {
  GenderAnswer,
  QUIZ_QUESTIONS,
  QuizAnswers,
  getQuizMatches,
} from "@/lib/scentQuiz";
import {
  trackQuizCompleted,
  trackQuizLeadCaptured,
  trackQuizStarted,
} from "@/lib/analytics";
import styles from "./ScentQuiz.module.css";

type Phase = "intro" | "quiz" | "loading" | "result";

const COUPON_CODE = "EON20";

const initialAnswers: QuizAnswers = {
  gender: "Any",
  genderLabel: "",
  occasionTags: [],
  occasionLabel: "",
  moodTags: [],
  moodLabel: "",
};

function ConfettiBurst() {
  const pieces = useMemo(() => {
    const colors = ["#d7b98f", "#1f1711", "#f3eadc", "#b9822f", "#fff7e8"];

    return Array.from({ length: 36 }).map((_, index) => ({
      id: index,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2.2 + Math.random() * 1.4,
      color: colors[index % colors.length],
      rotate: Math.random() * 360,
    }));
  }, []);

  return (
    <div className={styles.confettiLayer} aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className={styles.confettiPiece}
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            background: piece.color,
            transform: `rotate(${piece.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export default function ScentQuiz() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>(initialAnswers);
  const [matches, setMatches] = useState<Product[]>([]);

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadError, setLeadError] = useState("");

  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const totalSteps = QUIZ_QUESTIONS.length;
  const currentQuestion = QUIZ_QUESTIONS[stepIndex];

  useEffect(() => {
    if (phase !== "loading") return;

    const timer = window.setTimeout(() => {
      setPhase("result");
    }, 1300);

    return () => window.clearTimeout(timer);
  }, [phase]);

  function startQuiz() {
    trackQuizStarted();
    setAnswers(initialAnswers);
    setStepIndex(0);
    setPhase("quiz");
  }

  function goBack() {
    setStepIndex((current) => Math.max(0, current - 1));
  }

  function selectOption(option: { label: string } & Record<string, unknown>) {
    const question = currentQuestion;

    let nextAnswers = answers;

    if (question.id === "gender") {
      nextAnswers = {
        ...answers,
        gender: option.value as GenderAnswer,
        genderLabel: option.label,
      };
    } else if (question.id === "occasion") {
      nextAnswers = {
        ...answers,
        occasionTags: option.tags as string[],
        occasionLabel: option.label,
      };
    } else {
      nextAnswers = {
        ...answers,
        moodTags: option.tags as string[],
        moodLabel: option.label,
      };
    }

    setAnswers(nextAnswers);

    if (stepIndex < totalSteps - 1) {
      setStepIndex((current) => current + 1);
      return;
    }

    const ranked = getQuizMatches(nextAnswers);
    setMatches(ranked);
    setPhase("loading");

    if (ranked[0]) {
      trackQuizCompleted(ranked[0].id, ranked[0].name);
    }
  }

  function retakeQuiz() {
    setPhone("");
    setEmail("");
    setLeadSubmitted(false);
    setLeadError("");
    setCopied(false);
    setPhase("intro");
  }

  function copyCoupon() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(COUPON_CODE).catch(() => {});
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function submitLead(event: React.FormEvent) {
    event.preventDefault();
    setLeadError("");

    if (!phone.trim() && !email.trim()) {
      setLeadError("Add your phone or email to save your match.");
      return;
    }

    setLeadSubmitting(true);

    try {
      const primaryMatch = matches[0];

      const response = await fetch("/api/quiz-leads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          email: email.trim(),
          genderAnswer: answers.genderLabel,
          occasionAnswer: answers.occasionLabel,
          moodAnswer: answers.moodLabel,
          recommendedProductId: primaryMatch?.id || "",
          recommendedProductName: primaryMatch?.name || "",
          couponCode: COUPON_CODE,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save your details");
      }

      trackQuizLeadCaptured();
      setLeadSubmitted(true);
    } catch (err) {
      setLeadError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    } finally {
      setLeadSubmitting(false);
    }
  }

  async function shareResult() {
    const primaryMatch = matches[0];
    if (!primaryMatch) return;

    const shareUrl = `${window.location.origin}/products/${primaryMatch.slug}`;
    const shareText = `I just found my House of Eon scent match: ${primaryMatch.name}! Take the 30-second quiz and find yours 👇\n${window.location.origin}/scent-finder`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `My House of Eon match: ${primaryMatch.name}`,
          text: shareText,
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(shareText);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2500);
    } catch {
      // User dismissed the share sheet — no need to surface an error.
    }
  }

  const primaryMatch = matches[0];
  const secondaryMatch = matches[1];

  return (
    <div className={styles.quizShell}>
      {phase === "intro" ? (
        <div className={styles.introCard}>
          <span className={styles.introBadge}>30-Second Scent Finder</span>
          <h1 className={styles.introTitle}>
            Find your signature scent.
            <br />
            Unlock 20% off.
          </h1>
          <p className={styles.introText}>
            Answer 3 quick questions and we&apos;ll match you with the House
            of Eon perfume made for your vibe — plus reveal a launch discount
            on the way out.
          </p>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={startQuiz}
          >
            Start the quiz →
          </button>

          <div className={styles.introTrust}>
            <span>✨ 3 quick taps</span>
            <span>🎁 20% off unlocked</span>
            <span>💯 No wrong answers</span>
          </div>
        </div>
      ) : null}

      {phase === "quiz" ? (
        <div className={styles.quizCard}>
          <div className={styles.progressRow}>
            {stepIndex > 0 ? (
              <button
                type="button"
                className={styles.backButton}
                onClick={goBack}
                aria-label="Previous question"
              >
                ← Back
              </button>
            ) : (
              <span />
            )}

            <span className={styles.progressLabel}>
              {stepIndex + 1} / {totalSteps}
            </span>
          </div>

          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${((stepIndex + 1) / totalSteps) * 100}%`,
              }}
            />
          </div>

          <h2 className={styles.questionTitle}>{currentQuestion.question}</h2>

          <div className={styles.optionsGrid}>
            {currentQuestion.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={styles.optionCard}
                onClick={() => selectOption(option)}
              >
                <span className={styles.optionEmoji}>{option.emoji}</span>
                <span className={styles.optionLabel}>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {phase === "loading" ? (
        <div className={styles.loadingCard}>
          <div className={styles.loadingBottle} />
          <p className={styles.loadingText}>Finding your signature scent…</p>
        </div>
      ) : null}

      {phase === "result" && primaryMatch ? (
        <div className={styles.resultCard}>
          <ConfettiBurst />

          <div className={styles.couponReveal}>
            <span className={styles.couponEyebrow}>You unlocked</span>
            <strong className={styles.couponHeadline}>20% OFF</strong>

            <button
              type="button"
              className={styles.couponCodeButton}
              onClick={copyCoupon}
            >
              <span>{COUPON_CODE}</span>
              <em>{copied ? "Copied!" : "Tap to copy"}</em>
            </button>
          </div>

          <div className={styles.matchLabel}>Your signature scent match</div>

          <div className={styles.matchCard}>
            <Image
              src={primaryMatch.image}
              alt={`${primaryMatch.name} perfume by House of Eon`}
              width={260}
              height={260}
              className={styles.matchImage}
            />

            <div className={styles.matchInfo}>
              <span className={styles.matchTagline}>
                {primaryMatch.tagline}
              </span>
              <h3>{primaryMatch.name}</h3>
              <div className={styles.matchPriceRow}>
                <b>{formatINR(primaryMatch.price)}</b>
                {primaryMatch.mrp ? (
                  <span className={styles.matchMrp}>
                    {formatINR(primaryMatch.mrp)}
                  </span>
                ) : null}
              </div>

              <Link
                href={`/products/${primaryMatch.slug}`}
                className={styles.primaryButton}
              >
                Shop {primaryMatch.name} →
              </Link>
            </div>
          </div>

          {secondaryMatch ? (
            <Link
              href={`/products/${secondaryMatch.slug}`}
              className={styles.secondaryMatchCard}
            >
              <Image
                src={secondaryMatch.image}
                alt={`${secondaryMatch.name} perfume by House of Eon`}
                width={64}
                height={64}
                className={styles.secondaryMatchImage}
              />
              <div>
                <span>Also perfect for you</span>
                <b>{secondaryMatch.name}</b>
              </div>
              <span className={styles.secondaryMatchArrow}>→</span>
            </Link>
          ) : null}

          {!leadSubmitted ? (
            <form className={styles.leadForm} onSubmit={submitLead}>
              <p className={styles.leadFormTitle}>
                Save your match &amp; get offers on WhatsApp
              </p>

              <div className={styles.leadFormRow}>
                <input
                  className={styles.leadInput}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />

                <input
                  className={styles.leadInput}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="Email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {leadError ? (
                <div className={styles.leadError}>{leadError}</div>
              ) : null}

              <button
                type="submit"
                className={styles.secondaryButton}
                disabled={leadSubmitting}
              >
                {leadSubmitting ? "Saving…" : "Save my match"}
              </button>

              <p className={styles.leadFormNote}>
                We&apos;ll only use this to send you offers and updates.
              </p>
            </form>
          ) : (
            <div className={styles.leadSuccess}>
              Saved! We&apos;ll reach out with offers on WhatsApp.
            </div>
          )}

          <div className={styles.resultActions}>
            <button
              type="button"
              className={styles.shareButton}
              onClick={shareResult}
            >
              {shareCopied ? "Copied — share it!" : "Share my result ↗"}
            </button>

            <button
              type="button"
              className={styles.retakeButton}
              onClick={retakeQuiz}
            >
              Retake quiz
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
