import type { Metadata } from "next";
import Link from "next/link";
import { situations } from "@/lib/situations";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Find a Perfume for the Moment | House of Eon",
  description:
    "Choose perfume by the situation that matters: humid weather, office AC, first dates, Indian weddings, scent taste and budget.",
  alternates: { canonical: `${SITE_URL}/perfume-for` },
  openGraph: {
    title: "Find a Perfume for the Moment | House of Eon",
    description:
      "Practical perfume answers for Indian weather, work, dates, weddings and personal taste.",
    url: `${SITE_URL}/perfume-for`,
    siteName: "House of Eon",
    type: "website",
  },
};

const collectionSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Perfume by situation",
  description:
    "Practical perfume recommendations organised by real-life situation.",
  url: `${SITE_URL}/perfume-for`,
  hasPart: situations.map((situation) => ({
    "@type": "WebPage",
    name: situation.title,
    url: `${SITE_URL}/perfume-for/${situation.slug}`,
  })),
};

export default function SituationsIndexPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <section className="situation-hub-hero">
        <div className="container situation-hub-hero-inner">
          <div className="eyebrow">Shop by situation</div>
          <h1>Don&apos;t search for the best perfume. Find the right one for now.</h1>
          <p>
            Weather, room, clothes and taste change how a fragrance works.
            Choose the real-life problem and get a direct answer, a spray plan
            and the closest House of Eon matches.
          </p>
        </div>
      </section>

      <section className="section situation-hub-section">
        <div className="container">
          <div className="situation-grid">
            {situations.map((situation, index) => (
              <Link
                href={`/perfume-for/${situation.slug}`}
                className="situation-card"
                key={situation.slug}
              >
                <span className="situation-card-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="eyebrow">{situation.eyebrow}</div>
                <h2>{situation.title}</h2>
                <p>{situation.summary}</p>
                <b>Get the answer →</b>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
