"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/products";
import { formatINR } from "@/lib/money";
import { useCart } from "@/components/CartContext";
import { trackAddToCart } from "@/lib/analytics";

export default function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [imageFailed, setImageFailed] = useState(false);

  const hasProductImage = Boolean(product.image) && !imageFailed;

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
  }

  function handleBuyNow() {
    addItem(product.id);
    trackProductAdd();
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
  
  🔥 Limited launch offer. Order now before stock closes.
  
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

            {hasProductImage ? (
              <div className="product-main-image-card">
                <Image
                  src={product.image}
                  alt={`${product.name} perfume by House of Eon`}
                  width={1100}
                  height={1100}
                  priority
                  className="product-main-image"
                  sizes="(max-width: 860px) 92vw, 520px"
                  onError={() => setImageFailed(true)}
                />

                <div className="product-main-image-shade" />

                <div className="floating-note note-one">{product.tagline}</div>

                <div className="floating-note note-two">
                  {product.concentration}
                </div>
              </div>
            ) : (
              <>
                <div className="detail-bottle">
                  <div className="detail-bottle-cap" />
                  <div className="detail-bottle-shine" />
                  <div className="detail-bottle-label">
                    <span>HOUSE OF EON</span>
                    <strong>{product.shortName}</strong>
                    <small>
                      {product.size} · {product.concentration}
                    </small>
                  </div>
                </div>

                <div className="floating-note note-one">Long lasting</div>
                <div className="floating-note note-two">Modern minimal</div>
              </>
            )}
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

            <div className="product-actions detail-actions">
              <button className="btn" onClick={handleAddToCart}>
                Add to cart
              </button>

              <button className="btn secondary" onClick={handleBuyNow}>
                Buy now
              </button>

              <button className="btn ghost" onClick={handleShareProduct}>
                Share
              </button>

              <Link href="/cart" className="btn ghost">
                View cart
              </Link>
            </div>

            <div className="detail-trust-grid">
              <div>
                <b>Secure Payment</b>
                <span>Razorpay checkout</span>
              </div>
              <div>
                <b>Order Tracking</b>
                <span>Track after dispatch</span>
              </div>
              <div>
                <b>Support</b>
                <span>WhatsApp help</span>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      <div className="mobile-sticky-buy product-mobile-buy">
        <div>
          <b>{product.shortName}</b>
          <span>{formatINR(product.price)}</span>
        </div>

        <button onClick={handleShareProduct}>Share</button>
        <button onClick={handleBuyNow}>Buy now</button>
      </div>
    </>
  );
}
