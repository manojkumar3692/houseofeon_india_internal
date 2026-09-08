import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import SituationPageTracker, { SituationCtaLink } from "@/components/SituationPageTracker";
import { getProductById } from "@/lib/products";
import { getSituationBySlug, situations } from "@/lib/situations";
import { SITE_URL } from "@/lib/seo";

export function generateStaticParams() {
  return situations.map((situation) => ({ slug: situation.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const situation = getSituationBySlug(slug);
  if (!situation) return {};

  const url = `${SITE_URL}/perfume-for/${situation.slug}`;
  return {
    title: situation.seoTitle,
    description: situation.seoDescription,
    keywords: [situation.searchIntent, situation.title, "House of Eon perfume"],
    alternates: { canonical: url },
    openGraph: {
      title: situation.seoTitle,
      description: situation.seoDescription,
      url,
      siteName: "House of Eon",
      type: "article",
    },
  };
}

export default async function SituationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const situation = getSituationBySlug(slug);
  if (!situation) notFound();

  const relatedProducts = situation.productIds
    .map((id) => getProductById(id))
    .filter(Boolean);
  const url = `${SITE_URL}/perfume-for/${situation.slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: situation.title,
    description: situation.seoDescription,
    mainEntityOfPage: url,
    publisher: { "@type": "Organization", name: "House of Eon" },
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: situation.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Perfume by situation", item: `${SITE_URL}/perfume-for` },
      { "@type": "ListItem", position: 3, name: situation.title, item: url },
    ],
  };

  return (
    <>
      <SituationPageTracker slug={situation.slug} searchIntent={situation.searchIntent} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <section className="situation-hero">
        <div className="container situation-hero-grid">
          <div>
            <Link href="/perfume-for" className="back-link">← All situations</Link>
            <div className="eyebrow">{situation.eyebrow}</div>
            <h1>{situation.title}</h1>
            <p>{situation.summary}</p>
          </div>
          <aside className="situation-answer-card">
            <span>The 20-second answer</span>
            <p>{situation.shortAnswer}</p>
            <Link href="#best-matches" className="btn">See the best matches ↓</Link>
          </aside>
        </div>
      </section>

      <section className="section situation-advice-section">
        <div className="container situation-advice-grid">
          <div className="situation-advice-intro">
            <div className="eyebrow">The useful answer</div>
            <h2>Choose for the situation, then choose the scent.</h2>
          </div>
          <div className="situation-advice-list">
            {situation.sections.map((section, index) => (
              <article key={section.heading}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{section.heading}</h3>
                {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="best-matches" className="section situation-products-section">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow">Best matches</div>
              <h2 className="section-title">Three ways to wear the answer.</h2>
            </div>
            <SituationCtaLink href="/trial-pack" className="text-link" slug={situation.slug} placement="product_header">Try three for ₹249 →</SituationCtaLink>
          </div>
          <div className="grid products-grid">
            {relatedProducts.map((product) => (
              <ProductCard key={product!.id} product={product!} />
            ))}
          </div>
        </div>
      </section>

      <section className="section situation-proof-section">
        <div className="container situation-proof-card">
          <div>
            <div className="eyebrow">Still deciding?</div>
            <h2>Wear the answer before you buy the bottle.</h2>
            <p>Choose any three 8ml fragrances for ₹249, then redeem the full ₹249 on an eligible 50ml bottle.</p>
          </div>
          <SituationCtaLink href="/trial-pack" className="btn" slug={situation.slug} placement="trial_pack_card">Build my trial pack →</SituationCtaLink>
        </div>
      </section>

      <section className="section seo-faq-section">
        <div className="container">
          <div className="section-head center">
            <div><div className="eyebrow">Straight answers</div><h2 className="section-title">Common questions</h2></div>
          </div>
          <div className="faq-grid">
            {situation.faqs.map((faq) => (
              <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>
            ))}
          </div>
        </div>
      </section>

      <section className="section situation-next-section">
        <div className="container">
          <div className="section-head">
            <div><div className="eyebrow">Another situation?</div><h2 className="section-title">Keep choosing by context.</h2></div>
            <Link href="/perfume-for" className="text-link">See every situation →</Link>
          </div>
          <div className="situation-next-links">
            {situations.filter((item) => item.slug !== situation.slug).slice(0, 4).map((item) => (
              <Link href={`/perfume-for/${item.slug}`} key={item.slug}>{item.title} <span>→</span></Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
