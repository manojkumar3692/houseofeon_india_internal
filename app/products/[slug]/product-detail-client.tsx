"use client";

import Link from "next/link";
import { Product } from "@/lib/products";
import { formatINR } from "@/lib/money";
import { useCart } from "@/components/CartContext";

export default function ProductDetailClient({ product }: { product: Product }) {
  const { addItem } = useCart();
  return (
    <section className="section">
      <div className="container hero-grid">
        <div className="product-art" style={{height:480}}><div className="bottle"><div className="bottle-label">{product.shortName}</div></div></div>
        <div>
          <span className="pill">{product.gender} · {product.size}</span>
          <h1 className="section-title">{product.name}</h1>
          <p className="lead">{product.description}</p>
          <p>{product.notes.map((note) => <span className="pill" key={note} style={{marginRight:8}}>{note}</span>)}</p>
          <div className="price">{formatINR(product.price)}</div>
          <div className="product-actions">
            <button className="btn" onClick={() => addItem(product.id)}>Add to cart</button>
            <Link href="/cart" className="btn secondary">Go to cart</Link>
          </div>
          <div className="notice" style={{marginTop:20}}>Secure Razorpay payment. Shipping details will be shared after dispatch.</div>
        </div>
      </div>
    </section>
  );
}
