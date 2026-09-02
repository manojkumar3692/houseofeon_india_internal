import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { products } from "@/lib/products";
import { SITE_URL } from "@/lib/seo";
import {
  TRIAL_CREDIT_EXPIRY_DAYS,
  TRIAL_PACK_PRICE_INR,
  TRIAL_PICK_COUNT,
  TRIAL_VIAL_SIZE_ML,
} from "@/lib/trialPack";
import styles from "./diwali-perfume.module.css";
import DiwaliCampaignTracker from "@/components/DiwaliCampaignTracker";

const pageUrl = `${SITE_URL}/pages/diwali-perfume`;

export const metadata: Metadata = {
  title: "Diwali Perfume Gifts 2026 | Try 3 Perfumes for ₹249 | House of Eon",
  description:
    "Find a Diwali perfume gift they will actually wear. Try 3 premium House of Eon fragrances for ₹249, then redeem the full ₹249 on a 50ml perfume.",
  keywords: [
    "Diwali perfume gifts",
    "Diwali gifts for men",
    "Diwali gifts for women",
    "Diwali gifts under 1000",
    "perfume gift set for Diwali",
    "Diwali gift ideas 2026",
    "perfume gift set for men",
    "perfume gift set for women",
    "unique Diwali gifts",
    "affordable luxury Diwali gifts",
  ],
  alternates: { canonical: pageUrl },
  openGraph: {
    title: "Don’t Guess Their Perfume This Diwali | House of Eon",
    description:
      "Try 3 premium fragrances for ₹249. Find the one you love, then redeem the full ₹249 on a 50ml bottle.",
    url: pageUrl,
    siteName: "House of Eon",
    type: "website",
    images: [{ url: "/diwali-perfume-og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Don’t Guess Their Perfume This Diwali | House of Eon",
    description: "Try 3 premium fragrances for ₹249, then redeem ₹249 on your 50ml.",
    images: ["/diwali-perfume-og.png"],
  },
};

const featuredIds = ["rank", "desert-tonka", "arctic-wave", "syra", "silent-gold"];
const featured = featuredIds
  .map((id) => products.find((product) => product.id === id))
  .filter((product): product is NonNullable<typeof product> => Boolean(product));

const campaignProductImages: Record<string, string> = {
  rank: "/products/diwali-rank.webp",
  "desert-tonka": "/products/diwali-desert-tonka.webp",
  "arctic-wave": "/products/diwali-arctic-wave.webp",
  syra: "/products/diwali-syra.webp",
  "silent-gold": "/products/diwali-silent-gold.webp",
};

const faqs = [
  {
    question: "What makes the Discovery Set a good Diwali perfume gift?",
    answer:
      "It removes the pressure of guessing someone’s taste. They can wear three different 8ml fragrances, choose the one they genuinely enjoy, and use the Discovery Set order number to redeem ₹249 on a full-size perfume.",
  },
  {
    question: "Is there a Diwali perfume gift under ₹1000?",
    answer:
      "Yes. The House of Eon Discovery Set costs ₹249 and includes three 8ml fragrances selected by the customer. It is an affordable luxury Diwali gift with a practical path to a full-size fragrance later.",
  },
  {
    question: "Which House of Eon perfume is best for men?",
    answer:
      "RANK is bold and spicy, Desert Tonka is warm and rich, and Arctic Wave is fresh and clean. If you are unsure which profile he prefers, the Discovery Set lets him try three first.",
  },
  {
    question: "Which House of Eon perfume is best for women?",
    answer:
      "SYRA is House of Eon’s floral, graceful women’s fragrance. For someone who prefers a richer unisex profile, Silent Gold is another festive option. If taste is uncertain, start with the Scent Finder rather than blind buying.",
  },
  {
    question: "How does the ₹249 redemption work?",
    answer: `At full-size checkout, enter the Discovery Set order number and use the same phone number. The ₹249 is deducted once from an eligible full-size order within ${TRIAL_CREDIT_EXPIRY_DAYS} days.`,
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
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
    { "@type": "ListItem", position: 2, name: "Diwali Perfume Gifts", item: pageUrl },
  ],
};

const diwaliGuides = [
  ["Best Diwali gifts for men under ₹1000", "/guides/best-diwali-gifts-for-men-under-1000-2026"],
  ["Best Diwali gifts for women under ₹1000", "/guides/best-diwali-gifts-for-women-under-1000-2026"],
  ["Why perfume makes a great Diwali gift", "/guides/why-perfume-makes-a-great-diwali-gift"],
  ["How to choose perfume when you don’t know their taste", "/guides/how-to-choose-perfume-gift-without-knowing-their-taste"],
  ["Diwali gifts beyond sweets and dry fruits", "/guides/diwali-gift-ideas-beyond-sweets-and-dry-fruits-2026"],
] as const;

export default function DiwaliPerfumePage() {
  return (
    <main className={styles.page}>
      <DiwaliCampaignTracker />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.shell}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>House of Eon · Diwali 2026</p>
              <h1>
                This Diwali,
                <span>don’t guess your perfume.</span>
              </h1>
              <p className={styles.heroLead}>
                Try {TRIAL_PICK_COUNT} premium fragrances for ₹{TRIAL_PACK_PRICE_INR}. Wear them. Find the one you love.
                Redeem the full ₹{TRIAL_PACK_PRICE_INR} when you buy your 50ml.
              </p>
              <div className={styles.heroActions}>
                <Link href="/trial-pack" className={styles.primaryCta} data-diwali-cta="hero_trial_pack">
                  Try 3 for ₹249 <span aria-hidden="true">→</span>
                </Link>
                <a href="#choose-your-path" className={styles.textCta} data-diwali-cta="hero_paths">Find your way in ↓</a>
              </div>
              <div className={styles.offerLine}>
                <span>{TRIAL_PICK_COUNT} × {TRIAL_VIAL_SIZE_ML}ml</span>
                <span>₹249 redeemable</span>
                <span>{TRIAL_CREDIT_EXPIRY_DAYS}-day window</span>
              </div>
            </div>

            <div className={styles.heroVisual} aria-label="House of Eon Discovery Set">
              <div className={styles.diyaHalo} aria-hidden="true" />
              <Image
                src="/diwali-discovery.webp"
                alt="Three House of Eon discovery fragrances for Diwali"
                width={720}
                height={960}
                sizes="(max-width: 900px) 92vw, 42vw"
                priority
                className={styles.heroImage}
              />
              <p className={styles.visualNote}>A gift without the guesswork.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.manifesto}>
        <div className={styles.shell}>
          <p className={styles.manifestoSmall}>The discount is temporary.</p>
          <h2>The wrong perfume stays in the cupboard.</h2>
          <p>
            Instead of choosing a fragrance because it is 30%, 40% or 50% off,
            discover what you—or they—actually enjoy wearing.
          </p>
        </div>
      </section>

      <section className={styles.pathSection} id="choose-your-path">
        <div className={styles.shell}>
          <div className={styles.sectionIntro}>
            <p className={styles.kicker}>Start where you are</p>
            <h2>Two ways to find the right Diwali scent.</h2>
          </div>
          <div className={styles.pathGrid}>
            <article className={`${styles.pathCard} ${styles.pathDark}`}>
              <span className={styles.pathNumber}>01</span>
              <p>I know what I like</p>
              <h3>Go straight to the fragrances.</h3>
              <p className={styles.pathBody}>Fresh, warm, bold, floral or golden—browse the collection by mood.</p>
              <Link href="#gift-edit" className={styles.lightCta} data-diwali-cta="path_shop">Shop the Diwali edit →</Link>
            </article>
            <article className={`${styles.pathCard} ${styles.pathLight}`}>
              <span className={styles.pathNumber}>02</span>
              <p>I’m not sure</p>
              <h3>Let the Scent Finder narrow it down.</h3>
              <p className={styles.pathBody}>Choose how you want to feel. Get a match, then try it with two more for ₹249.</p>
              <Link href="/scent-fix" className={styles.darkCta} data-diwali-cta="path_scent_finder">Take the Scent Finder →</Link>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.giftSection} id="gift-edit">
        <div className={styles.shell}>
          <div className={styles.sectionIntroRow}>
            <div>
              <p className={styles.kicker}>Looking for a Diwali gift?</p>
              <h2>Choose a mood. Not a stereotype.</h2>
            </div>
            <p>Five distinctive fragrances for festive dressing, meaningful gifting and everyday wear after the diyas are put away.</p>
          </div>

          <div className={styles.productGrid}>
            {featured.map((product, index) => (
              <article className={styles.productCard} key={product.id}>
                <Link href={`/products/${product.slug}`} className={styles.productImageWrap}>
                  <span className={styles.productIndex}>{String(index + 1).padStart(2, "0")}</span>
                  <Image
                    src={campaignProductImages[product.id] || product.image}
                    alt={`${product.name} perfume by House of Eon`}
                    width={420}
                    height={420}
                    sizes="(max-width: 620px) 80vw, (max-width: 900px) 44vw, 31vw"
                    className={styles.productImage}
                  />
                </Link>
                <div className={styles.productMeta}>
                  <p>{product.gender === "Men" ? "For him" : product.gender === "Women" ? "For her" : "For anyone"}</p>
                  <h3>{product.name}</h3>
                  <span>{product.mood.slice(0, 3).join(" · ")}</span>
                  <Link href={`/products/${product.slug}`} data-diwali-cta={`product_${product.id}`}>Meet the fragrance →</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.giftCallout}>
        <div className={styles.shell}>
          <div className={styles.giftCalloutCard}>
            <div>
              <p className={styles.kicker}>Not sure?</p>
              <h2>Don’t guess their perfume either.</h2>
              <p>Let them choose three, wear each one, and decide for themselves.</p>
            </div>
            <div className={styles.giftCalloutAction}>
              <span>Discovery Set</span>
              <strong>₹249</strong>
              <Link href="/trial-pack" className={styles.primaryCta} data-diwali-cta="gift_trial_pack">Gift the Discovery Set →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.howSection}>
        <div className={styles.shell}>
          <div className={styles.sectionIntro}>
            <p className={styles.kicker}>One gift. Zero guesswork.</p>
            <h2>How the Discovery Set works.</h2>
          </div>
          <ol className={styles.steps}>
            <li><span>01</span><h3>Choose three</h3><p>Build a set from the available House of Eon fragrances.</p></li>
            <li><span>02</span><h3>Wear, don’t just smell</h3><p>Try each fragrance on skin across real days and real plans.</p></li>
            <li><span>03</span><h3>Find the winner</h3><p>Discover the fragrance that still feels right after the first spray.</p></li>
            <li><span>04</span><h3>Redeem ₹249</h3><p>Use the trial order number and matching phone at full-size checkout.</p></li>
          </ol>
        </div>
      </section>

      <section className={styles.searchLine}>
        <div className={styles.shell}>
          <p>Don’t search for the biggest Diwali discount.</p>
          <h2>Search for the perfume you’ll love.</h2>
          <div className={styles.heroActions}>
            <Link href="/trial-pack" className={styles.primaryCta} data-diwali-cta="final_trial_pack">Try 3 for ₹249 →</Link>
            <Link href="/scent-fix" className={styles.outlineCta} data-diwali-cta="final_scent_finder">Find my scent →</Link>
          </div>
        </div>
      </section>

      <section className={styles.seoSection}>
        <div className={styles.shell}>
          <div className={styles.seoGrid}>
            <div>
              <p className={styles.kicker}>A more thoughtful festive gift</p>
              <h2>Perfume gifting, without pretending taste is predictable.</h2>
            </div>
            <div className={styles.seoCopy}>
              <p>
                A perfume gift set can feel more personal than another box of sweets or dry fruits—but fragrance is also deeply individual. Someone shopping for a Diwali gift for men may be choosing between fresh Arctic Wave, warm Desert Tonka and bold RANK. For a Diwali gift for women, floral SYRA offers a graceful direction, while Silent Gold makes a rich unisex alternative.
              </p>
              <p>
                The Discovery Set turns that uncertainty into the gift. At ₹249, it is a unique Diwali gift under ₹1000 that lets the recipient participate in the choice, then carry the full value into a 50ml purchase.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.guideSection}>
        <div className={styles.shell}>
          <div className={styles.sectionIntro}>
            <p className={styles.kicker}>Diwali gift guides</p>
            <h2>Useful answers before you buy.</h2>
          </div>
          <div className={styles.guideGrid}>
            {diwaliGuides.map(([title, href], index) => (
              <Link href={href} key={href} className={styles.guideCard}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <b>Read the guide →</b>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.faqSection}>
        <div className={styles.shell}>
          <div className={styles.sectionIntro}>
            <p className={styles.kicker}>Diwali gifting, answered</p>
            <h2>Before you choose.</h2>
          </div>
          <div className={styles.faqList}>
            {faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}<span aria-hidden="true">+</span></summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
