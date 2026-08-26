"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { formatINR } from "@/lib/money";
import { EON20_DISCOUNTED_PRICE_INR } from "@/lib/pricing";
import { TRIAL_PACK_PRICE_INR, isTrialEligibleProductId } from "@/lib/trialPack";
import {
  trackAddToCart,
  trackScentFixCompleted,
  trackScentFixFeelingSelected,
  trackScentFixSectionView,
  trackScentFixShowAnother,
  trackScentFixCtaClick,
} from "@/lib/analytics";
import {
  FEELINGS,
  FeelingId,
  findFeelingForProduct,
  getFeelingProduct,
  getProductTagLine,
} from "@/lib/scentMatch";
import styles from "../scent-fix.module.css";

// Sections 8 + 9 — the primary conversion mechanism. One tap picks a
// feeling, the product panel reveals immediately underneath (no page
// jump, no catalogue dump). Kept as one component because they share
// tightly-coupled state (which feeling, which product in that feeling's
// list) that doesn't need to live any higher up the tree.
export default function ScentMatcher({
  matcherRef,
  sharedProductId,
  onUpdateShareUrl,
}: {
  matcherRef: React.RefObject<HTMLElement | null>;
  sharedProductId: string | null;
  onUpdateShareUrl: (productId: string) => void;
}) {
  const router = useRouter();
  const { addItem } = useCart();

  const [feelingId, setFeelingId] = useState<FeelingId | null>(null);
  const [productIndex, setProductIndex] = useState(0);
  // Gates the trial-pack link — deliberately NOT shown the instant someone
  // gets their first match, since that's the highest-intent moment in the
  // whole funnel (the same moment they'd hit the ₹999 CTA). "Show me
  // another" is a real hesitation signal — the first match didn't convince
  // them — so only offer the cheaper alternative once they've demonstrated
  // that, not to everyone by default. Once true, stays true for the rest of
  // the session even if they pick a different feeling afterward.
  const [hasShownHesitation, setHasShownHesitation] = useState(false);
  const leadFiredRef = useRef(false);
  const appliedSharedRef = useRef(false);
  const sectionViewFiredRef = useRef(false);

  // matcherRef is owned by the parent (other sections scroll to it, so it
  // has to be a plain ref rather than one created by useRevealOnce here) —
  // this observes that same node directly just for the one-time impression
  // event, without disturbing how the ref is used elsewhere.
  useEffect(() => {
    const node = matcherRef.current;
    if (!node || sectionViewFiredRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !sectionViewFiredRef.current) {
          sectionViewFiredRef.current = true;
          trackScentFixSectionView("section_8_scent_matcher", 8);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A shared ?result=<product-id> link opens straight on the right card,
  // without needing to know which feeling produced it originally.
  useEffect(() => {
    if (appliedSharedRef.current) return;
    if (!sharedProductId) return;
    appliedSharedRef.current = true;

    const match = findFeelingForProduct(sharedProductId);
    if (match) {
      setFeelingId(match.feeling.id);
      setProductIndex(match.index);
    }
  }, [sharedProductId]);

  const feeling = FEELINGS.find((f) => f.id === feelingId) || null;
  const product = feeling ? getFeelingProduct(feeling, productIndex) : null;

  function selectFeeling(id: FeelingId) {
    setFeelingId(id);
    setProductIndex(0);

    const picked = FEELINGS.find((f) => f.id === id);
    const firstProduct = picked ? getFeelingProduct(picked, 0) : null;

    if (picked) trackScentFixFeelingSelected(picked.id, picked.label);

    if (firstProduct && !leadFiredRef.current) {
      leadFiredRef.current = true;
      trackScentFixCompleted(firstProduct.id, firstProduct.name);
    }
    if (firstProduct) onUpdateShareUrl(firstProduct.id);
  }

  function showAnother() {
    if (!feeling) return;
    setHasShownHesitation(true);
    const nextIndex = (productIndex + 1) % feeling.productIds.length;
    setProductIndex(nextIndex);

    const nextProduct = getFeelingProduct(feeling, nextIndex);
    if (nextProduct) {
      trackScentFixShowAnother(nextProduct.id, nextProduct.name);
      onUpdateShareUrl(nextProduct.id);
    }
  }

  function handleGetProduct() {
    if (!product) return;

    addItem(product.id, 1);
    trackAddToCart({
      id: product.id,
      name: product.name,
      price: EON20_DISCOUNTED_PRICE_INR,
      quantity: 1,
    });
    router.push("/checkout");
  }

  return (
    <section
      className={styles.s8}
      ref={matcherRef as React.RefObject<HTMLElement>}
    >
      <div className={styles.container}>
        <span className={`${styles.eyebrow} ${styles.s8Eyebrow}`}>
          Forget fragrance notes for a second.
        </span>
        <h2 className={`${styles.display} ${styles.s8Headline}`}>
          How do you want to feel?
        </h2>

        <div className={styles.s8Cards}>
          {FEELINGS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`${styles.s8Card} ${
                feelingId === f.id ? styles.s8CardActive : ""
              }`}
              onClick={() => selectFeeling(f.id)}
              aria-pressed={feelingId === f.id}
            >
              <span className={styles.s8CardLabel}>{f.label}</span>
              <span className={styles.s8CardSub}>&ldquo;{f.sub}&rdquo;</span>
            </button>
          ))}
        </div>

        <div className={`${styles.s9} ${product ? styles.s9Open : ""}`}>
          {product ? (
            <div className={styles.s9Card}>
              <span className={`${styles.eyebrow} ${styles.s9Eyebrow}`}>
                Your match
              </span>

              <div className={styles.s9ImageWrap}>
                <Image
                  src={product.image}
                  alt={`${product.name} by House of Eon`}
                  width={220}
                  height={220}
                />
              </div>

              <div className={`${styles.display} ${styles.s9Name}`}>
                {product.name}
              </div>
              <div className={styles.s9Tag}>{getProductTagLine(product)}</div>

              <div className={styles.s9Price}>
                {formatINR(EON20_DISCOUNTED_PRICE_INR)}
              </div>
              <div className={styles.s9Facts}>
                30–35% fragrance oil · 50 ml · {product.concentration}
              </div>

              {hasShownHesitation && isTrialEligibleProductId(product.id) ? (
                <Link
                  href="/trial-pack"
                  className={styles.s9TrialLink}
                  onClick={() => trackScentFixCtaClick("trial_pack_link")}
                >
                  Not ready to commit? Try {product.name} + 2 more for{" "}
                  {formatINR(TRIAL_PACK_PRICE_INR)} →
                </Link>
              ) : null}

              <button
                type="button"
                className={styles.s9Cta}
                onClick={handleGetProduct}
              >
                Get {product.name} — {formatINR(EON20_DISCOUNTED_PRICE_INR)} →
              </button>

              {feeling && feeling.productIds.length > 1 ? (
                <button
                  type="button"
                  className={styles.s9Secondary}
                  onClick={showAnother}
                >
                  Show me another →
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
