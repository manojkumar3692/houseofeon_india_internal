"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { trackGAEvent } from "@/lib/analytics";

export default function SituationPageTracker({
  slug,
  searchIntent,
}: {
  slug: string;
  searchIntent: string;
}) {
  useEffect(() => {
    trackGAEvent("view_situation_page", {
      situation_slug: slug,
      search_intent: searchIntent,
    });
  }, [searchIntent, slug]);

  return null;
}

export function SituationCtaLink({
  href,
  className,
  slug,
  placement,
  children,
}: {
  href: string;
  className?: string;
  slug: string;
  placement: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() =>
        trackGAEvent("situation_cta_click", {
          situation_slug: slug,
          cta_placement: placement,
          destination: href,
        })
      }
    >
      {children}
    </Link>
  );
}
