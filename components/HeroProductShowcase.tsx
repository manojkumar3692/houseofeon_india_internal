"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/products";
import { formatINR } from "@/lib/money";

export default function HeroProductShowcase({
  products,
}: {
  products: Product[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!products.length) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % products.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, [products.length]);

  if (!products.length) return null;

  const activeProduct = products[activeIndex];
  const previousProduct =
    products[(activeIndex - 1 + products.length) % products.length];
  const nextProduct = products[(activeIndex + 1) % products.length];

  return (
    <div
      className="hero-product-showcase royal-showcase"
      aria-label="House of Eon royal perfume collection"
    >
      <div className="hero-showcase-glow hero-showcase-glow-one" />
      <div className="hero-showcase-glow hero-showcase-glow-two" />

      <div className="royal-collection-badge">
        <span>6 Signature Scents</span>
        <b>Men · Women · Unisex</b>
      </div>

      <Link
        href={`/products/${previousProduct.slug}`}
        className="hero-side-card hero-side-card-left"
        aria-label={previousProduct.name}
      >
        <Image
          src={previousProduct.image}
          alt={`${previousProduct.name} perfume by House of Eon`}
          width={420}
          height={420}
          className="hero-side-card-img"
        />
      </Link>

      <Link
        href={`/products/${nextProduct.slug}`}
        className="hero-side-card hero-side-card-right"
        aria-label={nextProduct.name}
      >
        <Image
          src={nextProduct.image}
          alt={`${nextProduct.name} perfume by House of Eon`}
          width={420}
          height={420}
          className="hero-side-card-img"
        />
      </Link>

      <Link
        href={`/products/${activeProduct.slug}`}
        className="hero-main-card"
        aria-label={activeProduct.name}
      >
        <Image
          key={activeProduct.id}
          src={activeProduct.image}
          alt={`${activeProduct.name} perfume by House of Eon`}
          width={900}
          height={900}
          priority={activeIndex === 0}
          className="hero-main-product-img"
          sizes="(max-width: 860px) 86vw, 390px"
        />

        <div className="hero-main-card-shade" />

        <div className="hero-product-meta">
          <span>
            {activeProduct.gender} · {activeProduct.size}
          </span>
          <b>{formatINR(activeProduct.price)}</b>
        </div>
      </Link>

      <div className="hero-showcase-info">
        <div>
          <span className="eyebrow">Signature Scent</span>
          <h2>{activeProduct.name}</h2>
          <p>{activeProduct.tagline}</p>
        </div>

        <div className="hero-dots">
          {products.map((product, index) => (
            <button
              key={product.id}
              type="button"
              className={index === activeIndex ? "active" : ""}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show ${product.name}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}