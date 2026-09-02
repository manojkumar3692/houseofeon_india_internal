import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { guides, getGuideBySlug } from "@/lib/guides";
import { getProductById } from "@/lib/products";
import { SITE_URL } from "@/lib/seo";

const siteUrl = SITE_URL;

export async function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) return {};

  return {
    title: guide.seoTitle,
    description: guide.seoDescription,
    keywords: guide.seoKeywords,
    alternates: {
      canonical: `${siteUrl}/guides/${guide.slug}`,
    },
    openGraph: {
      title: guide.seoTitle,
      description: guide.seoDescription,
      url: `${siteUrl}/guides/${guide.slug}`,
      siteName: "House of Eon",
      type: "article",
    },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) notFound();

  const relatedProducts = guide.relatedProductIds
    .map((id) => getProductById(id))
    .filter(Boolean);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.seoDescription,
    publisher: {
      "@type": "Organization",
      name: "House of Eon",
    },
    mainEntityOfPage: `${siteUrl}/guides/${guide.slug}`,
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "Guides",
        item: `${siteUrl}/guides`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: guide.title,
        item: `${siteUrl}/guides/${guide.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <section className="seo-hero">
        <div className="container seo-hero-grid">
          <div className="seo-hero-copy">
            <Link href="/guides" className="back-link">
              ← All guides
            </Link>

            <div className="eyebrow">{guide.eyebrow}</div>

            <h1>{guide.heroTitle}</h1>

            <p>{guide.heroSubtitle}</p>

            <div className="product-actions">
              <Link href="/products" className="btn">
                Shop perfumes
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section seo-guide-section">
        <div className="container seo-guide-grid">
          <div>
            <div className="eyebrow">In This Guide</div>
            <h2>{guide.title}</h2>
          </div>

          <div className="seo-guide-content">
            {guide.sections.map((section, index) => (
              <article key={section.heading}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{section.heading}</h3>
                {section.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </article>
            ))}
          </div>
        </div>
      </section>

      {guide.campaignLink ? (
        <section className="section guide-campaign-section">
          <div className="container">
            <div className="guide-campaign-card">
              <div>
                <div className="eyebrow">The Diwali Discovery</div>
                <h2>{guide.campaignLink.text}</h2>
              </div>
              <Link href={guide.campaignLink.href} className="btn">
                {guide.campaignLink.label} →
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {relatedProducts.length ? (
        <section className="section seo-products-section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="eyebrow">Related Perfumes</div>
                <h2 className="section-title">Shop what's mentioned here.</h2>
              </div>
              <Link href="/products" className="text-link">
                View all perfumes →
              </Link>
            </div>

            <div className="grid products-grid">
              {relatedProducts.map((product) => (
                <ProductCard key={product!.id} product={product!} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section seo-faq-section">
        <div className="container">
          <div className="section-head center">
            <div>
              <div className="eyebrow">FAQ</div>
              <h2 className="section-title">Common questions</h2>
            </div>
          </div>

          <div className="faq-grid">
            {guide.faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
