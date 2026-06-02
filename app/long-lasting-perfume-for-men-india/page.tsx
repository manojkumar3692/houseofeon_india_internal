import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/products";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://houseofeon.in";

const menProducts = products.filter((product) => product.gender === "Men");
const rankProduct = products.find((product) => product.id === "rank");
const arcticProduct = products.find((product) => product.id === "arctic-wave");
const desertProduct = products.find((product) => product.id === "desert-tonka");
const zyroxProduct = products.find((product) => product.id === "zyrox");

export const metadata: Metadata = {
  title:
    "Long Lasting Perfume for Men in India | Best Premium Perfumes by House of Eon",
  description:
    "Discover long lasting perfumes for men in India by House of Eon. Shop premium men’s perfumes for office, daily wear, date night, gifting and confident masculine style.",
  keywords: [
    "long lasting perfume for men in India",
    "best perfume for men in India",
    "premium perfume for men",
    "luxury perfume for men India",
    "office perfume for men",
    "daily wear perfume for men",
    "date night perfume for men",
    "House of Eon perfume",
    "RANK perfume",
    "Arctic Wave perfume",
    "Desert Tonka perfume",
    "Zyrox perfume",
  ],
  alternates: {
    canonical: `${siteUrl}/long-lasting-perfume-for-men-india`,
  },
  openGraph: {
    title: "Long Lasting Perfume for Men in India | House of Eon",
    description:
      "Premium long lasting perfumes for men crafted for Indian weather, office wear, daily confidence, dates and gifting.",
    url: `${siteUrl}/long-lasting-perfume-for-men-india`,
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
      name: "Which is the best long lasting perfume for men in India?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The best long lasting perfume for men depends on your usage. For bold masculine presence, RANK is a strong choice. For fresh daily wear, Arctic Wave works well. For warm evening luxury, Desert Tonka is ideal.",
      },
    },
    {
      "@type": "Question",
      name: "Which perfume is good for office use in India?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "For office use in India, choose a perfume that is clean, confident and not too overpowering. Arctic Wave is suitable for fresh daily office wear, while RANK works for a stronger professional presence.",
      },
    },
    {
      "@type": "Question",
      name: "Are House of Eon perfumes suitable for Indian weather?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "House of Eon perfumes are created for modern Indian daily wear, office use, travel, dates, parties and gifting.",
      },
    },
    {
      "@type": "Question",
      name: "Can I buy House of Eon perfume online?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You can choose your perfume, add it to cart, enter your delivery address and pay securely online through Razorpay.",
      },
    },
  ],
};

