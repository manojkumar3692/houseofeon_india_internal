"use client";

import { useEffect, useRef, useState } from "react";
import { trackScentFixSectionView } from "@/lib/analytics";
import { useRevealOnce, usePrefersReducedMotion } from "../hooks";
import styles from "../scent-fix.module.css";

const TARGET_PERCENT = 33;

// Section 3 — the oil-concentration reveal. The fill amount is driven
// directly by a state value updated every animation frame (not a CSS
// class toggle), and paired with a live numeric readout — so there's no
// way for this to silently render as "nothing happened": either the
// number ticks up to 33% and the vessel visibly fills, or it doesn't.
export default function TheNumber() {
  const reveal = useRevealOnce<HTMLDivElement>(0.3, () =>
    trackScentFixSectionView("section_3_the_number", 3)
  );
  const reducedMotion = usePrefersReducedMotion();
  const [percent, setPercent] = useState(0);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (!reveal.visible || animatedRef.current) return;
    animatedRef.current = true;

    if (reducedMotion) {
      setPercent(TARGET_PERCENT);
      return;
    }

    const duration = 1400;
    const start = performance.now();
    let raf = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setPercent(Math.round(eased * TARGET_PERCENT));
      if (t < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reveal.visible, reducedMotion]);

  return (
    <section className={styles.s3}>
      <div className={styles.container}>
        <span className={`${styles.eyebrow} ${styles.s3Eyebrow}`}>
          What&apos;s actually inside?
        </span>

        <div className={`${styles.display} ${styles.s3Number}`}>30–35%</div>
        <div className={`${styles.display} ${styles.s3Label}`}>
          Pure fragrance oil.
        </div>

        <p className={styles.s3Copy}>
          House of Eon fragrances are formulated with 30–35% fragrance oil.
        </p>

        <div className={styles.vesselWrap}>
          <div ref={reveal.ref} className={styles.vessel}>
            <div
              className={styles.vesselFill}
              style={{ height: `${percent}%` }}
            />
          </div>

          <div>
            <div className={styles.vesselReading}>{percent}%</div>
            <span className={styles.vesselReadingLabel}>
              fragrance oil
            </span>
          </div>
        </div>

        <p className={styles.s3Disclaimer}>
          Concentration is one factor in longevity — actual performance also
          depends on formulation, skin chemistry, climate and how it&apos;s
          applied.
        </p>
      </div>
    </section>
  );
}
