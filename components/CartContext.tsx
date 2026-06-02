"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getProductById } from "@/lib/products";

export type CartLine = { productId: string; quantity: number };

type CartContextValue = {
  lines: CartLine[];
  addItem: (productId: string, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "houseofeon_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      setLines([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, loaded]);

  const value = useMemo<CartContextValue>(() => {
    const total = lines.reduce((sum, line) => {
      const product = getProductById(line.productId);
      return product ? sum + product.price * line.quantity : sum;
    }, 0);
    const count = lines.reduce((sum, line) => sum + line.quantity, 0);

    return {
      lines,
      total,
      count,
      addItem(productId, quantity = 1) {
        setLines((current) => {
          const found = current.find((line) => line.productId === productId);
          if (found) {
            return current.map((line) =>
              line.productId === productId
                ? { ...line, quantity: Math.min(20, line.quantity + quantity) }
                : line
            );
          }
          return [...current, { productId, quantity }];
        });
      },
      removeItem(productId) {
        setLines((current) => current.filter((line) => line.productId !== productId));
      },
      updateQuantity(productId, quantity) {
        if (quantity <= 0) return this.removeItem(productId);
        setLines((current) =>
          current.map((line) =>
            line.productId === productId ? { ...line, quantity: Math.min(20, quantity) } : line
          )
        );
      },
      clearCart() {
        setLines([]);
      },
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
