"use client";

import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { getProductById } from "@/lib/products";
import { formatINR } from "@/lib/money";

export default function CartPage() {
  const { lines, updateQuantity, removeItem, total } = useCart();
  return (
    <section className="section">
      <div className="container">
        <h1 className="section-title">Cart</h1>
        {lines.length === 0 ? (
          <div className="card"><p>Your cart is empty.</p><Link className="btn" href="/products">Shop now</Link></div>
        ) : (
          <div className="hero-grid" style={{alignItems:"start"}}>
            <div className="card">
              {lines.map((line) => {
                const product = getProductById(line.productId);
                if (!product) return null;
                return (
                  <div className="cart-row" key={line.productId}>
                    <div>
                      <b>{product.name}</b><br />
                      <span className="muted">{product.size} · {formatINR(product.price)}</span>
                    </div>
                    <div className="qty">
                      <button onClick={() => updateQuantity(line.productId, line.quantity - 1)}>-</button>
                      <b>{line.quantity}</b>
                      <button onClick={() => updateQuantity(line.productId, line.quantity + 1)}>+</button>
                      <button onClick={() => removeItem(line.productId)}>Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="card">
              <h2>Order summary</h2>
              <p className="cart-row"><span>Total</span><b>{formatINR(total)}</b></p>
              <Link className="btn" href="/checkout" style={{width:"100%"}}>Checkout</Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
