import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getProductById } from "@/lib/products";
import { getCouponOffer } from "@/lib/catalogOffer";
import { formatINR } from "@/lib/money";
import { seasonalPages, type SeasonalPage } from "@/lib/seasonalPages";
import { SITE_URL, jsonLd } from "@/lib/seo";

export function seasonalMetadata(page: SeasonalPage): Metadata {
  const title = `${page.title} | House of Eon`;
  const url = `${SITE_URL}/${page.slug}`;
  return { title, description: page.description, alternates: { canonical: url }, openGraph: { title, description: page.description, url, type: "website", siteName: "House of Eon" } };
}

export default function SeasonalLanding({ page }: { page: SeasonalPage }) {
  const picks = page.picks.map(([id, heading, reason]) => ({ product: getProductById(id)!, heading, reason }));
  const url = `${SITE_URL}/${page.slug}`;
  const schema = [
    { "@context": "https://schema.org", "@type": "CollectionPage", name: page.title, description: page.description, url, mainEntity: { "@type": "ItemList", itemListElement: picks.map(({ product }, i) => ({ "@type": "ListItem", position: i + 1, name: product.name, url: `${SITE_URL}/products/${product.slug}` })) } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE_URL }, { "@type": "ListItem", position: 2, name: page.title, item: url }] },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: page.faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
  ];
  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
    <section className="seo-hero"><div className="container seo-hero-copy">
      <div className="eyebrow">{page.eyebrow}</div><h1>{page.title}</h1><p>{page.intro}</p>
      <p>By <Link href="/about">House of Eon</Link> · Recommendations from our own fragrance collection.</p>
      <div className="product-actions"><a className="btn" href="#bottles">Choose your 50ml bottle</a><Link className="btn secondary" href="/fragrances-india">Compare all fragrances</Link></div>
    </div></section>
    <section id="bottles" className="section"><div className="container">
      <div className="section-head"><h2 className="section-title">A shortlist with a reason for every scent.</h2></div>
      <div className="grid products-grid">{picks.map(({ product, heading, reason }) => <div key={product.id}>
        <h3>{heading}</h3><p>{reason}</p><ProductCard product={product} />
        <p>{formatINR(product.price)} before coupons{getCouponOffer(product.price).onSale ? ` · ${formatINR(getCouponOffer(product.price).price)} with EON20 entered at checkout` : ""}.</p>
      </div>)}</div>
      <p>EON20 applies to eligible single-bottle purchases and cannot be combined with trial redemption or multi-bottle offers. Check availability and the final total in your cart.</p>
    </div></section>
    <section className="section"><div className="container seo-guide-content">{page.sections.map(([heading, body]) => <article key={heading}><h2>{heading}</h2><p>{body}</p></article>)}
      <p><Link href="/shipping">Shipping information</Link> · <Link href="/contact">Ask about your delivery date</Link> · <Link href="/pages/return-refund-policy">Return and replacement policy</Link></p>
    </div></section>
    <section className="section seo-faq-section"><div className="container"><h2>Before you choose</h2><div className="faq-grid">{page.faqs.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></div></section>
    <section className="section"><div className="container"><h2>More ways to find your fragrance</h2><div className="situation-next-links">
      {seasonalPages.filter(item => item.slug !== page.slug).map(item => <Link key={item.slug} href={`/${item.slug}`}>{item.title}</Link>)}
      <Link href="/perfume-for/indian-wedding-men">Perfume for Indian weddings</Link><Link href="/corporate-gifting">Year-end employee and client gifts</Link><Link href="/guides/perfume-gift-for-girlfriend-boyfriend">Valentine’s and partner gifting guide</Link>
    </div><p>Unsure about the fragrance itself? <Link href="/trial-pack">Explore the Discovery Set</Link> before committing to a full bottle.</p></div></section>
  </main>;
}
