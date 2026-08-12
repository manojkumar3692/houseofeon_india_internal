import type { Metadata } from "next";
import { Suspense } from "react";
import ScentFixExperience from "./ScentFixExperience";
import { SITE_URL } from "@/lib/seo";

const siteUrl = SITE_URL;

export const metadata: Metadata = {
  title: "Sprayed at 9. Gone by 11. Here's Why. | House of Eon",
  description:
    "House of Eon fragrances are formulated with 30-35% pure fragrance oil — no fancy box, no celebrity contract, no brand tax. ₹999. Find your match in one tap.",
  alternates: {
    canonical: `${siteUrl}/scent-fix`,
  },
  openGraph: {
    title: "Same Heat. Same Skin. Built Different. | House of Eon",
    description:
      "30-35% pure fragrance oil, ₹999. Find out why House of Eon lasts through Indian heat when a ₹3,000 bottle doesn't.",
    url: `${siteUrl}/scent-fix`,
    type: "website",
  },
  robots: {
    // A real, indexable page — just built to pay off one specific ad
    // promise for cold Meta traffic rather than to rank organically.
    index: true,
    follow: true,
  },
};

export default function ScentFixPage() {
  return (
    <Suspense fallback={null}>
      <ScentFixExperience />
    </Suspense>
  );
}
