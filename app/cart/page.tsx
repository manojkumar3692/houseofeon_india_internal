"use client";

import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { getProductById } from "@/lib/products";
import { formatINR } from "@/lib/money";

export default function CartPage() {
  const { lines, updateQuantity, removeItem, total } = useCart();

  const totalItems = lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <>
      <section className="cart-hero">
        <div className="container cart-hero-inner">
          <div>
            <div className="eyebrow">Your Cart</div>
            <h1>Almost yours.</h1>
            <p>
              Review your House of Eon perfumes, confirm quantity and continue
              to secure Razorpay checkout.
            </p>
          </div>

          <div className="cart-hero-badge">
            <span>{totalItems || 0}</span>
            <b>{totalItems === 1 ? "item selected" : "items selected"}</b>
          </div>
        </div>
      </section>

      <section className="section cart-section">
        <div className="container">
          {lines.length === 0 ? (
            <div className="empty-cart-card">
              <div className="empty-cart-bottle">
                <div className="empty-cart-cap" />
                <div className="empty-cart-label">EON</div>
              </div>

              <div>
                <div className="eyebrow">Cart is empty</div>
                <h2>No perfume selected yet.</h2>
                <p>
                  Explore modern, minimal and long lasting perfumes for daily
                  wear, parties, gifting and everyday confidence.
                </p>

                <div className="product-actions">
                  <Link className="btn" href="/products">
                    Shop perfumes
                  </Link>
                  <Link
                    className="btn secondary"
                    href="/long-lasting-perfume-for-men-india"
                  >
                    Perfume guide
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="cart-layout">
              <div className="cart-items-card">
                <div className="cart-card-head">
                  <div>
                    <div className="eyebrow">Selected Perfumes</div>
                    <h2>Your fragrance lineup</h2>
                  </div>
                  <Link href="/products" className="text-link">
                    Add more →
                  </Link>
                </div>

                <div className="cart-items-list">
                  {lines.map((line) => {
                    const product = getProductById(line.productId);
                    if (!product) return null;

                    return (
                      <article className="cart-item" key={line.productId}>
                        <div className="cart-item-art">
                          <div className="cart-mini-bottle">
                            <div className="cart-mini-cap" />
                            <div className="cart-mini-label">
                              {product.shortName}
                            </div>
                          </div>
                        </div>

                        <div className="cart-item-info">
                          <span className="pill">
                            {product.gender} · {product.size}
                          </span>
                          <h3>{product.name}</h3>
                          <p className="muted">{product.description}</p>

                          <div className="cart-item-notes">
                            {product.notes.slice(0, 3).map((note) => (
                              <span key={note}>{note}</span>
                            ))}
                          </div>
                        </div>

                        <div className="cart-item-control">
                          <div className="cart-item-price">
                            {formatINR(product.price)}
                          </div>

                          <div className="qty modern-qty">
                            <button
                              type="button"
                              aria-label={`Decrease ${product.name} quantity`}
                              onClick={() =>
                                updateQuantity(
                                  line.productId,
                                  line.quantity - 1
                                )
                              }
                            >
                              −
                            </button>

                            <b>{line.quantity}</b>

                            <button
                              type="button"
                              aria-label={`Increase ${product.name} quantity`}
                              onClick={() =>
                                updateQuantity(
                                  line.productId,
                                  line.quantity + 1
                                )
                              }
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            className="cart-remove"
                            onClick={() => removeItem(line.productId)}
                          >
                            Remove
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>

              <aside className="cart-summary-card">
                <div className="cart-summary-top">
                  <div>
                    <div className="eyebrow">Order Summary</div>
                    <h2>Ready to checkout</h2>
                  </div>
                </div>

                <div className="summary-lines">
                  <div>
                    <span>Items</span>
                    <b>{totalItems}</b>
                  </div>

                  <div>
                    <span>Subtotal</span>
                    <b>{formatINR(total)}</b>
                  </div>

                  <div>
                    <span>Shipping</span>
                    <b>Calculated after order</b>
                  </div>
                </div>

                <div className="summary-total">
                  <span>Total</span>
                  <strong>{formatINR(total)}</strong>
                </div>

                <Link className="btn cart-checkout-btn" href="/checkout">
                  Checkout securely
                </Link>

                <div className="cart-trust-list">
                  <div>
                    <b>Secure payment</b>
                    <span>Powered by Razorpay</span>
                  </div>
                  <div>
                    <b>Order tracking</b>
                    <span>Tracking shared after dispatch</span>
                  </div>
                  <div>
                    <b>WhatsApp support</b>
                    <span>Help available for order issues</span>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>

      {lines.length > 0 ? (
        <div className="cart-mobile-checkout">
          <div>
            <b>{formatINR(total)}</b>
            <span>{totalItems} item{totalItems > 1 ? "s" : ""}</span>
          </div>
          <Link href="/checkout">Checkout</Link>
        </div>
      ) : null}
    </>
  );
}