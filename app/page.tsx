import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/products";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow">Premium Indian Perfume Brand</div>
            <h1>Luxury perfumes without a heavy checkout.</h1>
            <p className="lead">Shop long lasting House of Eon fragrances, add to cart, pay securely through Razorpay, and get shipping updates from our team.</p>
            <div className="product-actions">
              <Link href="/products" className="btn">Shop perfumes</Link>
              <Link href="/long-lasting-perfume-for-men-india" className="btn secondary">SEO landing page</Link>
            </div>
          </div>
          <div className="hero-card" aria-hidden="true"><div className="bottle"><div className="bottle-label">RANK</div></div></div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <h2 className="section-title">Best sellers</h2>
          <p className="muted">Start with 6 products. Add more later only when needed.</p>
          <div className="grid">
            {products.slice(0, 3).map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </section>
    </>
  );
}
