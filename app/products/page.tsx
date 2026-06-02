import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/products";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://houseofeon.in";

export const metadata: Metadata = {
  title: "Shop Long Lasting Perfumes for Men & Women in India | House of Eon",
  description:
    "Shop House of Eon premium perfumes for men and women. Modern, minimal and long lasting fragrances for office, college, parties, gifting and daily wear.",
  alternates: {
    canonical: `${siteUrl}/products`,
  },
  openGraph: {
    title: "Shop House of Eon Perfumes",
    description:
      "Modern long lasting perfumes for India’s new generation. Secure Razorpay checkout and easy order tracking.",
    url: `${siteUrl}/products`,
    type: "website",
  },
};

export default function ProductsPage() {
  return (
    <>
      <section className="products-hero">
        <div className="container products-hero-inner">
          <div>
            <div className="eyebrow">Shop Fragrances</div>
            <h1>Find the scent that makes them remember you.</h1>
            <p>
              Explore modern, minimal and long lasting perfumes crafted for
              Indian weather, everyday confidence and Gen Z style.
            </p>

            <div className="home-search-tags">
              <span>Men</span>
              <span>Women</span>
              <span>Office</span>
              <span>Party</span>
              <span>Gifting</span>
            </div>
          </div>

          <div className="products-hero-panel">
            <span>Starting from</span>
            <strong>Premium EDP</strong>
            <p>Secure checkout · WhatsApp support · Easy tracking</p>
          </div>
        </div>
      </section>

      <section className="section products-list-section">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow">All Perfumes</div>
              <h2 className="section-title">Minimal bottles. Maximum presence.</h2>
            </div>

            <Link href="/long-lasting-perfume-for-men-india" className="text-link">
              Perfume buying guide →
            </Link>
          </div>

          <div className="grid products-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="section products-seo-strip">
        <div className="container">
          <h2>Premium perfumes for men and women in India</h2>
          <p>
            House of Eon perfumes are created for people who want a clean,
            stylish and long lasting fragrance for daily wear, office, college,
            parties and gifting. Choose your perfume, add it to cart and pay
            securely online.
          </p>
        </div>
      </section>
    </>
  );
}