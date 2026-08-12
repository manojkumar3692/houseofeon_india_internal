"use client";

import { trackScentFixSectionView } from "@/lib/analytics";
import { useRevealOnce } from "../hooks";
import { getCuratedReviews } from "@/lib/scentMatch";
import styles from "../scent-fix.module.css";

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span aria-label={`${full} out of 5 stars`}>
      {"★".repeat(full)}
      {"☆".repeat(5 - full)}
    </span>
  );
}

// Sections 10 + 11 + 12 — the "trust and logistics" run before the final
// close: blind-buy objection, real reviews, delivery. Grouped together
// since none needs its own state and splitting them into 3 files would
// just be more imports for no real benefit.
export default function TrustClose() {
  const s10 = useRevealOnce<HTMLDivElement>(0.3, () =>
    trackScentFixSectionView("section_10_blind_buy", 10)
  );
  const s11 = useRevealOnce<HTMLDivElement>(0.2, () =>
    trackScentFixSectionView("section_11_reviews", 11)
  );
  const s12 = useRevealOnce<HTMLDivElement>(0.3, () =>
    trackScentFixSectionView("section_12_delivery", 12)
  );

  const reviews = getCuratedReviews(6);

  return (
    <>
      {/* ============ SECTION 10 — BLIND BUY OBJECTION ============ */}
      <section className={styles.s10}>
        <div className={styles.container} ref={s10.ref}>
          <h2 className={`${styles.display} ${styles.s10Line1}`}>
            But there&apos;s one problem.
          </h2>
          <h2 className={`${styles.display} ${styles.s10Line2}`}>
            You can&apos;t smell a screen.
          </h2>

          <p className={styles.s10Copy}>
            And that&apos;s exactly why buying perfume online feels risky.
          </p>

          <div className={styles.s10Policy}>
            We can&apos;t let you sniff it before you buy — but every
            fragrance page breaks down exactly what you&apos;ll smell, and
            our team is on WhatsApp if you want a second opinion first.
            Once a bottle&apos;s opened we can&apos;t take it back
            (fragrance hygiene), so we&apos;d rather help you pick right the
            first time than sell you the wrong one.
          </div>
        </div>
      </section>

      {/* ============ SECTION 11 — REAL PEOPLE ============ */}
      {reviews.length ? (
        <section className={styles.s11}>
          <div className={styles.container} ref={s11.ref}>
            <h2 className={`${styles.display} ${styles.s11Headline}`}>
              Don&apos;t take our word for it.
            </h2>

            <div className={styles.s11List}>
              {reviews.map((review) => (
                <div
                  className={styles.s11Bubble}
                  key={`${review.name}-${review.orderNumber}`}
                >
                  <div className={styles.s11Head}>
                    <span>{review.name}</span>
                    <span className={styles.s11City}>· {review.city}</span>
                    <span className={styles.s11Verified}>✓ Verified</span>
                  </div>
                  <div className={styles.s11Stars}>
                    <Stars rating={review.rating} />
                  </div>
                  <p className={styles.s11Text}>&ldquo;{review.text}&rdquo;</p>
                  <div className={styles.s11Product}>
                    Bought {review.productName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ============ SECTION 12 — DELIVERY ============ */}
      <section className={styles.s12}>
        <div className={styles.container} ref={s12.ref}>
          <h2 className={`${styles.display} ${styles.s12Headline}`}>
            Shipped across India.
          </h2>

          <div className={styles.s12Card}>
            <b>2-3 working days</b>
            Delivered nationwide, tracked door to door. Pay a small amount
            online and the rest in cash on delivery, on eligible orders.
          </div>
        </div>
      </section>
    </>
  );
}
