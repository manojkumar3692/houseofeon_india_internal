"use client";

import { useEffect, useRef, useState } from "react";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);

    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return reduced;
}

// Fires once when the element enters the viewport, then disconnects — the
// standard "fade/rise in on scroll" reveal used throughout this page.
// Cheap (one observer per element, no scroll listeners) and respects
// reduced-motion by starting already-visible.
//
// Optionally takes an onReveal callback, fired exactly once the moment the
// element becomes visible (including the reduced-motion "start visible"
// path). This lets each section reuse its existing reveal observer to
// also fire a one-time analytics "section reached" event, instead of
// standing up a second observer per section just for tracking.
export function useRevealOnce<T extends HTMLElement>(
  threshold = 0.25,
  onReveal?: () => void
) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const firedRef = useRef(false);
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;

  function markVisible() {
    setVisible(true);
    if (!firedRef.current) {
      firedRef.current = true;
      onRevealRef.current?.();
    }
  }

  useEffect(() => {
    if (reducedMotion) {
      markVisible();
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          markVisible();
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, threshold]);

  return { ref, visible };
}

// Tracks 0→1 scroll progress of an element through the viewport — used for
// the "GONE BY 11" evaporation effect. Throttled to animation frames, and
// disabled entirely under reduced-motion (progress just sits at a static
// mid value so the element stays legible rather than glued to one extreme).
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [progress, setProgress] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setProgress(0.5);
      return;
    }

    const node = ref.current;
    if (!node) return;

    let ticking = false;

    function update() {
      ticking = false;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const viewportH = window.innerHeight || 1;

      // 0 when the element's top just enters the bottom of the viewport,
      // 1 once its top has scrolled up past ~35% of the viewport height —
      // gives the dissolve a short, punchy scroll range instead of
      // stretching across the entire section.
      const raw = 1 - rect.top / (viewportH * 0.7);
      setProgress(Math.min(1, Math.max(0, raw)));
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reducedMotion]);

  return { ref, progress };
}
