"use client";

import { trackScentFixCtaClick, trackScentFixSectionView } from "@/lib/analytics";
import { useRevealOnce, useScrollProgress } from "../hooks";
import styles from "../scent-fix.module.css";

function scrollToEl(el: HTMLElement | null) {
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Sections 1 + 2 — kept in one file because they're one continuous visual
// beat: black hero dissolving into hot burnt-orange, resolving to ivory by
// the time Section 3 takes over. Splitting the gradient logic across two
// files would make that handoff harder to keep seamless.
//
// Section 1 itself isn't separately tracked as a "section view" — it's
// synonymous with ViewContent (fired on load, see ScentFixExperience),
// since it's the first thing anyone sees. Tracking starts from Section 2.
export default function OpeningStory({
  nextRef,
}: {
  nextRef: React.RefObject<HTMLElement | null>;
}) {
  const { ref: goneRef, progress } = useScrollProgress<HTMLDivElement>();
  const s2Top = useRevealOnce<HTMLDivElement>(0.15, () =>
    trackScentFixSectionView("section_2_india_heat", 2)
  );
  const s2Statement = useRevealOnce<HTMLParagraphElement>(0.4);

  const goneStyle: React.CSSProperties = {
    opacity: 1 - progress * 0.85,
    filter: `blur(${progress * 5}px)`,
    letterSpacing: `${progress * 0.15}em`,
    transform: `translateY(${-progress * 14}px)`,
  };

  return (
    <>
      {/* ============ SECTION 1 — CONTINUE THE AD ============ */}
      <section className={styles.s1}>
        <div className={styles.container}>
          <span className={`${styles.eyebrow} ${styles.s1Eyebrow}`}>
            That ₹3,000 bottle
          </span>

          <h1 className={`${styles.display} ${styles.s1Lines}`}>
            <div>Sprayed</div>
            <div>at 9.</div>
            <div ref={goneRef} className={styles.s1GoneLine} style={goneStyle}>
              Gone
            </div>
            <div className={styles.s1GoneLine} style={goneStyle}>
              by 11.
            </div>
          </h1>

          <p className={styles.s1Sub}>
            There&apos;s a reason your perfume disappears so fast.
          </p>

          <button
            type="button"
            className={styles.s1Cta}
            onClick={() => {
              trackScentFixCtaClick("section_1_show_me_why");
              scrollToEl(nextRef.current);
            }}
          >
            Show me why <span aria-hidden="true">↓</span>
          </button>
        </div>
      </section>

      {/* ============ SECTION 2 — INDIA IS THE TEST ============ */}
      <section className={styles.s2} ref={nextRef as React.RefObject<HTMLElement>}>
        <div className={styles.s2Top} ref={s2Top.ref}>
          <div className={styles.container}>
            <div className={`${styles.display} ${styles.s2Temp}`}>37°C</div>
            <div className={`${styles.display} ${styles.s2Words}`}>
              Heat. Sweat.
              <br />
              Commute. Repeat.
            </div>

            <p className={styles.s2Copy}>
              Your fragrance doesn&apos;t live in an air-conditioned
              advertisement. It lives here.
            </p>

            <div className={styles.s2Particles} aria-hidden="true">
              {Array.from({ length: 10 }).map((_, i) => (
                <span
                  key={i}
                  className={styles.s2Particle}
                  style={{
                    left: `${6 + i * 9.5}%`,
                    animationDelay: `${i * 0.35}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className={styles.s2Bottom}>
          <div className={styles.container}>
            <p
              ref={s2Statement.ref}
              className={`${styles.display} ${styles.s2Statement} ${styles.revealUp} ${
                s2Statement.visible ? styles.visible : ""
              }`}
            >
              Same heat.
              <br />
              Same skin.
              <br />
              A perfume actually
              <br />
              built to survive it.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
