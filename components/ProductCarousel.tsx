"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/products";
import { formatINR } from "@/lib/money";
import { useCart } from "@/components/CartContext";
import { trackAddToCart } from "@/lib/analytics";

export default function ProductCarousel({ products }: { products: Product[] }) {
  const { addItem } = useCart();

  function handleAddToCart(product: Product) {
    addItem(product.id);

    trackAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
  }

  return (
    <div className="product-carousel-wrap">
      <div className="product-carousel" aria-label="House of Eon perfumes">
        {products.map((product) => (
          <article className="royal-product-slide" key={product.id}>
            <Link
              href={`/products/${product.slug}`}
              className="royal-product-image"
              aria-label={product.name}
            >
              {product.image ? (
                <Image
                  src={product.image}
                  alt={`${product.name} perfume by House of Eon`}
                  width={900}
                  height={900}
                  className="royal-product-img"
                  sizes="(max-width: 768px) 82vw, 360px"
                />
              ) : (
                <div className="product-art">
                  <div className="mini-bottle" />
                </div>
              )}

              <div className="royal-product-shade" />

              <div className="royal-product-floating">
                <span>{product.gender}</span>
                <b>{product.size}</b>
              </div>
            </Link>

            <div className="royal-product-content">
              <div>
                <span className="pill">{product.concentration}</span>
                <h3>{product.name}</h3>
                <p className="royal-tagline">{product.tagline}</p>
                <p className="royal-desc">{product.description}</p>
              </div>

              <div className="royal-product-bottom">
                <div>
                  <div className="price">{formatINR(product.price)}</div>
                  {product.mrp ? (
                    <span className="royal-mrp">{formatINR(product.mrp)}</span>
                  ) : null}
                </div>

                <button
                  className="royal-add-btn"
                  type="button"
                  onClick={() => handleAddToCart(product)}
                >
                  Add
                </button>
              </div>

              <Link className="royal-view-link" href={`/products/${product.slug}`}>
                View perfume →
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="carousel-hint">
        <span>Swipe to explore all 6 perfumes</span>
      </div>
    </div>
  );
}