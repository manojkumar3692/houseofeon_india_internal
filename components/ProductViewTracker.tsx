"use client";

import { useEffect } from "react";
import { Product } from "@/lib/products";
import { trackViewContent } from "@/lib/analytics";
import { getCatalogOffer } from "@/lib/catalogOffer";

export default function ProductViewTracker({ product }: { product: Product }) {
  useEffect(() => {
    trackViewContent({
      id: product.id,
      name: product.name,
      price: getCatalogOffer(product.price).price,
    });
  }, [product.id, product.name]);

  return null;
}