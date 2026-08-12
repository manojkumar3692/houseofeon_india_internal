"use client";

import Link from "next/link";
import { trackScentFixCtaClick, trackScentFixSectionView } from "@/lib/analytics";
import { useRevealOnce } from "../hooks";
import styles from "../scent-fix.module.css";

function scrollToEl(el: HTMLElement | null) {
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function FinalCta({
  matcherRef,
}: {
  matcherRef: React.RefObject<HTMLElement | null>;
}) {
  const reveal = useRevealOnce<HTMLDivElement>(0.3, () =>
    trackScentFixSectionView("section_final", 13)
  );

  return (
    <section className={styles.sFinal}>
      <div className={styles.container} ref={reveal.ref}>
        <div className={styles.sFinalEcho}>Sprayed at 9. Gone by 11.</div>

        <h2 className={`${styles.display} ${styles.sFinalHeadline}`}>
          Don&apos;t pay more
          <br />
          to smell less.
        </h2>

        <div className={`${styles.display} ${styles.sFinalBrand}`}>
          House of Eon
        </div>
        <div className={styles.sFinalFacts}>
          30–35% fragrance oil. ₹999.
        </div>

        <p className={`${styles.display} ${styles.sFinalTagline}`}>
          Same heat. Same skin.
          <br />
          Built different.
        </p>

        <div className={styles.sFinalCtas}>
          <button
            type="button"
            className={styles.sFinalPrimary}
            onClick={() => {
              trackScentFixCtaClick("final_primary_find_my_fragrance");
              scrollToEl(matcherRef.current);
            }}
          >
            Find my fragrance →
          </button>

          <Link
            href="/products"
            className={styles.sFinalSecondary}
            onClick={() => trackScentFixCtaClick("final_secondary_shop_all")}
          >
            Shop House of Eon
          </Link>
        </div>
      </div>
    </section>
  );
}
