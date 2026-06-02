import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Long Lasting Perfume for Men in India",
  description: "Find long lasting perfumes for men in India. Shop premium House of Eon fragrances made for office, daily use and gifting.",
};

export default function SeoLandingPage() {
  return (
    <section className="section">
      <div className="container">
        <div className="seo-block">
          <div className="eyebrow">Perfume guide</div>
          <h1 className="section-title">Long Lasting Perfume for Men in India</h1>
          <p>Indian weather needs a perfume that feels fresh in the opening and remains strong through office hours, travel, and evening plans. House of Eon focuses on premium EDP-style fragrances designed for daily wear and gifting.</p>
          <p>For men who want a bold signature, RANK is positioned as a strong fragrance with citrus, spice and woody character. For fresh daily wear, Aqua Fresh gives a cleaner profile.</p>
          <div className="product-actions">
            <Link href="/products/rank-perfume-for-men" className="btn">Shop RANK</Link>
            <Link href="/products" className="btn secondary">View all perfumes</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