const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Best Long Lasting Perfumes for Men in India",
  itemListElement: menProducts.map((product, index) => ({
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

export default function SeoLandingPage() {
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

      <section className="seo-hero">
        <div className="container seo-hero-grid">
          <div className="seo-hero-copy">
            <div className="eyebrow">Perfume Guide for Men</div>

            <h1>
              Long lasting perfume for men in India.
              <span> Built for confidence.</span>
            </h1>

            <p>
              Indian weather, office hours, travel, dates and evening plans need
              a fragrance that feels premium from the first spray and stays
              memorable. House of Eon creates modern long lasting perfumes for
              men who want presence, style and everyday confidence.
            </p>

            <div className="home-search-tags">
              <span>Long lasting</span>
              <span>Office wear</span>
              <span>Date night</span>
              <span>Premium gifting</span>
            </div>

            <div className="product-actions">
              <Link href="/products" className="btn">
                Shop men’s perfumes
              </Link>
              {rankProduct ? (
                <Link
                  href={`/products/${rankProduct.slug}`}
                  className="btn secondary"
                >
                  Shop RANK
                </Link>
              ) : null}
            </div>
          </div>

          <div className="seo-hero-panel">
            <div className="seo-panel-card main">
              <span>Best for power</span>
              <h2>RANK</h2>
              <p>Raw Power. Refined Edge.</p>
            </div>

            <div className="seo-panel-card">
              <span>Best for freshness</span>
              <h3>Arctic Wave</h3>
            </div>

            <div className="seo-panel-card">
              <span>Best for warmth</span>
              <h3>Desert Tonka</h3>
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
                Choose your signature men’s perfume.
              </h2>
            </div>
            <Link href="/products" className="text-link">
              View all perfumes →
            </Link>
          </div>

          <p className="muted home-section-subtitle">
            Whether you want a fresh office perfume, a bold date night scent, or
            a warm luxury fragrance, these House of Eon perfumes are designed
            for different moods.
          </p>

          <div className="grid products-grid">
            {menProducts.map((product) => (
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
              The best perfume for men is not only about smell. It is about
              occasion.
            </h2>
          </div>

          <div className="seo-guide-content">
            <article>
              <span>01</span>
              <h3>For office and daily wear</h3>
              <p>
                Choose a clean, fresh and confident perfume that does not feel
                too heavy indoors. Arctic Wave is a strong choice for office,
                college, daytime use and fresh daily confidence.
              </p>
              {arcticProduct ? (
                <Link href={`/products/${arcticProduct.slug}`}>
                  Explore Arctic Wave →
                </Link>
              ) : null}
            </article>

            <article>
              <span>02</span>
              <h3>For date night and evenings</h3>
              <p>
                Warmer perfumes feel richer and more memorable in the evening.
                Desert Tonka is built for men who prefer warmth, depth, amber
                character and quiet luxury.
              </p>
              {desertProduct ? (
                <Link href={`/products/${desertProduct.slug}`}>
                  Explore Desert Tonka →
                </Link>
              ) : null}
            </article>

            <article>
              <span>03</span>
              <h3>For bold masculine presence</h3>
              <p>
                If you want a perfume that feels powerful and refined, choose a
                stronger masculine profile. RANK is made for raw power, refined
                edge and confident presence.
              </p>
              {rankProduct ? (
                <Link href={`/products/${rankProduct.slug}`}>
                  Explore RANK →
                </Link>
              ) : null}
            </article>

            <article>
              <span>04</span>
              <h3>For Gen Z freshness</h3>
              <p>
                A cool modern fragrance works well for college, hangouts,
                parties and youthful daily wear. Zyrox brings a sharp, icy and
                energetic personality.
              </p>
              {zyroxProduct ? (
                <Link href={`/products/${zyroxProduct.slug}`}>
                  Explore Zyrox →
                </Link>
              ) : null}
            </article>
          </div>
        </div>
      </section>

      <section className="section seo-comparison-section">
        <div className="container">
          <div className="section-head center">
            <div>
              <div className="eyebrow">Quick Comparison</div>
              <h2 className="section-title">
                Which House of Eon men’s perfume is right for you?
              </h2>
            </div>
          </div>

          <div className="seo-comparison-grid">
            <div>
              <b>RANK</b>
              <span>Powerful · Masculine · Refined</span>
              <p>Best for office presence, business, evening and gifting.</p>
            </div>

            <div>
              <b>Arctic Wave</b>
              <span>Fresh · Cool · Clean</span>
              <p>Best for daily wear, office, college and summer freshness.</p>
            </div>

            <div>
              <b>Desert Tonka</b>
              <span>Warm · Rich · Magnetic</span>
              <p>Best for date night, evening, festive wear and luxury mood.</p>
            </div>

            <div>
              <b>Zyrox</b>
              <span>Icy · Youthful · Bold</span>
              <p>Best for Gen Z style, parties, hangouts and modern freshness.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section seo-rich-content">
        <div className="container">
          <h2>Why long lasting perfumes matter in India</h2>

          <p>
            In India, a perfume should work through heat, travel, long office
            hours and evening plans. A good long lasting perfume for men should
            open fresh, settle smoothly and leave a memorable trail without
            feeling harsh or overpowering.
          </p>

          <p>
            House of Eon focuses on premium fragrance profiles for modern Indian
            lifestyles. If you prefer strong masculine confidence, RANK is a
            natural choice. If you want fresh daily wear, Arctic Wave gives a
            clean and cool impression. If your style is warm, rich and elegant,
            Desert Tonka creates a deeper evening presence. If you want youthful
            icy freshness, Zyrox brings a sharper Gen Z mood.
          </p>

          <p>
            You can shop House of Eon perfumes online, add your favourite scent
            to cart, pay securely through Razorpay and track your order after
            dispatch.
          </p>

          <div className="product-actions">
            <Link href="/products" className="btn">
              Shop all perfumes
            </Link>
            {rankProduct ? (
              <Link href={`/products/${rankProduct.slug}`} className="btn secondary">
                Start with RANK
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
                Long lasting perfume questions
              </h2>
            </div>
          </div>

          <div className="faq-grid">
            <details>
              <summary>Which House of Eon perfume is best for men?</summary>
              <p>
                RANK is best for bold masculine presence, Arctic Wave is best
                for fresh daily wear, Desert Tonka is best for warm evening
                luxury and Zyrox is best for youthful icy freshness.
              </p>
            </details>

            <details>
              <summary>Which perfume is best for office use?</summary>
              <p>
                Arctic Wave is a good option for office and daily use because it
                has a clean, fresh and confident profile. RANK is better if you
                want a stronger professional presence.
              </p>
            </details>

            <details>
              <summary>Which perfume is good for date night?</summary>
              <p>
                Desert Tonka and RANK are strong options for date night. Desert
                Tonka feels warm and rich, while RANK feels powerful and
                masculine.
              </p>
            </details>

            <details>
              <summary>How can I buy House of Eon perfumes?</summary>
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