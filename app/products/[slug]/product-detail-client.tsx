"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/products";
import { formatINR } from "@/lib/money";
import { useCart } from "@/components/CartContext";
import { trackAddToCart } from "@/lib/analytics";
import ProductImageGallery from "@/components/ProductImageGallery";
import SocialProofSection from "@/components/SocialProofSection";
import styles from "./product-detail.module.css";
import {
  trackProductViewed,
  trackAddToCartClarity,
} from "@/lib/clarity";

const productTrustItems = [
  {
    title: "Secure Payment",
    text: "Razorpay protected checkout",
  },
  {
    title: "Fast Dispatch",
    text: "Tracking shared after dispatch",
  },
  {
    title: "WhatsApp Support",
    text: "Help available for order issues",
  },
  {
    title: "Original Product",
    text: "Authentic House of Eon perfume",
  },
];

function Stars({ rating = 5 }: { rating?: number }) {
  const safeRating = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <span aria-label={`${safeRating} star rating`}>
      {"★".repeat(safeRating)}
      {"☆".repeat(5 - safeRating)}
    </span>
  );
}

export default function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();

  const rating = product.rating || 5;
  const ratingText =
    product.ratingText ||
    (product.reviewCount && product.reviewCount > 0
      ? `${product.rating || 5}/5 from ${product.reviewCount} customers`
      : "Loved by early customers");

  const valueLine =
    product.valueLine ||
    "A premium House of Eon perfume made for modern daily confidence.";

  const hasHighlights = Boolean(product.highlights?.length);
  const hasScentProfile = Boolean(product.scentProfile);
  const hasReviews = Boolean(product.reviews?.length);

  useEffect(() => {
    trackProductViewed(product.name);
  }, [product.name]);

  function trackProductAdd() {
    trackAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
  }

  function handleAddToCart() {
    addItem(product.id);
    trackProductAdd();
    trackAddToCartClarity(product.name);
  }

  function handleBuyNow() {
    addItem(product.id);
    trackProductAdd();
    trackAddToCartClarity(product.name);
    router.push("/checkout");
  }

  async function handleShareProduct() {
    const productUrl = `${window.location.origin}/products/${product.slug}`;

    const notesText =
      product.notes && product.notes.length > 0
        ? product.notes.join(" · ")
        : "Premium modern fragrance";

    const occasionText =
      product.occasion && product.occasion.length > 0
        ? product.occasion.slice(0, 4).join(", ")
        : "office, dates, parties and daily wear";

    const shareText = `✨ ${product.name} by House of Eon

${product.tagline}

Fragrance Notes:
${notesText}

Best for:
${occasionText}

${product.description}

Price: ${formatINR(product.price)}

🔥 Limited launch offer. Use EON20 for 20% OFF. Order now before stock closes.

Buy here:
${productUrl}`;

    try {
      if (navigator.share) {
        if (product.image && navigator.canShare) {
          try {
            const imageResponse = await fetch(product.image);
            const imageBlob = await imageResponse.blob();

            const imageFile = new File([imageBlob], `${product.slug}.png`, {
              type: imageBlob.type || "image/png",
            });

            if (navigator.canShare({ files: [imageFile] })) {
              await navigator.share({
                title: `${product.name} | House of Eon`,
                text: shareText,
                url: productUrl,
                files: [imageFile],
              });
              return;
            }
          } catch {
            // Image share failed, continue with text share.
          }
        }

        await navigator.share({
          title: `${product.name} | House of Eon`,
          text: shareText,
          url: productUrl,
        });

        return;
      }

      await navigator.clipboard.writeText(shareText);
      alert("Product details copied. You can now paste it on WhatsApp.");
    } catch {
      await navigator.clipboard.writeText(shareText);
      alert("Product details copied. You can now paste it on WhatsApp.");
    }
  }

  return (
    <>
      <section className="product-detail-hero">
        <div className="container product-detail-grid">
          <div className="product-detail-visual product-detail-visual-image">
            <div className="detail-glow detail-glow-one" />
            <div className="detail-glow detail-glow-two" />

            <ProductImageGallery product={product} />
          </div>

          <div className="product-detail-copy">
            <Link href="/products" className="back-link">
              ← Back to perfumes
            </Link>

            <div className="eyebrow">House of Eon Perfume</div>

            <span className="pill">
              {product.gender} · {product.size}
            </span>

            <h1>{product.name}</h1>

            {product.tagline ? (
              <p className="product-detail-tagline">{product.tagline}</p>
            ) : null}

            <div className={styles.ratingRow}>
              <span className={styles.stars}>
                <Stars rating={rating} />
              </span>
              <span>{ratingText}</span>
            </div>

            <p className={styles.valueLine}>{valueLine}</p>

            <p className="lead">{product.description}</p>

            <div className="notes-wrap">
              {product.notes.map((note) => (
                <span className="pill" key={note}>
                  {note}
                </span>
              ))}
            </div>

            <div className="detail-price-row">
              <div>
                <span className="price-label">Price</span>
                <div className="price">{formatINR(product.price)}</div>
              </div>

              {product.mrp ? (
                <div className="mrp-box">
                  <span>MRP</span>
                  <b>{formatINR(product.mrp)}</b>
                </div>
              ) : null}
            </div>

            <div className={styles.offerStrip}>
              <span>Launch offer active</span>
              <b>Use EON20 for 20% OFF</b>
            </div>

            <div className={`${styles.productCtaBlock} detail-actions`}>
  <button className={styles.buyNowButton} onClick={handleBuyNow}>
    Buy now
  </button>

  <button className={styles.addCartButton} onClick={handleAddToCart}>
    Add to cart
  </button>

  <div className={styles.secondaryActions}>
    <Link href="/cart">View cart</Link>
    <span>·</span>
    <button onClick={handleShareProduct}>Share</button>
  </div>
</div>

            <div className={styles.buyTrustStrip}>
              {productTrustItems.map((item) => (
                <div key={item.title}>
                  <b>{item.title}</b>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {hasHighlights ? (
        <section className={`section ${styles.highlightSection}`}>
          <div className="container">
            <div className="section-head center">
              <div>
                <div className="eyebrow">Why you’ll love it</div>
                <h2 className="section-title">
                  {product.tagline || "Made for modern confidence."}
                </h2>
              </div>
            </div>

            <div className={styles.highlightGrid}>
              {product.highlights?.map((highlight, index) => (
                <article key={highlight.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{highlight.title}</h3>
                  <p>{highlight.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {hasScentProfile && product.scentProfile ? (
        <section className={`section ${styles.scentSection}`}>
          <div className="container">
            <div className="section-head center">
              <div>
                <div className="eyebrow">Scent Profile</div>
                <h2 className="section-title">
                  What does {product.name} smell like?
                </h2>
              </div>
            </div>

            <div className={styles.scentGrid}>
              <article>
                <span>Opening</span>
                <p>{product.scentProfile.opening}</p>
              </article>

              <article>
                <span>Heart</span>
                <p>{product.scentProfile.heart}</p>
              </article>

              <article>
                <span>Dry Down</span>
                <p>{product.scentProfile.dryDown}</p>
              </article>

              <article>
                <span>Performance</span>
                <p>{product.scentProfile.performance}</p>
              </article>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section product-story-section">
        <div className="container product-story-grid">
          <div>
            <div className="eyebrow">Fragrance Mood</div>
            <h2>Made for everyday confidence.</h2>
          </div>

          <p>
            {product.longDescription ||
              `${product.name} is crafted for people who want a fragrance that feels premium, clean and memorable. Wear it for office, college, evening plans, dates, celebrations or whenever you want your presence to feel sharper.`}
          </p>
        </div>
      </section>

      {hasReviews ? (
        <section className={`section ${styles.reviewSection}`}>
          <div className="container">
            <div className="section-head center">
              <div>
                <div className="eyebrow">Customer Love</div>
                <h2 className="section-title">What customers say.</h2>
              </div>
            </div>

            <div className={styles.reviewGrid}>
              {product.reviews?.map((review) => (
                <article key={`${review.name}-${review.city}`}>
                  <div className={styles.reviewStars}>
                    <Stars rating={review.rating} />
                  </div>

                  <p>“{review.text}”</p>

                  <div>
                    <b>{review.name}</b>
                    <span>{review.city}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section product-info-section">
        <div className="container product-info-grid">
          <article>
            <span>01</span>
            <h3>When to wear</h3>
            <p>
              {product.occasion?.length
                ? product.occasion.join(", ")
                : "Daily wear, office, college, parties, gifting and evening plans."}
            </p>
          </article>

          <article>
            <span>02</span>
            <h3>Who it is for</h3>
            <p>
              Modern fragrance lovers who prefer minimal luxury, strong identity
              and a confident scent profile.
            </p>
          </article>

          <article>
            <span>03</span>
            <h3>How to buy</h3>
            <p>
              Add to cart, enter your delivery details and pay securely online
              through Razorpay.
            </p>
          </article>
        </div>
      </section>

      <SocialProofSection />

      <div className="mobile-sticky-buy product-mobile-buy">
  <div>
    <b>{formatINR(product.price)}</b>
    <span>{product.shortName} · EON20 active</span>
  </div>

  <button onClick={handleBuyNow}>Buy now</button>
</div>
    </>
  );
}