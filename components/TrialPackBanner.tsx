"use client";

import Image from "next/image";
import Link from "next/link";
import {
  TRIAL_PACK_PRICE_INR,
  TRIAL_VIAL_SIZE_ML,
  TRIAL_PICK_COUNT,
  TRIAL_CREDIT_EXPIRY_DAYS,
} from "@/lib/trialPack";
import { formatINR } from "@/lib/money";
import { trackTrialBannerClicked } from "@/lib/analytics";

// Shared between the homepage and product detail pages. The redemption copy
// stays explicit: the trial value becomes a one-time discount code toward a
// later order, rather than a cash refund.
export default function TrialPackBanner({ ctaSource }: { ctaSource: string }) {
  return (
    <section className="trial-banner">
      <div className="container trial-banner-inner">
        <div className="trial-banner-visual">
          <Link
            className="trial-banner-campaign-crop"
            href="/trial-pack"
            aria-label="Build your House of Eon Discovery Set"
            onClick={() => trackTrialBannerClicked(ctaSource)}
          >
            <Image
              className="trial-banner-campaign-image"
              src="/discovery-set-campaign.png"
              alt="Three House of Eon 8 ml discovery fragrances"
              fill
              sizes="(max-width: 900px) 90vw, 40vw"
            />
          </Link>
        </div>

        <div className="trial-banner-content">
          <span className="trial-banner-eyebrow">The Discovery Set</span>
          <h2>Meet your fragrance before you commit.</h2>
          <p className="trial-banner-intro">
            Choose any {TRIAL_PICK_COUNT} House of Eon fragrances and live with
            each one before selecting your full-size bottle.
          </p>

          <div className="trial-banner-offer">
            <strong>{TRIAL_PICK_COUNT} × {TRIAL_VIAL_SIZE_ML} ml</strong>
            <span aria-hidden="true" />
            <strong>{formatINR(TRIAL_PACK_PRICE_INR)}</strong>
          </div>

          <div className="trial-banner-steps" aria-label="How the Discovery Set works">
            <div>
              <span>01</span>
              <b>Choose three</b>
              <small>Create your own edit.</small>
            </div>
            <div>
              <span>02</span>
              <b>Try and choose</b>
              <small>Find your full-size fragrance.</small>
            </div>
            <div>
              <span>03</span>
              <b>Enter your order number</b>
              <small>Use the same phone. ₹249 comes off.</small>
            </div>
          </div>

          <div className="trial-banner-redeem-note">
            <b>No coupon to search for.</b>
            <span>
              At full-size checkout, enter your Trial Pack order number. If the
              phone number matches, ₹249 is deducted automatically.
            </span>
          </div>

          <div className="trial-banner-action">
            <Link
              href="/trial-pack"
              className="trial-banner-cta"
              onClick={() => trackTrialBannerClicked(ctaSource)}
            >
              Build Your Discovery Set
              <span aria-hidden="true">→</span>
            </Link>
            <p>Redeem once within {TRIAL_CREDIT_EXPIRY_DAYS} days.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
