"use client";

import Link from "next/link";
import {
  TRIAL_PACK_PRICE_INR,
  TRIAL_VIAL_SIZE_ML,
  TRIAL_PICK_COUNT,
  TRIAL_CREDIT_EXPIRY_DAYS,
} from "@/lib/trialPack";
import { formatINR } from "@/lib/money";
import { trackTrialBannerClicked } from "@/lib/analytics";

// Shared between the homepage and (lower down, away from the primary ₹999
// CTA — see product-detail-client.tsx) the product detail page. Visually
// bold on purpose — this is meant to be the "cool," confident explainer —
// but the copy is deliberately NOT modeled on the common "100% refund, no
// questions asked" pattern other brands use for this kind of banner: House
// of Eon's trial pack is a one-time discount CODE toward a later order, not
// a cash refund, so step 3/4 say exactly that rather than borrowing a
// refund promise we don't actually make.
export default function TrialPackBanner({ ctaSource }: { ctaSource: string }) {
  return (
    <section className="trial-banner">
      <div className="container trial-banner-inner">
        <div className="trial-banner-head">
          <h2>
            Try our fragrances,
            <br />
            risk free.
          </h2>
          <Link
            href="/trial-pack"
            className="btn trial-banner-cta"
            onClick={() => trackTrialBannerClicked(ctaSource)}
          >
            Try now
          </Link>
          <span className="trial-banner-fineprint">
            *Discount code, not a cash refund
          </span>
        </div>

        <div className="trial-banner-steps">
          <div>
            <span className="trial-banner-step-num">1</span>
            <b>Pick {TRIAL_PICK_COUNT} scents</b>
            <span>
              {TRIAL_VIAL_SIZE_ML}ml vials each, {formatINR(TRIAL_PACK_PRICE_INR)}{" "}
              total.
            </span>
          </div>
          <div>
            <span className="trial-banner-step-num">2</span>
            <b>Find your favorite</b>
            <span>Live with them for a few days before deciding.</span>
          </div>
          <div>
            <span className="trial-banner-step-num">3</span>
            <b>Redeem full value</b>
            <span>
              Your order number = a {formatINR(TRIAL_PACK_PRICE_INR)} code
              toward any full-size bottle.
            </span>
          </div>
          <div>
            <span className="trial-banner-step-num">4</span>
            <b>Within {TRIAL_CREDIT_EXPIRY_DAYS} days</b>
            <span>Same phone number, one-time use.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
