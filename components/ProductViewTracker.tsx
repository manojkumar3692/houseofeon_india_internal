"use client";

import { useEffect } from "react";
import { Product } from "@/lib/products";
import { trackViewContent } from "@/lib/analytics";
import { EON20_DISCOUNTED_PRICE_INR } from "@/lib/pricing";

export default function ProductViewTracker({ product }: { product: Product }) {
  useEffect(() => {
    trackViewContent({
      id: product.id,
      name: product.name,
      price: EON20_DISCOUNTED_PRICE_INR,
    });
  }, [product.id, product.name]);

  return null;
}