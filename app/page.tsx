import type { Metadata } from "next";
import { products } from "@/lib/products";
import { SITE_URL } from "@/lib/seo";
import ImmersiveHome from "@/components/immersive/ImmersiveHome";
const siteUrl = SITE_URL;
const brandName = "House of Eon";
export const metadata: Metadata = {
  title:
    "House of Eon | Best Long Lasting Perfumes for Men & Women in India",
  description:
    "Shop modern, minimal and long lasting perfumes from House of Eon. Premium Indian perfume brand for men and women. Luxury fragrance, youthful style, secure Razorpay checkout and fast shipping.",
  keywords: [
    "best perfume for men in India",
    "long lasting perfume for men",
    "premium perfume India",
    "luxury perfume for men",
    "perfume for women India",
    "Gen Z perfume India",
    "daily wear perfume",
    "office perfume for men",
    "House of Eon perfume",
    "RANK perfume",
  ],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "House of Eon | Modern Long Lasting Perfumes",
    description:
      "Discover premium Indian perfumes crafted for confidence, daily wear and modern youth style.",
    url: siteUrl,
    siteName: brandName,
    type: "website",
    images: [{ url: `${siteUrl}/campaign/desert-eclipse.webp`, alt: "House of Eon — Beyond the ordinary" }],
  },
  twitter: { card: "summary_large_image", title: "House of Eon | Beyond the ordinary", description: "Distinctive perfumes. Indian soul. A presence they remember.", images: [`${siteUrl}/campaign/desert-eclipse.webp`] },
};


const collectionSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "House of Eon Signature Collection",
  itemListElement: products.map((product, index) => ({
    "@type": "ListItem", position: index + 1,
    item: { "@type": "Product", name: product.name, description: product.description,
      image: `${siteUrl}${product.image}`, brand: { "@type": "Brand", name: brandName },
      offers: { "@type": "Offer", priceCurrency: "INR", price: product.price, url: `${siteUrl}/products/${product.slug}` }
    }
  }))
};
export default function HomePage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema).replace(/</g, "\\u003c") }} /><ImmersiveHome /></>;
}
