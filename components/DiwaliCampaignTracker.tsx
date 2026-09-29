"use client";

import { useEffect } from "react";
import {
  captureDiwaliAttribution,
  DIWALI_CAMPAIGN_ID,
  getCampaignEventParams,
} from "@/lib/campaignAttribution";
import { trackGAEvent, trackMetaEvent } from "@/lib/analytics";

export default function DiwaliCampaignTracker() {
  useEffect(() => {
    captureDiwaliAttribution();
    const campaign = getCampaignEventParams();

    trackGAEvent("view_promotion", {
      promotion_id: DIWALI_CAMPAIGN_ID,
      promotion_name: "Diwali Perfume Discovery",
      ...campaign,
    });
    // This landing page represents the campaign rather than one catalog
    // product. Keep it out of catalog-oriented ViewContent matching until
    // the visitor interacts with a specific product.
    trackMetaEvent("CustomEvent", {
      event_name: "DiwaliLandingViewed",
      content_name: "Diwali Perfume Discovery",
      content_category: "seasonal_landing_page",
      ...campaign,
    });

    function trackClick(event: MouseEvent) {
      const target = event.target as Element | null;
      const link = target?.closest<HTMLElement>("[data-diwali-cta]");
      if (!link) return;
      const ctaId = link.dataset.diwaliCta || "unknown";

      trackGAEvent("select_promotion", {
        promotion_id: DIWALI_CAMPAIGN_ID,
        promotion_name: "Diwali Perfume Discovery",
        creative_slot: ctaId,
        ...getCampaignEventParams(),
      });
      trackMetaEvent("CustomEvent", {
        event_name: "DiwaliCtaClicked",
        cta_id: ctaId,
        ...getCampaignEventParams(),
      });
    }

    document.addEventListener("click", trackClick);
    return () => document.removeEventListener("click", trackClick);
  }, []);

  return null;
}
