import type { Metadata } from "next";
import ScentQuiz from "@/components/ScentQuiz";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://houseofeon.in";

export const metadata: Metadata = {
  title: "Scent Finder Quiz | Find Your Perfect Perfume | House of Eon",
  description:
    "Answer 3 quick questions and find your signature House of Eon perfume — plus unlock a 20% launch discount.",
  alternates: {
    canonical: `${siteUrl}/scent-finder`,
  },
  openGraph: {
    title: "Find Your Signature Scent | House of Eon",
    description:
      "Take the 30-second Scent Finder quiz and get matched with your House of Eon perfume, plus a 20% off code.",
    url: `${siteUrl}/scent-finder`,
    type: "website",
  },
};

export default function ScentFinderPage() {
  return (
    <section className="section">
      <ScentQuiz />
    </section>
  );
}
