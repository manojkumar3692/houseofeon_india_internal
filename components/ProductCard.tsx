"use client";

import Link from "next/link";
import { Product } from "@/lib/products";
import { formatINR } from "@/lib/money";
import { useCart } from "./CartContext";
import { trackAddToCart } from "@/lib/analytics";

export default function ProductCard({ product }: { product: Product }) {
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
    <article className="card">
      <Link
        href={`/products/${product.slug}`}
        className="product-art"
        aria-label={product.name}
      >
        <div className="mini-bottle" />
      </Link>

      <span className="pill">
        {product.gender} · {product.size}
      </span>

      <h3>{product.name}</h3>

      <p className="muted">{product.description}</p>

      <div className="price">
        {formatINR(product.price)}{" "}
        {product.mrp ? (
          <span
            className="muted"
            style={{ fontSize: 14, textDecoration: "line-through" }}
          >
            {formatINR(product.mrp)}
          </span>
        ) : null}
      </div>

      <div className="product-actions">
        <Link className="btn secondary" href={`/products/${product.slug}`}>
          View
        </Link>

        <button className="btn" onClick={handleAddToCart}>
          Add to cart
        </button>
      </div>
    </article>
  );
}