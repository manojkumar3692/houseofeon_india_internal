import type { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop Perfumes",
  description: "Shop House of Eon premium perfumes for men and women with Razorpay checkout.",
};

export default function ProductsPage() {
  return (
    <section className="section">
      <div className="container">
        <h1 className="section-title">Shop Perfumes</h1>
        <p className="muted">Premium EDP perfumes with simple checkout.</p>
        <div className="grid">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </div>
    </section>
  );
}
