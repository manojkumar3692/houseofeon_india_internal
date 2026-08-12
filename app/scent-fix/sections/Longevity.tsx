"use client";

import { trackScentFixSectionView } from "@/lib/analytics";
import { useRevealOnce } from "../hooks";
import styles from "../scent-fix.module.css";

const TIMES = ["9 AM", "12 PM", "3 PM", "6 PM", "9 PM"];

// Section 7 — deliberately does NOT put a guaranteed hour-count on the
// timeline itself (an absolute "12 hours" claim isn't substantiated). The
// one number used — 6-8 hours on skin — is the same honest figure already
// live elsewhere on the site, not a new claim invented for this page.
export default function Longevity() {
  const reveal = useRevealOnce<HTMLDivElement>(0.3, () =>
    trackScentFixSectionView("section_7_longevity", 7)
  );

  return (
    <section className={styles.s7}>
      <div className={styles.container} ref={reveal.ref}>
        <h2 className={`${styles.display} ${styles.s7Headline}`}>
          Your day doesn&apos;t end at 11.
        </h2>

        <div className={styles.s7Timeline}>
          <div className={styles.s7Track}>
            <div
              className={`${styles.s7TrackFill} ${
                reveal.visible ? styles.filled : ""
              }`}
            />
          </div>
          <div className={styles.s7Marks}>
            {TIMES.map((time) => (
              <span className={styles.s7Mark} key={time}>
                <span className={styles.s7Dot} aria-hidden="true" />
                {time}
              </span>
            ))}
          </div>
        </div>

        <p className={styles.s7Copy}>
          Designed for lasting presence through work, commutes, evenings and
          everything between.
        </p>

        <span className={styles.s7Fact}>
          ⏱ 6-8 hours on skin. Longer on fabric.
        </span>

        <p className={styles.s7Disclaimer}>
          Performance varies by fragrance, skin chemistry, environment and
          application.
        </p>
      </div>
    </section>
  );
}
