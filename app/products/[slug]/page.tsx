import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailClient from "./product-detail-client";
import ProductViewTracker from "@/components/ProductViewTracker";
import { getProductBySlug, products } from "@/lib/products";

export async function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) return {};

  return {
    title: product.seoTitle,
    description: product.seoDescription,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) notFound();

  return (
    <>
      <ProductViewTracker product={product} />
      <ProductDetailClient product={product} />
    </>
  );
}