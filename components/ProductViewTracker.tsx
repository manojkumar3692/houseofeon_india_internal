"use client";

import { useEffect } from "react";
import { Product } from "@/lib/products";
import { trackViewContent } from "@/lib/analytics";

export default function ProductViewTracker({ product }: { product: Product }) {
  useEffect(() => {
    trackViewContent({
      id: product.id,
      name: product.name,
      price: product.price,
    });
  }, [product.id, product.name, product.price]);

  return null;
}