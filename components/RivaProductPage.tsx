import Link from "next/link";
import { riva, rivaPath } from "@/lib/upcomingProducts";
import { SITE_URL, jsonLd } from "@/lib/seo";
import { RivaVisual } from "./RivaPreview";
import ProductImageGallery from "./ProductImageGallery";
import RivaScentJourney from "./RivaScentJourney";
import RivaWaitlistForm from "./RivaWaitlistForm";
import styles from "@/app/products/[slug]/product-detail.module.css";

export default function RivaProductPage() {
  const url = `${SITE_URL}${rivaPath}`;
  const schema = {
    "@context": "https://schema.org", "@type": "Product", "@id": `${url}#product`,
    name: riva.name, description: riva.description, url, category: "Women's perfume",
    additionalProperty: [{ "@type": "PropertyValue", name: "Fragrance notes", value: riva.notes.join(", ") }],
    brand: { "@type": "Brand", name: "House of Eon" },
    ...(riva.image ? { image: `${SITE_URL}${riva.image}` } : {}),
    // No Offer, price, rating or in-stock claim until RIVA is available to buy.
  };
  const breadcrumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Perfumes for women", item: `${SITE_URL}/best-perfume-for-women-in-india` },
    { "@type": "ListItem", position: 3, name: "RIVA", item: url },
  ] };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />
    <section className="product-detail-hero product-detail-hero-modern">
      <div className="container product-detail-grid">
        <div className="product-detail-visual product-detail-visual-image">
          <div className="detail-glow detail-glow-one" /><div className="detail-glow detail-glow-two" />
          {riva.image ? <ProductImageGallery preserveArtwork product={{ ...riva, shortName: riva.name, size: "", concentration: "" }} /> : <RivaVisual />}
        </div>
        <div className="product-detail-copy">
          <Link href="/best-perfume-for-women-in-india" className="back-link">← Back to women&apos;s perfumes</Link>
          <div className="eyebrow">House of Eon Perfume</div>
          <span className="pill">Women · Coming soon</span>
          <h1>RIVA</h1><p className="product-detail-tagline">A new chapter for her.</p>
          <p className={styles.valueLine}>Introducing our upcoming women&apos;s perfume.</p>
          <p className="lead">{riva.description}</p>
          <div className="notes-wrap" aria-label="RIVA fragrance notes">{riva.notes.map(note => <span className="pill" key={note}>{note}</span>)}</div>
          <div className={styles.quickRead}><span>Waitlist open</span><span>No payment required</span></div>
          <RivaWaitlistForm />
          <RivaScentJourney profile={riva.scentProfile} />
        </div>
      </div>
    </section>
    <section className={`section ${styles.highlightSection}`}><div className="container">
      <div className="section-head center"><div><div className="eyebrow">Meet your next fragrance</div><h2 className="section-title">A closer look at RIVA.</h2></div></div>
      <div className={styles.highlightGrid}>{riva.highlights.map(highlight => <article key={highlight.title}><h3>{highlight.title}</h3><p>{highlight.text}</p></article>)}</div>
    </div></section>
    <section className={`section ${styles.scentSection}`}><div className="container">
      <div className="section-head center"><div><div className="eyebrow">Scent Profile</div><h2 className="section-title">What does RIVA smell like?</h2></div></div>
      <div className={styles.scentGrid}>
        <article><span>Opening</span><p>{riva.scentProfile.opening}</p></article>
        <article><span>Heart</span><p>{riva.scentProfile.heart}</p></article>
        <article><span>Dry Down</span><p>{riva.scentProfile.dryDown}</p></article>
        <article><span>Performance</span><p>{riva.scentProfile.performance}</p></article>
      </div>
    </div></section>
    <section className="section product-story-section"><div className="container product-story-grid">
      <div><div className="eyebrow">Fragrance Mood</div><h2>A new chapter for her.</h2></div>
      <div><p>{riva.longDescription}</p><p>Bottle size, price and launch date will be revealed here. Join the waitlist for launch news straight to your inbox.</p></div>
    </div></section>
    <section className="section product-info-section"><div className="container product-info-grid">
      <article><span>01</span><h3>Join the waitlist</h3><p>Share your email and agree to receive RIVA launch news.</p></article>
      <article><span>02</span><h3>Hear when it launches</h3><p>Our team will contact the waitlist when RIVA is ready.</p></article>
      <article><span>03</span><h3>Decide when it arrives</h3><p>No payment or commitment now. Joining does not reserve stock or create a pre-order.</p></article>
    </div></section>
    <section className="section"><div className="container"><h2>About the RIVA waitlist</h2><div className="faq-grid">
      <details><summary>Can I buy RIVA now?</summary><p>RIVA is coming soon. For now, you can join the email waitlist. Orders are not open yet.</p></details>
      <details><summary>When will RIVA launch?</summary><p>The launch date has not been announced. Join the waitlist to hear when it is available.</p></details>
      <details><summary>How do I leave the waitlist?</summary><p>Email <a href="mailto:orders@houseofeon.in?subject=Remove%20me%20from%20the%20RIVA%20waitlist">orders@houseofeon.in</a> from the address you signed up with and ask to be removed.</p></details>
    </div></div></section>
    <div className="mobile-sticky-buy product-mobile-buy"><div><b>RIVA</b><span>Coming soon · Women</span></div><a className="btn" href="#riva-waitlist">Join waitlist</a></div>
  </>;
}
