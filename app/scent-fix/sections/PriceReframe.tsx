"use client";

import { useEffect, useState } from "react";
import { trackScentFixSectionView } from "@/lib/analytics";
import { useRevealOnce, usePrefersReducedMotion } from "../hooks";
import Bottle from "./Bottle";
import styles from "../scent-fix.module.css";

const REMOVED_ITEMS = ["The fancy box.", "The celebrity.", "The brand markup."];

// Sections 4 + 5 — both are "where did the money go" beats, one right
// after the other: first the conceptual cost comparison, then the
// emotional "here's what we cut" reveal. Kept together since Section 5's
// reveal only makes sense as the payoff to Section 4's setup.
export default function PriceReframe() {
  const s4Reveal = useRevealOnce<HTMLDivElement>(0.25, () =>
    trackScentFixSectionView("section_4_price_compare", 4)
  );
  const s5Reveal = useRevealOnce<HTMLDivElement>(0.3, () =>
    trackScentFixSectionView("section_5_removal_reveal", 5)
  );
  const reducedMotion = usePrefersReducedMotion();

  // Sequential "appear, then get struck through" for each removed item,
  // followed by a pause and the "NOT THE FRAGRANCE" + bottle reveal.
  // Under reduced motion this whole staged sequence is skipped — see the
  // effect below — everything just appears immediately.
  const [itemStage, setItemStage] = useState<number[]>([0, 0, 0]);
  const [remainsVisible, setRemainsVisible] = useState(false);

  useEffect(() => {
    if (!s5Reveal.visible) return;

    if (reducedMotion) {
      setItemStage([2, 2, 2]);
      setRemainsVisible(true);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    REMOVED_ITEMS.forEach((_, index) => {
      const appearAt = 300 + index * 900;
      const removeAt = appearAt + 500;

      timers.push(
        setTimeout(() => {
          setItemStage((current) => {
            const next = [...current];
            next[index] = 1;
            return next;
          });
        }, appearAt)
      );

      timers.push(
        setTimeout(() => {
          setItemStage((current) => {
            const next = [...current];
            next[index] = 2;
            return next;
          });
        }, removeAt)
      );
    });

    timers.push(
      setTimeout(() => {
        setRemainsVisible(true);
      }, 300 + REMOVED_ITEMS.length * 900 + 500)
    );

    return () => timers.forEach((t) => clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s5Reveal.visible]);

  return (
    <>
      {/* ============ SECTION 4 — ₹3,000 vs ₹999 ============ */}
      <section className={styles.s4}>
        <div className={styles.container} ref={s4Reveal.ref}>
          <h2 className={`${styles.display} ${styles.s4Headline}`}>
            So what are you
            <br />
            actually paying for?
          </h2>

          <div className={styles.s4Grid}>
            <div className={styles.s4Col}>
              <span className={styles.s4Price}>₹3,000</span>
              <span className={styles.s4ColLabel}>
                Traditional luxury purchase
              </span>
              <div className={styles.s4Bar} aria-hidden="true">
                <div className={styles.s4Segment} style={{ flex: 1.3 }}>
                  Packaging
                </div>
                <div className={styles.s4Segment} style={{ flex: 1.2 }}>
                  Marketing
                </div>
                <div className={styles.s4Segment} style={{ flex: 1.1 }}>
                  Brand
                </div>
                <div className={styles.s4Segment} style={{ flex: 1 }}>
                  Distribution
                </div>
                <div
                  className={`${styles.s4Segment} ${styles.s4SegmentFragrance}`}
                  style={{ flex: 0.6 }}
                >
                  Fragrance
                </div>
              </div>
            </div>

            <div className={styles.s4Col}>
              <span className={styles.s4Price}>₹999</span>
              <span className={styles.s4ColLabel}>House of Eon</span>
              <div className={styles.s4Bar} aria-hidden="true">
                <div className={styles.s4BarSolid} style={{ flex: 1 }}>
                  Fragrance
                  <br />
                  First
                </div>
              </div>
            </div>
          </div>

          <p className={styles.s4Removed}>
            No fancy box.
            <br />
            No celebrity contract.
            <br />
            No brand tax.
          </p>

          <p className={styles.s4Isolated}>
            We don&apos;t want your money sitting on a shelf. We want it on
            your skin.
          </p>
        </div>
      </section>

      {/* ============ SECTION 5 — THE ₹999 QUESTION ============ */}
      <section className={styles.s5}>
        <div className={styles.container} ref={s5Reveal.ref}>
          <h2 className={`${styles.display} ${styles.s5Headline}`}>
            If it&apos;s ₹999, what did we remove?
          </h2>

          <div className={styles.s5List}>
            {REMOVED_ITEMS.map((item, index) => (
              <div
                key={item}
                className={`${styles.s5Item} ${
                  itemStage[index] >= 1 ? styles.itemVisible : ""
                } ${itemStage[index] >= 2 ? styles.itemRemoved : ""}`}
              >
                <span>{item}</span>
                {itemStage[index] >= 2 ? (
                  <span className={styles.s5Mark} aria-hidden="true">
                    ×
                  </span>
                ) : null}
              </div>
            ))}
          </div>

          {remainsVisible ? (
            <p className={`${styles.display} ${styles.s5Remains}`}>
              Not the fragrance.
            </p>
          ) : null}

          <div
            className={`${styles.s5BottleWrap} ${
              remainsVisible ? styles.visible : ""
            }`}
          >
            <Bottle />
          </div>
        </div>
      </section>
    </>
  );
}
