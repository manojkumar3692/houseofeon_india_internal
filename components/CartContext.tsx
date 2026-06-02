"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getProductById } from "@/lib/products";

export type CartLine = {
  productId: string;
  quantity: number;
};

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

function cleanCartLines(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((line) => {
      const productId = String(line?.productId || "");
      const quantity = Number(line?.quantity || 0);

      if (!productId) return null;
      if (!getProductById(productId)) return null;
      if (!Number.isFinite(quantity)) return null;
      if (quantity <= 0) return null;

      return {
        productId,
        quantity: Math.min(20, Math.floor(quantity)),
      };
    })
    .filter(Boolean) as CartLine[];
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        setLines([]);
        return;
      }

      const parsed = JSON.parse(raw);
      const cleaned = cleanCartLines(parsed);

      setLines(cleaned);
    } catch {
      setLines([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    if (lines.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
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
        const safeQuantity = Math.max(1, Math.min(20, Math.floor(quantity)));

        setLines((current) => {
          const found = current.find((line) => line.productId === productId);

          if (found) {
            return current.map((line) =>
              line.productId === productId
                ? {
                    ...line,
                    quantity: Math.min(20, line.quantity + safeQuantity),
                  }
                : line
            );
          }

          return [...current, { productId, quantity: safeQuantity }];
        });
      },

      removeItem(productId) {
        setLines((current) =>
          current.filter((line) => line.productId !== productId)
        );
      },

      updateQuantity(productId, quantity) {
        const safeQuantity = Math.floor(Number(quantity));

        setLines((current) => {
          if (!Number.isFinite(safeQuantity) || safeQuantity <= 0) {
            return current.filter((line) => line.productId !== productId);
          }

          return current.map((line) =>
            line.productId === productId
              ? {
                  ...line,
                  quantity: Math.min(20, safeQuantity),
                }
              : line
          );
        });
      },

      clearCart() {
        setLines([]);
        localStorage.removeItem(STORAGE_KEY);
      },
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}