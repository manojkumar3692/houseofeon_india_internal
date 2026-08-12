"use client";

import { useEffect, useState } from "react";
import { trackScentFixCtaClick } from "@/lib/analytics";
import styles from "../scent-fix.module.css";

function scrollToEl(el: HTMLElement | null) {
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Appears only once the visitor has scrolled past the educational sections
// (tracked via the same matcher-section ref the other CTAs use) — never on
// load, so it doesn't compete with Section 1's "preserve curiosity" beat.
export default function StickyCta({
  matcherRef,
}: {
  matcherRef: React.RefObject<HTMLElement | null>;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = matcherRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show once the matcher section has been reached; once shown,
        // stays shown (no flicker on scroll-up).
        if (entry.boundingClientRect.top < window.innerHeight) {
          setVisible(true);
        }
      },
      { threshold: 0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [matcherRef]);

  return (
    <div className={`${styles.sticky} ${visible ? styles.stickyVisible : ""}`}>
      <button
        type="button"
        className={styles.stickyBtn}
        onClick={() => {
          trackScentFixCtaClick("sticky_find_my_scent");
          scrollToEl(matcherRef.current);
        }}
      >
        Find my scent →
      </button>
    </div>
  );
}
