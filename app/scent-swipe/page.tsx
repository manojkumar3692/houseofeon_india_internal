import type { Metadata } from "next";
import SwipeGame from "@/components/SwipeGame";
import { SITE_URL } from "@/lib/seo";

const siteUrl = SITE_URL;

export const metadata: Metadata = {
  title: "Scent Swipe Game | Find Your Perfume Match | House of Eon",
  description:
    "Swipe through 8 quick scenarios and get matched with your House of Eon perfume — plus unlock a 20% discount you can share straight to Instagram or Facebook.",
  alternates: {
    canonical: `${siteUrl}/scent-swipe`,
  },
  openGraph: {
    title: "Scent Swipe Game | House of Eon",
    description:
      "Swipe right on the moments that feel like you and get matched with your signature House of Eon perfume, plus a 20% off code.",
    url: `${siteUrl}/scent-swipe`,
    type: "website",
  },
};

export default function ScentSwipePage() {
  return (
    <section className="section">
      <SwipeGame />
    </section>
  );
}
