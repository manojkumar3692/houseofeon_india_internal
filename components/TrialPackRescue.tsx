"use client";

import { useEffect } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/money";
import { TRIAL_PACK_PRICE_INR } from "@/lib/trialPack";
import {
  trackTrialRescueShown,
  trackTrialRescueClicked,
  trackTrialRescueDismissed,
} from "@/lib/analytics";

// Checkout abandonment rescue card. Deliberately dumb/controlled — all the
// "should this show right now" logic (which signal fired, one-per-session
// cap, cart non-empty, payment not already succeeded) lives in
// app/checkout/page.tsx, which is the only place with the context to decide
// that safely. This component just renders when told to and reports what
// happened.
export default function TrialPackRescue({
  trigger,
  onDismiss,
}: {
  trigger: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    trackTrialRescueShown(trigger);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDismiss() {
    trackTrialRescueDismissed(trigger);
    onDismiss();
  }

  function handleClick() {
    trackTrialRescueClicked(trigger);
    // onDismiss isn't called here — navigating to /trial-pack unmounts
    // checkout anyway, and letting the click event finish tracking first
    // (Link navigation, not a full reload) matters more than tidying state.
  }

  return (
    <div className="trial-rescue-backdrop" onClick={handleDismiss}>
      <div
        className="trial-rescue-card"
        role="dialog"
        aria-label="Trial pack offer"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="trial-rescue-close"
          aria-label="Close"
          onClick={handleDismiss}
        >
          ×
        </button>

        <span className="trial-rescue-eyebrow">Before you go</span>
        <h3>Not ready for the full bottle?</h3>
        <p>
          Try 3 scents in {formatINR(TRIAL_PACK_PRICE_INR)} total — and that
          order number becomes a one-time {formatINR(TRIAL_PACK_PRICE_INR)}{" "}
          credit toward a full-size bottle later.
        </p>

        <Link href="/trial-pack" className="btn" onClick={handleClick}>
          Try 3 scents for {formatINR(TRIAL_PACK_PRICE_INR)} →
        </Link>
        <button type="button" className="trial-rescue-secondary" onClick={handleDismiss}>
          No thanks, continue checkout
        </button>
      </div>
    </div>
  );
}
