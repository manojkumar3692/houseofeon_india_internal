"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/products";
import { formatINR } from "@/lib/money";
import { GenderAnswer } from "@/lib/scentQuiz";
import { SWIPE_CARDS, getSwipeMatches } from "@/lib/swipeGame";
import { generateSwipeShareImage, shareOrDownloadImage } from "@/lib/shareCard";
import {
  trackSwipeGameStarted,
  trackSwipeGameCompleted,
  trackSwipeLeadCaptured,
  trackSwipeShared,
} from "@/lib/analytics";
import styles from "./SwipeGame.module.css";

type Phase = "intro" | "swipe" | "loading" | "result";
type Direction = "left" | "right";

const COUPON_CODE = "EON20";

function computeMatchPercent(product: Product | undefined, likedTags: string[]) {
  if (!product) return 82;
  if (likedTags.length === 0) return 82;

  const productTags = new Set([...(product.mood || []), ...(product.occasion || [])]);
  const uniqueLiked = Array.from(new Set(likedTags));
  const overlap = uniqueLiked.filter((tag) => productTags.has(tag)).length;
  const pct = Math.round((overlap / uniqueLiked.length) * 100);

  return Math.max(60, Math.min(99, pct || 60));
}

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

export default function SwipeGame() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [gender, setGender] = useState<GenderAnswer>("Any");
  const [cardIndex, setCardIndex] = useState(0);
  const [matches, setMatches] = useState<Product[]>([]);
  const [matchPercent, setMatchPercent] = useState(82);

  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [flyDirection, setFlyDirection] = useState<Direction | null>(null);

  const likedTagsRef = useRef<string[]>([]);
  const startXRef = useRef(0);
  const transitioningRef = useRef(false);

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadError, setLeadError] = useState("");

  const [copied, setCopied] = useState(false);
  const [shareState, setShareState] = useState<
    "idle" | "generating" | "shared" | "downloaded" | "error"
  >("idle");

  const totalCards = SWIPE_CARDS.length;

  useEffect(() => {
    if (phase !== "loading") return;
    const timer = window.setTimeout(() => setPhase("result"), 1300);
    return () => window.clearTimeout(timer);
  }, [phase]);

  function startGame(pickedGender: GenderAnswer) {
    trackSwipeGameStarted();
    likedTagsRef.current = [];
    setGender(pickedGender);
    setCardIndex(0);
    setDragX(0);
    setDragging(false);
    setFlyDirection(null);
    setMatches([]);
    setLeadSubmitted(false);
    setLeadError("");
    setPhone("");
    setEmail("");
    setCopied(false);
    setShareState("idle");
    setPhase("swipe");
  }

  function finishSwiping(finalTags: string[], swipedGender: GenderAnswer) {
    const ranked = getSwipeMatches(swipedGender, finalTags);
    setMatches(ranked);
    setMatchPercent(computeMatchPercent(ranked[0], finalTags));

    if (ranked[0]) {
      trackSwipeGameCompleted(ranked[0].id, ranked[0].name);
    }

    setPhase("loading");
  }

  function commitSwipe(direction: Direction) {
    if (transitioningRef.current || phase !== "swipe") return;
    transitioningRef.current = true;

    const card = SWIPE_CARDS[cardIndex];
    const nextLikedTags =
      direction === "right" ? [...likedTagsRef.current, ...card.tags] : likedTagsRef.current;
    likedTagsRef.current = nextLikedTags;

    setDragging(false);
    setFlyDirection(direction);
    setDragX(direction === "right" ? 560 : -560);

    window.setTimeout(() => {
      transitioningRef.current = false;
      setFlyDirection(null);
      setDragX(0);

      const nextIndex = cardIndex + 1;
      if (nextIndex >= totalCards) {
        finishSwiping(nextLikedTags, gender);
      } else {
        setCardIndex(nextIndex);
      }
    }, 260);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (transitioningRef.current) return;
    (event.target as Element).setPointerCapture?.(event.pointerId);
    startXRef.current = event.clientX;
    setDragging(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    setDragX(event.clientX - startXRef.current);
  }

  function handlePointerUp() {
    if (!dragging) return;
    setDragging(false);

    const threshold = 90;
    if (dragX > threshold) {
      commitSwipe("right");
    } else if (dragX < -threshold) {
      commitSwipe("left");
    } else {
      setDragX(0);
    }
  }

  function retakeGame() {
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
          genderAnswer: gender,
          occasionAnswer: "Swipe Game",
          moodAnswer: `${matchPercent}% match`,
          recommendedProductId: primaryMatch?.id || "",
          recommendedProductName: primaryMatch?.name || "",
          couponCode: COUPON_CODE,
          source: "swipe",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save your details");
      }

      trackSwipeLeadCaptured();
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

    setShareState("generating");

    try {
      const blob = await generateSwipeShareImage(primaryMatch, matchPercent);

      if (!blob) {
        setShareState("error");
        return;
      }

      const captionText = `I'm a ${matchPercent}% match for ${primaryMatch.name} by House of Eon 🔥 Take the swipe test and unlock 20% off → ${window.location.origin}/scent-swipe`;

      const outcome = await shareOrDownloadImage(blob, primaryMatch, captionText);

      if (outcome === "shared") {
        trackSwipeShared();
        setShareState("shared");
      } else if (outcome === "downloaded") {
        trackSwipeShared();
        setShareState("downloaded");
      } else if (outcome === "cancelled") {
        setShareState("idle");
      } else {
        setShareState("error");
      }
    } catch {
      setShareState("error");
    }
  }

  const primaryMatch = matches[0];
  const secondaryMatch = matches[1];
  const currentCard = SWIPE_CARDS[cardIndex];
  const nextCard = SWIPE_CARDS[cardIndex + 1];

  const likeOpacity = Math.max(0, Math.min(1, dragX / 80));
  const skipOpacity = Math.max(0, Math.min(1, -dragX / 80));
  const rotation = dragX / 22;

  const topCardStyle: React.CSSProperties = {
    background: currentCard?.gradient,
    transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
    transition: dragging ? "none" : "transform 0.26s ease",
  };

  return (
    <div className={styles.gameShell}>
      {phase === "intro" ? (
        <div className={styles.introCard}>
          <span className={styles.introBadge}>Scent Swipe</span>
          <h1 className={styles.introTitle}>
            Swipe your day.
            <br />
            Match your scent.
          </h1>
          <p className={styles.introText}>
            Swipe right on the moments that feel like you, left on the ones
            that don&apos;t. 8 quick cards, then we reveal your scent match —
            and a 20% off code you can screenshot straight to your Story.
          </p>

          <div className={styles.genderRow}>
            <button
              type="button"
              className={styles.genderOption}
              onClick={() => startGame("Men")}
            >
              <span>🧔</span>
              For him
            </button>
            <button
              type="button"
              className={styles.genderOption}
              onClick={() => startGame("Women")}
            >
              <span>💃</span>
              For her
            </button>
            <button
              type="button"
              className={styles.genderOption}
              onClick={() => startGame("Any")}
            >
              <span>✨</span>
              Surprise me
            </button>
          </div>

          <div className={styles.introTrust}>
            <span>👆 8 quick swipes</span>
            <span>🎁 20% off unlocked</span>
            <span>📲 Shareable result</span>
          </div>
        </div>
      ) : null}

      {phase === "swipe" ? (
        <div className={styles.swipeArea}>
          <div className={styles.progressRow}>
            <span className={styles.progressLabel}>
              {Math.min(cardIndex + 1, totalCards)} / {totalCards}
            </span>
          </div>

          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${(Math.min(cardIndex, totalCards) / totalCards) * 100}%` }}
            />
          </div>

          <div className={styles.cardStack}>
            {nextCard ? (
              <div
                className={styles.stackCard}
                style={{ background: nextCard.gradient }}
              />
            ) : null}

            {currentCard ? (
              <div
                className={styles.swipeCard}
                style={topCardStyle}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <span
                  className={`${styles.stamp} ${styles.stampLike}`}
                  style={{ opacity: likeOpacity }}
                >
                  SPRAY
                </span>
                <span
                  className={`${styles.stamp} ${styles.stampSkip}`}
                  style={{ opacity: skipOpacity }}
                >
                  SKIP
                </span>

                <span className={styles.cardEmoji}>{currentCard.emoji}</span>
                <h2 className={styles.cardScenario}>{currentCard.scenario}</h2>
                <p className={styles.cardSub}>{currentCard.sub}</p>
              </div>
            ) : null}
          </div>

          <div className={styles.swipeButtons}>
            <button
              type="button"
              className={styles.skipButton}
              onClick={() => commitSwipe("left")}
              aria-label="Skip this scenario"
            >
              ✕
            </button>
            <button
              type="button"
              className={styles.likeButton}
              onClick={() => commitSwipe("right")}
              aria-label="This is me"
            >
              ❤️
            </button>
          </div>

          <p className={styles.swipeHint}>Drag the card, or tap ✕ / ❤️</p>
        </div>
      ) : null}

      {phase === "loading" ? (
        <div className={styles.loadingCard}>
          <div className={styles.loadingBottle} />
          <p className={styles.loadingText}>Matching your scent DNA…</p>
        </div>
      ) : null}

      {phase === "result" && primaryMatch ? (
        <div className={styles.resultCard}>
          <ConfettiBurst />

          <div className={styles.matchPercentBadge}>{matchPercent}% MATCH</div>

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

          <div className={styles.matchLabel}>Your scent match</div>

          <div className={styles.matchCard}>
            <Image
              src={primaryMatch.image}
              alt={`${primaryMatch.name} perfume by House of Eon`}
              width={260}
              height={260}
              className={styles.matchImage}
            />

            <div className={styles.matchInfo}>
              <span className={styles.matchTagline}>{primaryMatch.tagline}</span>
              <h3>{primaryMatch.name}</h3>
              <div className={styles.matchPriceRow}>
                <b>{formatINR(primaryMatch.price)}</b>
                {primaryMatch.mrp ? (
                  <span className={styles.matchMrp}>{formatINR(primaryMatch.mrp)}</span>
                ) : null}
              </div>

              <Link href={`/products/${primaryMatch.slug}`} className={styles.primaryButton}>
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

              {leadError ? <div className={styles.leadError}>{leadError}</div> : null}

              <button type="submit" className={styles.secondaryButton} disabled={leadSubmitting}>
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
              disabled={shareState === "generating"}
            >
              {shareState === "generating"
                ? "Creating image…"
                : shareState === "shared"
                ? "Shared! ✓"
                : shareState === "downloaded"
                ? "Saved — post it! 📲"
                : shareState === "error"
                ? "Couldn't share — try again"
                : "Share to Insta / FB ↗"}
            </button>

            <button type="button" className={styles.retakeButton} onClick={retakeGame}>
              Play again
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
