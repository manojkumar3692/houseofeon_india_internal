"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trackScentFixViewContent } from "@/lib/analytics";
import OpeningStory from "./sections/OpeningStory";
import TheNumber from "./sections/TheNumber";
import PriceReframe from "./sections/PriceReframe";
import Longevity from "./sections/Longevity";
import ScentMatcher from "./sections/ScentMatcher";
import TrustClose from "./sections/TrustClose";
import FinalCta from "./sections/FinalCta";
import StickyCta from "./sections/StickyCta";
import styles from "./scent-fix.module.css";

export default function ScentFixExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const section2Ref = useRef<HTMLElement | null>(null);
  const matcherRef = useRef<HTMLElement | null>(null);

  const [sharedProductId] = useState<string | null>(
    searchParams.get("result")
  );

  const viewContentFiredRef = useRef(false);

  useEffect(() => {
    if (viewContentFiredRef.current) return;
    viewContentFiredRef.current = true;
    trackScentFixViewContent();
  }, []);

  // The body is cream sitewide (see globals.css) — this page is a real
  // dark-to-light editorial story, not a dark card floating on a light
  // page, so paint the body black for as long as this route is mounted.
  useEffect(() => {
    const previous = document.body.style.background;
    document.body.style.background = "#0a0a0a";
    return () => {
      document.body.style.background = previous;
    };
  }, []);

  function updateShareUrl(productId: string) {
    const params = new URLSearchParams(window.location.search);
    params.set("result", productId);
    router.replace(`/scent-fix?${params.toString()}`, { scroll: false });
  }

  return (
    <div className={styles.page}>
      <OpeningStory nextRef={section2Ref} />
      <TheNumber />
      <PriceReframe />
      <Longevity />
      <ScentMatcher
        matcherRef={matcherRef}
        sharedProductId={sharedProductId}
        onUpdateShareUrl={updateShareUrl}
      />
      <TrustClose />
      <FinalCta matcherRef={matcherRef} />
      <StickyCta matcherRef={matcherRef} />
    </div>
  );
}
