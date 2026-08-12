"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/products";
import { formatINR } from "@/lib/money";
import { useCart } from "@/components/CartContext";
import { trackAddToCart } from "@/lib/analytics";
import ProductImageGallery from "@/components/ProductImageGallery";
import SocialProofSection from "@/components/SocialProofSection";
import UrgencyStrip from "@/components/UrgencyStrip";
import styles from "./product-detail.module.css";
import {
  trackProductViewed,
  trackAddToCartClarity,
} from "@/lib/clarity";
import {
  BASE_PRICE_INR,
  EON20_DISCOUNTED_PRICE_INR,
  BUNDLE_QUANTITY,
  BUNDLE_UNIT_PRICE_INR,
  BUNDLE_TOTAL_INR,
  BUNDLE_SAVINGS_VS_DISCOUNTED_INR,
} from "@/lib/pricing";

const paymentMethods = ["UPI", "Visa", "Mastercard", "RuPay"];

const trustRowItems = [
  "COD Available",
  "Free Shipping",
  "100% Original Perfume",
  "The Compliment Getter",
];

// The per-unit price actually charged for a given quantity of THIS product
// alone, assuming EON20 (auto-applied at checkout for a single bottle) or
// the bundle rate (2+) — whichever applies. getUnitPrice() from lib/pricing
// only encodes the bundle rule, not EON20, so it under-reports the real
// price for a single bottle; this keeps every price shown on this page
// (hero, cards, sticky bar, analytics) in agreement with what checkout
// will actually charge.
function getDisplayUnitPrice(quantity: number): number {
  return quantity >= BUNDLE_QUANTITY
    ? BUNDLE_UNIT_PRICE_INR
    : EON20_DISCOUNTED_PRICE_INR;
}

