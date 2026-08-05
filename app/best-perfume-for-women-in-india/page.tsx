import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/products";
import { SITE_URL } from "@/lib/seo";

const siteUrl = SITE_URL;

const womenProducts = products.filter(
  (product) => product.gender === "Women" || product.gender === "Unisex"
);
const syraProduct = products.find((product) => product.id === "syra");
const silentGoldProduct = products.find(
  (product) => product.id === "silent-gold"
);

export const metadata: Metadata = {
  title:
    "Best Perfume for Women in India | Long Lasting Elegant Perfumes by House of Eon",
  description:
    "Discover the best long lasting perfume for women in India — House of Eon SYRA, a floral musk perfume for office, brunch, evenings and gifting, plus Silent Gold for quiet unisex luxury.",
  keywords: [
    "best perfume for women in india",
    "long lasting perfume for women",
    "elegant perfume for women india",
    "unique perfume for women",
    "perfume for women gifting india",
    "floral perfume for women india",
    "House of Eon SYRA",
    "House of Eon Silent Gold",
  ],
  alternates: {
    canonical: `${siteUrl}/best-perfume-for-women-in-india`,
  },
  openGraph: {
    title: "Best Perfume for Women in India | House of Eon",
    description:
      "SYRA by House of Eon — an elegant floral musk perfume for women, crafted for office, brunch, evenings and gifting in India.",
    url: `${siteUrl}/best-perfume-for-women-in-india`,
    siteName: "House of Eon",
    type: "website",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Which is the best long lasting perfume for women in India?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SYRA by House of Eon is a floral musk perfume built for Indian weather and daily wear — elegant and soft, without being overpowering. For a richer, unisex option, Silent Gold offers golden amber warmth for evenings and gifting.",
      },
    },
    {
      "@type": "Question",
      name: "Is SYRA suitable for daily office wear?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. SYRA is designed to be graceful without being loud, making it suitable for office, brunch, daily wear and evening plans alike.",
      },
    },
    {
      "@type": "Question",
      name: "What is a good perfume gift for women in India?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SYRA's premium bottle and soft, elegant character make it a thoughtful gift. Silent Gold is a strong choice for a richer, more luxurious gifting option that works for both men and women.",
      },
    },
    {
      "@type": "Question",
      name: "Can I buy House of Eon perfume for women online?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Choose your perfume, add it to cart, enter your delivery address and pay securely online through Razorpay.",
      },
    },
  ],
};

const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Best Perfumes for Women in India",
  itemListElement: womenProducts.map((product, index) => ({
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

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: siteUrl,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Perfume Guide for Women",
      item: `${siteUrl}/best-perfume-for-women-in-india`,
    },
  ],
};

