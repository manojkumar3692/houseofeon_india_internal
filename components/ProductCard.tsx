"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/products";
import { formatINR } from "@/lib/money";
import { useCart } from "./CartContext";
import { trackAddToCart } from "@/lib/analytics";
import { trackAddToCartClarity } from "@/lib/clarity";

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
    trackAddToCartClarity(product.name);
  }

  return (
    <article className="card product-card">
      <Link
        href={`/products/${product.slug}`}
        className="product-image-wrap"
        aria-label={product.name}
      >
        {product.image ? (
          <Image
            src={product.image}
            alt={`${product.name} perfume by House of Eon`}
            width={700}
            height={700}
            className="product-card-image"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="product-art">
            <div className="mini-bottle" />
          </div>
        )}
      </Link>

      <div className="product-card-content">
        <span className="pill">
          {product.gender} · {product.size}
        </span>

        <h3>{product.name}</h3>

        {product.tagline ? (
          <p className="product-tagline">{product.tagline}</p>
        ) : null}

        <p className="muted product-card-description">{product.description}</p>

        <div className="price">
          {formatINR(product.price)}{" "}
          {product.mrp ? (
            <span
              className="muted"
              style={{
                fontSize: 14,
                textDecoration: "line-through",
              }}
            >
              {formatINR(product.mrp)}
            </span>
          ) : null}
        </div>

        <div className="product-actions product-card-actions">
          <Link className="btn secondary" href={`/products/${product.slug}`}>
            View
          </Link>

          <button className="btn" onClick={handleAddToCart}>
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}