"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { getProductById } from "@/lib/products";
import { formatINR } from "@/lib/money";

export default function CartPage() {
  const {
    lines,
    updateQuantity,
    removeItem,
    total,
    couponCode,
    couponDiscount,
    finalTotal,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const [couponMessage, setCouponMessage] = useState("");

  const totalItems = lines.reduce((sum, line) => sum + line.quantity, 0);

  async function handleApplyCoupon() {
    const result = await applyCoupon(couponInput);
    setCouponMessage(result.message);

    if (result.ok) {
      setCouponInput("");
    }
  }

  function handleRemoveCoupon() {
    removeCoupon();
    setCouponMessage("Coupon removed.");
  }

  return (
    <>
      <section className="cart-hero">
        <div className="container cart-hero-inner">
          <div>
            <div className="eyebrow">Your Cart</div>
            <h1>Almost yours.</h1>
            <p>
              Review your House of Eon perfumes, apply your launch offer and
              continue to secure Razorpay checkout.
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

                <div className="coupon-box">
                  <label>
                    <span>Launch coupon</span>

                    <div className="coupon-row">
                      <input
                        className="input"
                        placeholder="Try EON20"
                        value={couponInput}
                        onChange={(event) =>
                          setCouponInput(event.target.value.toUpperCase())
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleApplyCoupon();
                          }
                        }}
                      />

                      <button
                        className="btn secondary"
                        type="button"
                        onClick={handleApplyCoupon}
                      >
                        Apply
                      </button>
                    </div>
                  </label>

                  {couponCode ? (
                    <div className="coupon-applied">
                      <span>{couponCode} applied</span>
                      <button type="button" onClick={handleRemoveCoupon}>
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="coupon-hint">
                      Use <b>EON20</b> for 20% OFF launch offer.
                    </div>
                  )}

                  {couponMessage ? <p>{couponMessage}</p> : null}
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

                  {couponDiscount > 0 ? (
                    <div>
                      <span>Coupon discount</span>
                      <b>-{formatINR(couponDiscount)}</b>
                    </div>
                  ) : null}

                  <div>
                    <span>Shipping</span>
                    <b>Calculated after order</b>
                  </div>
                </div>

                <div className="summary-total">
                  <span>Total</span>
                  <strong>{formatINR(finalTotal)}</strong>
                </div>

                {couponDiscount > 0 ? (
                  <div className="cart-savings-note">
                    You saved {formatINR(couponDiscount)} with {couponCode}.
                  </div>
                ) : null}

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
            <b>{formatINR(finalTotal)}</b>
            <span>
              {totalItems} item{totalItems > 1 ? "s" : ""}
              {couponDiscount > 0 ? ` · Saved ${formatINR(couponDiscount)}` : ""}
            </span>
          </div>

          <Link href="/checkout">Checkout</Link>
        </div>
      ) : null}
    </>
  );
}