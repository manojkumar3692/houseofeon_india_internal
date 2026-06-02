import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/products";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://houseofeon.in";
const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || "House of Eon";

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
  },
};

const bestSellers = products.slice(0, 3);

const productSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "House of Eon Best Selling Perfumes",
  itemListElement: bestSellers.map((product, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Product",
      name: product.name,
      description: product.description,
      brand: {
        "@type": "Brand",
        name: "House of Eon",
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "INR",
        price: product.price,
        availability: "https://schema.org/InStock",
        url: `${siteUrl}/products/${product.slug}`,
      },
    },
  })),
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Which is the best long lasting perfume for men in India?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "House of Eon perfumes are crafted for modern Indian daily wear, office use, gifting and confident evening style. Choose a perfume based on your preferred notes, usage and personality.",
      },
    },
    {
      "@type": "Question",
      name: "Are House of Eon perfumes suitable for daily use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, House of Eon perfumes are designed for daily wear, office wear, college, parties and special occasions.",
      },
    },
    {
      "@type": "Question",
      name: "How can I buy House of Eon perfume online?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can choose your perfume, add it to cart, enter your delivery address and pay securely using Razorpay.",
      },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <div className="eyebrow">Modern Indian Perfume Brand</div>

            <h1>
              Smell expensive.
              <span> Feel unstoppable.</span>
            </h1>

            <p className="lead">
              Long lasting perfumes for India’s new generation — minimal,
              premium and made for everyday confidence.
            </p>

            <div className="home-search-tags" aria-label="Popular perfume searches">
              <span>Long lasting</span>
              <span>Office wear</span>
              <span>Date night</span>
              <span>Gen Z style</span>
            </div>

            <div className="product-actions">
              <Link href="/products" className="btn">
                Shop perfumes
              </Link>
              <Link
                href="/long-lasting-perfume-for-men-india"
                className="btn secondary"
              >
                Best perfume guide
              </Link>
            </div>

            <div className="home-trust-row">
              <div>
                <b>Secure</b>
                <span>Razorpay checkout</span>
              </div>
              <div>
                <b>Premium</b>
                <span>EDP style fragrances</span>
              </div>
              <div>
                <b>Support</b>
                <span>WhatsApp help</span>
              </div>
            </div>
          </div>

          <div className="home-hero-visual" aria-label="House of Eon perfume bottle">
            <div className="glow-orb glow-one" />
            <div className="glow-orb glow-two" />
            <div className="hero-bottle-modern">
              <div className="bottle-cap" />
              <div className="bottle-shine" />
              <div className="bottle-label-modern">
                <span>HOUSE OF EON</span>
                <strong>RANK</strong>
                <small>EAU DE PARFUM</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-marquee-section">
        <div className="container">
          <div className="home-marquee">
            <span>Premium Indian Perfumes</span>
            <span>Long Lasting Fragrance</span>
            <span>Modern Minimal Bottles</span>
            <span>Secure Online Payment</span>
          </div>
        </div>
      </section>

      <section className="section home-products-section">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow">Best Sellers</div>
              <h2 className="section-title">
                Perfumes that match your main character energy.
              </h2>
            </div>
            <Link href="/products" className="text-link">
              View all perfumes →
            </Link>
          </div>

          <p className="muted home-section-subtitle">
            Discover premium perfumes for office, college, parties, gifting and
            everyday confidence.
          </p>

          <div className="grid">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="section home-why">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow">Why House of Eon?</div>
              <h2 className="section-title">
                Built for Indian weather, modern outfits and everyday compliments.
              </h2>
            </div>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <span>01</span>
              <h3>Long lasting impression</h3>
              <p>
                Designed for people who want their fragrance to feel clean,
                premium and noticeable without being too loud.
              </p>
            </article>

            <article className="feature-card">
              <span>02</span>
              <h3>Minimal luxury</h3>
              <p>
                A modern fragrance style that works with streetwear, office
                fits, ethnic wear and night-out looks.
              </p>
            </article>

            <article className="feature-card">
              <span>03</span>
              <h3>Easy buying experience</h3>
              <p>
                Add to cart, pay securely through Razorpay and track your order
                after confirmation.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section home-occasion">
        <div className="container">
          <div className="occasion-card">
            <div>
              <div className="eyebrow">Find Your Vibe</div>
              <h2>
                One perfume for the office. One for the night. One for the
                memory.
              </h2>
              <p>
                Whether you are looking for the best perfume for men in India,
                a premium perfume gift, or a daily wear fragrance, House of Eon
                keeps it simple and stylish.
              </p>
            </div>

            <div className="occasion-list">
              <Link href="/products">Daily wear perfumes</Link>
              <Link href="/products">Office perfumes</Link>
              <Link href="/products">Party perfumes</Link>
              <Link href="/products">Gift perfumes</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section home-steps">
        <div className="container">
          <div className="section-head center">
            <div>
              <div className="eyebrow">Simple Checkout</div>
              <h2 className="section-title">From perfume crush to order confirmed.</h2>
            </div>
          </div>

          <div className="steps-grid">
            <div>
              <b>1</b>
              <h3>Choose your perfume</h3>
              <p>Explore modern fragrances for men and women.</p>
            </div>

            <div>
              <b>2</b>
              <h3>Add to cart</h3>
              <p>Select your favourite bottle and confirm your delivery details.</p>
            </div>

            <div>
              <b>3</b>
              <h3>Pay securely</h3>
              <p>Complete payment through Razorpay and receive order updates.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section seo-content">
        <div className="container">
          <h2>
            Best long lasting perfumes for men and women in India
          </h2>
          <p>
            House of Eon is a premium Indian perfume brand created for modern
            youth, professionals and fragrance lovers who want a clean, stylish
            and long lasting scent. Our perfumes are designed for daily wear,
            office use, college, dates, parties, gifting and special occasions.
          </p>
          <p>
            If you are searching for the best perfume for men in India, luxury
            perfume for men, premium perfume under an accessible budget, or a
            modern perfume brand with minimal style, House of Eon gives you a
            simple way to choose, buy and track your fragrance online.
          </p>
          <div className="product-actions">
            <Link href="/products" className="btn">
              Explore perfumes
            </Link>
          </div>
        </div>
      </section>

      <section className="section home-faq">
        <div className="container">
          <div className="section-head center">
            <div>
              <div className="eyebrow">Questions</div>
              <h2 className="section-title">Before you buy</h2>
            </div>
          </div>

          <div className="faq-grid">
            <details>
              <summary>Which perfume should I choose first?</summary>
              <p>
                Start with the fragrance that matches your daily lifestyle. If
                you want a confident everyday perfume, choose a versatile scent
                that works for office, college and evening outings.
              </p>
            </details>

            <details>
              <summary>Is House of Eon good for gifting?</summary>
              <p>
                Yes. A premium perfume is one of the easiest gifts for birthdays,
                anniversaries, weddings, festivals and personal celebrations.
              </p>
            </details>

            <details>
              <summary>How does delivery and tracking work?</summary>
              <p>
                After payment, your order is confirmed. Once dispatched, tracking
                details will be updated so you can check your order status.
              </p>
            </details>
          </div>
        </div>
      </section>
    </>
  );
}