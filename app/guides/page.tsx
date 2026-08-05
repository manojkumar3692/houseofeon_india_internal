import type { Metadata } from "next";
import Link from "next/link";
import { guides } from "@/lib/guides";
import { SITE_URL } from "@/lib/seo";

const siteUrl = SITE_URL;

export const metadata: Metadata = {
  title: "Perfume Guides & Tips | House of Eon",
  description:
    "Honest, practical perfume guides — concentration explained, how to make fragrance last longer, and gifting picks — from House of Eon.",
  alternates: {
    canonical: `${siteUrl}/guides`,
  },
  openGraph: {
    title: "Perfume Guides & Tips | House of Eon",
    description:
      "Honest, practical perfume guides from House of Eon — concentration explained, longevity tips and gifting picks.",
    url: `${siteUrl}/guides`,
    siteName: "House of Eon",
    type: "website",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
    { "@type": "ListItem", position: 2, name: "Guides", item: `${siteUrl}/guides` },
  ],
};

export default function GuidesIndexPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <section className="seo-hero">
        <div className="container seo-hero-grid">
          <div className="seo-hero-copy">
            <div className="eyebrow">Perfume Guides</div>

            <h1>Honest perfume guides, no fluff.</h1>

            <p>
              Straight answers on concentration, longevity and gifting —
              written to actually help you choose, not just to fill a page.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid">
            {guides.map((guide) => (
              <Link
                href={`/guides/${guide.slug}`}
                key={guide.slug}
                className="card"
                style={{ display: "block" }}
              >
                <div className="eyebrow">{guide.eyebrow}</div>
                <h3 style={{ margin: "10px 0" }}>{guide.title}</h3>
                <p className="muted">{guide.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
