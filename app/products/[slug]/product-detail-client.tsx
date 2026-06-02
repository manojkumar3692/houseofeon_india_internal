"use client";

import Link from "next/link";
import { Product } from "@/lib/products";
import { formatINR } from "@/lib/money";
import { useCart } from "@/components/CartContext";
import { trackAddToCart } from "@/lib/analytics";

export default function ProductDetailClient({ product }: { product: Product }) {
  const { addItem } = useCart();

  function handleAddToCart() {
    addItem(product.id);

    trackAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
  }

  return (
    <>
      <section className="product-detail-hero">
        <div className="container product-detail-grid">
          <div className="product-detail-visual">
            <div className="detail-glow detail-glow-one" />
            <div className="detail-glow detail-glow-two" />

            <div className="detail-bottle">
              <div className="detail-bottle-cap" />
              <div className="detail-bottle-shine" />
              <div className="detail-bottle-label">
                <span>HOUSE OF EON</span>
                <strong>{product.shortName}</strong>
                <small>{product.size} · EDP</small>
              </div>
            </div>

            <div className="floating-note note-one">Long lasting</div>
            <div className="floating-note note-two">Modern minimal</div>
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

              <Link href="/cart" className="btn secondary">
                Go to cart
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
            {product.name} is crafted for people who want a fragrance that feels
            premium, clean and memorable. Wear it for office, college, evening
            plans, dates, celebrations or whenever you want your presence to
            feel sharper.
          </p>
        </div>
      </section>

      <section className="section product-info-section">
        <div className="container product-info-grid">
          <article>
            <span>01</span>
            <h3>When to wear</h3>
            <p>Daily wear, office, college, parties, gifting and evening plans.</p>
          </article>

          <article>
            <span>02</span>
            <h3>Who it is for</h3>
            <p>
              Modern fragrance lovers who prefer minimal luxury and a confident
              scent profile.
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

      <div className="mobile-sticky-buy">
        <div>
          <b>{product.shortName}</b>
          <span>{formatINR(product.price)}</span>
        </div>
        <button onClick={handleAddToCart}>Add</button>
        <Link href="/cart">Cart</Link>
      </div>
    </>
  );
}