export default function BestPerfumeForWomenPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <section className="seo-hero">
        <div className="container seo-hero-grid">
          <div className="seo-hero-copy">
            <div className="eyebrow">Perfume Guide for Women</div>

            <h1>
              Best perfume for women in India.
              <span> Grace with power.</span>
            </h1>

            <p>
              A good women&apos;s perfume should feel elegant in a meeting,
              soft at brunch and memorable by evening — without ever feeling
              heavy in Indian heat. SYRA by House of Eon is built around
              exactly that balance, and Silent Gold offers a richer, unisex
              option for gifting and special occasions.
            </p>

            <div className="home-search-tags">
              <span>Long lasting</span>
              <span>Office &amp; brunch</span>
              <span>Evening elegance</span>
              <span>Premium gifting</span>
            </div>

            <div className="product-actions">
              <Link href="/products" className="btn">
                Shop women&apos;s perfumes
              </Link>
              {syraProduct ? (
                <Link
                  href={`/products/${syraProduct.slug}`}
                  className="btn secondary"
                >
                  Shop SYRA
                </Link>
              ) : null}
            </div>
          </div>

          <div className="seo-hero-panel">
            <div className="seo-panel-card main">
              <span>Best overall</span>
              <h2>SYRA</h2>
              <p>Grace with Power</p>
            </div>

            <div className="seo-panel-card">
              <span>Best for gifting</span>
              <h3>SYRA</h3>
            </div>

            <div className="seo-panel-card">
              <span>Best unisex luxury</span>
              <h3>Silent Gold</h3>
            </div>
          </div>
        </div>
      </section>

      <section className="section seo-products-section">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow">Best Picks</div>
              <h2 className="section-title">
                Choose your signature women&apos;s perfume.
              </h2>
            </div>
            <Link href="/products" className="text-link">
              View all perfumes →
            </Link>
          </div>

          <p className="muted home-section-subtitle">
            House of Eon currently offers one dedicated women&apos;s
            fragrance and one unisex fragrance loved by women who prefer a
            richer, more timeless character — we&apos;d rather give you an
            honest pick than pad this out with options we don&apos;t
            actually have.
          </p>

          <div className="grid products-grid">
            {womenProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="section seo-guide-section">
        <div className="container seo-guide-grid">
          <div>
            <div className="eyebrow">How to Choose</div>
            <h2>
              The best perfume for women is one that works as hard as you do.
            </h2>
          </div>

          <div className="seo-guide-content">
            <article>
              <span>01</span>
              <h3>For office and daily wear</h3>
              <p>
                SYRA is built to feel graceful without being loud — a soft
                floral musk that works from your morning commute through a
                full office day without needing a re-spray.
              </p>
              {syraProduct ? (
                <Link href={`/products/${syraProduct.slug}`}>
                  Explore SYRA →
                </Link>
              ) : null}
            </article>

            <article>
              <span>02</span>
              <h3>For brunch and evening plans</h3>
              <p>
                SYRA&apos;s fruity opening and elegant floral heart carry
                easily from a daytime brunch into evening plans, which is why
                it&apos;s designed as a one-bottle, all-occasion women&apos;s
                perfume rather than a strictly evening-only scent.
              </p>
            </article>

            <article>
              <span>03</span>
              <h3>For gifting</h3>
              <p>
                A premium bottle and a soft, universally likeable character
                make SYRA an easy, low-risk gift. If you want to gift
                something richer and unisex, Silent Gold&apos;s golden amber
                warmth works for festive occasions and special moments.
              </p>
              {silentGoldProduct ? (
                <Link href={`/products/${silentGoldProduct.slug}`}>
                  Explore Silent Gold →
                </Link>
              ) : null}
            </article>

            <article>
              <span>04</span>
              <h3>For quiet, timeless luxury</h3>
              <p>
                If you prefer a rich, smooth and unisex fragrance over a
                strictly feminine one, Silent Gold leans into golden amber,
                saffron and smooth woods for a timeless, quiet-luxury
                character.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section seo-comparison-section">
        <div className="container">
          <div className="section-head center">
            <div>
              <div className="eyebrow">Quick Comparison</div>
              <h2 className="section-title">SYRA or Silent Gold?</h2>
            </div>
          </div>

          <div className="seo-comparison-grid">
            <div>
              <b>SYRA</b>
              <span>Elegant · Feminine · Soft</span>
              <p>
                Best for daily wear, office, brunch, evenings and everyday
                gifting.
              </p>
            </div>

            <div>
              <b>Silent Gold</b>
              <span>Timeless · Rich · Unisex</span>
              <p>
                Best for festive wear, special occasions and premium unisex
                gifting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {syraProduct?.reviews && syraProduct.reviews.length > 0 ? (
        <section className="section">
          <div className="container">
            <div className="section-head center">
              <div>
                <div className="eyebrow">Real Customer Reviews</div>
                <h2 className="section-title">What women say about SYRA</h2>
              </div>
            </div>

            <div className="grid">
              {syraProduct.reviews.map((review) => (
                <div className="card" key={`${review.name}-${review.city}`}>
                  <p style={{ marginTop: 0 }}>&ldquo;{review.text}&rdquo;</p>
                  <b>{review.name}</b>
                  <span className="muted"> · {review.city}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section seo-rich-content">
        <div className="container">
          <h2>Why the right perfume matters more for Indian weather</h2>

          <p>
            A women&apos;s perfume in India has to survive heat, humidity, a
            full workday and an evening out — often on the same bottle. SYRA
            is built around a soft fruity opening, an elegant floral heart
            and a smooth musk dry-down specifically so it holds up through
            that range without turning sharp or fading by afternoon.
          </p>

          <p>
            If you want something richer for festive occasions or gifting —
            for yourself or for someone who prefers a unisex fragrance over a
            strictly feminine one — Silent Gold&apos;s golden amber and
            saffron character is built for exactly that.
          </p>

          <p>
            You can shop both online, add your favourite to cart, pay
            securely through Razorpay and track your order after dispatch.
          </p>

          <div className="product-actions">
            <Link href="/products" className="btn">
              Shop all perfumes
            </Link>
            {syraProduct ? (
              <Link
                href={`/products/${syraProduct.slug}`}
                className="btn secondary"
              >
                Start with SYRA
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="section seo-faq-section">
        <div className="container">
          <div className="section-head center">
            <div>
              <div className="eyebrow">FAQ</div>
              <h2 className="section-title">
                Women&apos;s perfume questions
              </h2>
            </div>
          </div>

          <div className="faq-grid">
            <details>
              <summary>Which House of Eon perfume is best for women?</summary>
              <p>
                SYRA is our dedicated women&apos;s perfume, built for daily
                wear, office, brunch, evenings and gifting. Silent Gold is a
                unisex option for a richer, more timeless character.
              </p>
            </details>

            <details>
              <summary>Is SYRA too strong for daily office use?</summary>
              <p>
                No — SYRA is designed to be graceful rather than loud, so it
                works comfortably in office settings without overwhelming a
                room.
              </p>
            </details>

            <details>
              <summary>Is Silent Gold only for men?</summary>
              <p>
                No, Silent Gold is a unisex fragrance. Many women choose it
                specifically for its rich, timeless character for festive
                occasions and gifting.
              </p>
            </details>

            <details>
              <summary>How can I buy House of Eon perfumes for women?</summary>
              <p>
                Choose a perfume, add it to cart, enter your delivery details
                and pay securely online through Razorpay.
              </p>
            </details>
          </div>
        </div>
      </section>
    </>
  );
}
