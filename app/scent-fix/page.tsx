import type { Metadata } from "next";
import { Suspense } from "react";
import ScentFixExperience from "./ScentFixExperience";
import { SITE_URL } from "@/lib/seo";

const siteUrl = SITE_URL;

export const metadata: Metadata = {
  title: "Your Perfume Didn't Fail, Your Skin Did | Scent Fix — House of Eon",
  description:
    "That ₹3,000 bottle dies by 11am because of Indian heat, not the perfume. Take the 30-second Scent Fix diagnostic, get matched with your perfume, and get 3 techniques to make it last today.",
  alternates: {
    canonical: `${siteUrl}/scent-fix`,
  },
  openGraph: {
    title: "Your Perfume Didn't Fail. Your Skin Did.",
    description:
      "30-second diagnostic: find out why your perfume dies by lunch in Indian heat, and get matched with a perfume built for it.",
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
