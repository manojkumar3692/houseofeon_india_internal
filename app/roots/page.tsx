import type { Metadata } from "next";
import RootsExperience from "@/components/RootsExperience";
import { rootsChapter01 } from "@/lib/roots";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "House of Eon ROOTS / 01 — Tamil Nadu | ALAI & VEPPAM",
  description:
    "Discover House of Eon ROOTS / 01: Tamil Nadu. ALAI and VEPPAM interpret the sea and heat through modern Indian niche fragrance.",
  keywords: [
    "House of Eon Roots",
    "ALAI perfume",
    "VEPPAM perfume",
    "Tamil Nadu inspired perfume",
    "Indian fragrance house",
  ],
  alternates: { canonical: `${SITE_URL}/roots` },
  openGraph: {
    title: "ROOTS / 01 — The Sea. The Heat.",
    description: "Two scents. One land. Modern India, interpreted through fragrance.",
    url: `${SITE_URL}/roots`,
    siteName: "House of Eon",
    type: "website",
    images: [rootsChapter01.products[0].image],
  },
};

const collectionSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "House of Eon ROOTS / 01 — Tamil Nadu",
  description: "Modern India, interpreted through fragrance. The sea and the heat in two cultural editions.",
  url: `${SITE_URL}/roots`,
  mainEntity: {
    "@type": "ItemList",
    itemListElement: rootsChapter01.products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}/products/${product.slug}`,
      name: `${product.name} / ${product.tamilName}`,
    })),
  },
};

export default function RootsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <RootsExperience chapter={rootsChapter01} />
    </>
  );
}
