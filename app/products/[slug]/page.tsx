import { getCatalogOffer } from "@/lib/catalogOffer";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailClient from "./product-detail-client";
import ProductViewTracker from "@/components/ProductViewTracker";
import { getProductBySlug, products } from "@/lib/products";
import { getCatalogAvailability } from "@/lib/catalogAvailability";
import { SITE_URL, jsonLd } from "@/lib/seo";
import EonPilotWidget from '@/components/EonPilotWidget';

const siteUrl = SITE_URL;
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) return {};

  return {
    title: product.seoTitle,
    description: product.seoDescription,
    alternates: {
      canonical: `${siteUrl}/products/${product.slug}`,
    },
    openGraph: {
      title: product.seoTitle,
      description: product.seoDescription,
      url: `${siteUrl}/products/${product.slug}`,
      type: "website",
      images: [{ url: `${siteUrl}${product.image}`, alt: `${product.name} ${product.size} perfume` }],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) notFound();

  const availability = await getCatalogAvailability();
  const inStock = availability?.[product.id];
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${siteUrl}/products/${product.slug}#product`,
    url: `${siteUrl}/products/${product.slug}`,
    sku: product.id,
    size: product.size,
    category: "Perfume",
    additionalProperty: [
      { "@type": "PropertyValue", name: "Concentration", value: product.concentration },
      { "@type": "PropertyValue", name: "Fragrance notes", value: product.notes.join(", ") },
    ],
    name: product.name,
    description: product.description,
    image: `${siteUrl}${product.image}`,
    brand: {
      "@type": "Brand",
      name: "House of Eon",
    },
    ...(product.reviews && product.reviews.length > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: (
              product.reviews.reduce((sum, r) => sum + r.rating, 0) /
              product.reviews.length
            ).toFixed(1),
            reviewCount: product.reviews.length,
          },
          review: product.reviews.map((review) => ({
            "@type": "Review",
            author: { "@type": "Person", name: review.name },
            reviewRating: {
              "@type": "Rating",
              ratingValue: review.rating,
            },
            reviewBody: review.text,
          })),
        }
      : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: getCatalogOffer(product.price, product.id).price,
      ...(inStock === undefined ? {} : { availability: `https://schema.org/${inStock ? "InStock" : "OutOfStock"}` }),
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${siteUrl}/#organization` },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "INR" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
      },
      url: `${siteUrl}/products/${product.slug}`,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "Perfumes",
        item: `${siteUrl}/products`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${siteUrl}/products/${product.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
      />
      <ProductViewTracker product={product} />
      <ProductDetailClient product={product} />
      {product.id === 'arctic-wave' && process.env.NEGOTIATION_WIDGET_ENABLED === 'true' &&
        /^[a-f0-9-]{36}$/i.test(process.env.NEGOTIATION_PUBLIC_KEY || '') &&
        <EonPilotWidget key={product.id} publicKey={process.env.NEGOTIATION_PUBLIC_KEY!} />}
    </>
  );
}