// Small inline vector icon (no emoji) so the "Free Shipping" badges render
// consistently across devices and match the site's line-icon-free, minimal
// premium look rather than looking like a system emoji glyph.
function ShippingIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="1" y="6" width="13" height="11" rx="1.5" />
      <path d="M14 10h4l3 3v4h-7z" />
      <circle cx="6" cy="19" r="1.6" />
      <circle cx="17.5" cy="19" r="1.6" />
    </svg>
  );
}

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
  const { addItem, updateQuantity, lines } = useCart();

  const [toast, setToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Card A (1 bottle) is pre-selected by default — Card B (the bundle) is
  // there for anyone who wants it, but isn't pushed on visitors up front.
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  const isBundleSelected = selectedQuantity >= BUNDLE_QUANTITY;
  const selectedTotalPrice = getDisplayUnitPrice(selectedQuantity) * selectedQuantity;

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  function showToast(message: string) {
    setToast(message);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
  }

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

  function trackProductAdd(quantity: number) {
    trackAddToCart({
      id: product.id,
      name: product.name,
      price: getDisplayUnitPrice(quantity),
      quantity,
    });
  }

  // Sets this product's cart line to exactly the quantity picked via the
  // 1-bottle / 2-bottle selector cards — never stacks on top of whatever
  // was already in the cart, so re-clicking Add to Cart / Buy Now with a
  // card selected always lands on the expected quantity.
  function setCartQuantityTo(quantity: number) {
    const existingLine = lines.find((line) => line.productId === product.id);

    if (existingLine) {
      updateQuantity(product.id, quantity);
    } else {
      addItem(product.id, quantity);
    }
  }

  function handleAddToCart() {
    setCartQuantityTo(selectedQuantity);
    trackProductAdd(selectedQuantity);
    trackAddToCartClarity(product.name);
    showToast(
      `${product.name} added to cart (${selectedQuantity} bottle${
        selectedQuantity > 1 ? "s" : ""
      })`
    );
  }

  function handleBuyNow() {
    setCartQuantityTo(selectedQuantity);
    trackProductAdd(selectedQuantity);
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

            <div className={styles.priceHero}>
              <span className={styles.priceHeroMain}>
                {isBundleSelected
                  ? formatINR(BUNDLE_TOTAL_INR)
                  : formatINR(EON20_DISCOUNTED_PRICE_INR)}
              </span>
              <span className={styles.priceHeroStrike}>
                {formatINR(
                  isBundleSelected
                    ? BASE_PRICE_INR * selectedQuantity
                    : BASE_PRICE_INR
                )}
              </span>
              <span className={styles.priceHeroBadge}>20% OFF</span>
              <span className={styles.priceHeroShipBadge}>
                <ShippingIcon />
                Free Shipping
              </span>
              <span className={styles.priceHeroSub}>
                {isBundleSelected
                  ? `${formatINR(BUNDLE_UNIT_PRICE_INR)} each · works with any 2 perfumes`
                  : "with EON20 applied at checkout"}
              </span>
            </div>

            <div className={styles.quantityCards}>
              <button
                type="button"
                className={`${styles.quantityCard} ${
                  !isBundleSelected ? styles.quantityCardActive : ""
                }`}
                onClick={() => setSelectedQuantity(1)}
              >
                <span className={styles.quantityCardLabel}>1 Bottle</span>
                <div className={styles.quantityCardPrice}>
                  <b>{formatINR(EON20_DISCOUNTED_PRICE_INR)}</b>
                  <span>{formatINR(BASE_PRICE_INR)}</span>
                </div>
                <span className={styles.shippingBadge}>
                  <ShippingIcon />
                  Free Shipping
                </span>
                <span className={styles.quantityCardSub}>
                  20% off with EON20
                </span>
              </button>

              <button
                type="button"
                className={`${styles.quantityCard} ${
                  isBundleSelected ? styles.quantityCardActive : ""
                }`}
                onClick={() => setSelectedQuantity(BUNDLE_QUANTITY)}
              >
                <span className={styles.quantityBadge}>
                  BEST VALUE — SAVE {formatINR(BUNDLE_SAVINGS_VS_DISCOUNTED_INR)}
                </span>
                <span className={styles.quantityCardLabel}>2 Bottles</span>
                <div className={styles.quantityCardPrice}>
                  <b>{formatINR(BUNDLE_TOTAL_INR)}</b>
                </div>
                <span className={styles.shippingBadge}>
                  <ShippingIcon />
                  Free Shipping
                </span>
                <span className={styles.quantityCardSub}>
                  {formatINR(BUNDLE_UNIT_PRICE_INR)} each — or mix with any
                  other scent in your cart
                </span>
              </button>
            </div>

            <UrgencyStrip productId={product.id} productName={product.name} />

            <div className={`${styles.productCtaBlock} detail-actions`}>
              <button className={styles.buyNowButton} onClick={handleBuyNow}>
                Buy now — {formatINR(selectedTotalPrice)}
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

            <div className={styles.trustRow}>
              {trustRowItems.map((item) => (
                <span key={item}>✓ {item}</span>
              ))}
            </div>

            <div className={styles.paymentMethodsRow}>
              <span className={styles.secureBadge}>🔒 100% Secure Checkout</span>
              <div className={styles.paymentChips}>
                {paymentMethods.map((method) => (
                  <span key={method} className={styles.paymentChip}>
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {product.videoUrl ? (
        <section className={`section ${styles.videoSection}`}>
          <div className="container">
            {product.videoUrl.toLowerCase().endsWith(".gif") ? (
              // GIFs autoplay/loop natively and can't go through <video> —
              // browsers don't support gif as a video src.
              <img
                className={styles.videoPlayer}
                src={product.videoUrl}
                alt={`${product.name} by House of Eon`}
              />
            ) : (
              <video
                className={styles.videoPlayer}
                src={product.videoUrl}
                poster={product.videoPosterUrl}
                controls
                playsInline
                preload="metadata"
              >
                Your browser doesn&apos;t support embedded video.
              </video>
            )}
          </div>
        </section>
      ) : null}

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

                    {review.verified ? (
                      <span className={styles.verifiedBadge}>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 20 20"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M10 1.5l2.34 1.36 2.7-.15 1.02 2.52 2.24 1.62-.87 2.6.87 2.6-2.24 1.62-1.02 2.52-2.7-.15L10 18.5l-2.34-1.36-2.7.15-1.02-2.52-2.24-1.62.87-2.6-.87-2.6 2.24-1.62L4.96 2.71l2.7.15L10 1.5z"
                            fill="currentColor"
                          />
                          <path
                            d="M6.8 10.2l2.1 2.1 4.3-4.6"
                            stroke="#fff"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Verified Buyer
                      </span>
                    ) : null}
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
    <b>{formatINR(selectedTotalPrice)}</b>
    <span>
      {product.shortName} ·{" "}
      {isBundleSelected ? "2 bottles" : "EON20 active"} · Free Shipping
    </span>
  </div>

  <button onClick={handleBuyNow}>Buy now</button>
</div>

      {toast ? (
        <div className={styles.toast} role="status">
          <span>{toast}</span>
          <Link href="/cart" onClick={() => setToast(null)}>
            View cart
          </Link>
        </div>
      ) : null}
    </>
  );
}
