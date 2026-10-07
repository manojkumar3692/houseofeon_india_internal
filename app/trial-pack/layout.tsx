import type { Metadata } from "next";
import { SITE_URL, jsonLd } from "@/lib/seo";
import { TRIAL_PACK_PRICE_INR, TRIAL_FULL_SIZE_PRICE_INR } from "@/lib/trialPack";

const title = `Trial Pack ₹${TRIAL_PACK_PRICE_INR} | Unlock 50ML for ₹${TRIAL_FULL_SIZE_PRICE_INR} | House of Eon`;
const description = `Try 3 House of Eon fragrances, 8ML each, for ₹${TRIAL_PACK_PRICE_INR}. Unlock 50ML for ₹${TRIAL_FULL_SIZE_PRICE_INR} using your paid trial order number and matching phone within 30 days. One use; no offer stacking.`;
const url = `${SITE_URL}/trial-pack`;
const image = `${SITE_URL}/discovery-set-campaign-299.png`;
export const metadata: Metadata = {
  title, description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "website", siteName: "House of Eon", images: [{ url: image, alt: "Try 3 for ₹299. Unlock 50ML for ₹749." }] },
  twitter: { card: "summary_large_image", title, description, images: [image] },
};

export default function TrialPackLayout({ children }: { children: React.ReactNode }) {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({
      "@context": "https://schema.org", "@type": "Product",
      name: "House of Eon Discovery Set — 3 × 8ML", description, image, url,
      brand: { "@type": "Brand", name: "House of Eon" },
      offers: { "@type": "Offer", url, priceCurrency: "INR", price: TRIAL_PACK_PRICE_INR },
    }) }} />
    {children}
  </>;
}
