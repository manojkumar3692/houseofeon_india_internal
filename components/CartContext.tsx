"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getProductById } from "@/lib/products";
import { formatINR } from "@/lib/money";

export type CartLine = {
  productId: string;
  quantity: number;
};

type ApplyCouponResult = {
  ok: boolean;
  message: string;
};

type CartContextValue = {
  lines: CartLine[];
  addItem: (productId: string, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  total: number;
  count: number;

  couponCode: string;
  couponDiscount: number;
  finalTotal: number;
  applyCoupon: (code: string) => Promise<ApplyCouponResult>;
  removeCoupon: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "houseofeon_cart";
const COUPON_STORAGE_KEY = "houseofeon_coupon";

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

function normalizeCouponInput(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);

  const total = useMemo(() => {
    return lines.reduce((sum, line) => {
      const product = getProductById(line.productId);
      return product ? sum + product.price * line.quantity : sum;
    }, 0);
  }, [lines]);

  const count = useMemo(() => {
    return lines.reduce((sum, line) => sum + line.quantity, 0);
  }, [lines]);

  const finalTotal = Math.max(0, total - couponDiscount);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        setLines([]);
      } else {
        const parsed = JSON.parse(raw);
        const cleaned = cleanCartLines(parsed);
        setLines(cleaned);
      }

      const savedCoupon = localStorage.getItem(COUPON_STORAGE_KEY);
      if (savedCoupon) {
        setCouponCode(normalizeCouponInput(savedCoupon));
      }
    } catch {
      setLines([]);
      setCouponCode("");
      setCouponDiscount(0);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    if (lines.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(COUPON_STORAGE_KEY);
      setCouponCode("");
      setCouponDiscount(0);
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, loaded]);

  useEffect(() => {
    if (!loaded) return;

    if (!couponCode) {
      localStorage.removeItem(COUPON_STORAGE_KEY);
      setCouponDiscount(0);
      return;
    }

    localStorage.setItem(COUPON_STORAGE_KEY, couponCode);
  }, [couponCode, loaded]);

  // Recalculate coupon discount when cart total changes.
  useEffect(() => {
    if (!loaded) return;
    if (!couponCode) return;
    if (total <= 0) {
      setCouponCode("");
      setCouponDiscount(0);
      return;
    }

    let cancelled = false;

    async function revalidateCoupon() {
      try {
        const response = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: couponCode,
            subtotal: total,
          }),
        });

        const data = await response.json();

        if (cancelled) return;

        if (!response.ok || !data.valid) {
          setCouponCode("");
          setCouponDiscount(0);
          return;
        }

        setCouponDiscount(Number(data.discount || 0));
      } catch {
        if (!cancelled) {
          setCouponCode("");
          setCouponDiscount(0);
        }
      }
    }

    revalidateCoupon();

    return () => {
      cancelled = true;
    };
  }, [total, couponCode, loaded]);

  const value = useMemo<CartContextValue>(() => {
    return {
      lines,
      total,
      count,

      couponCode,
      couponDiscount,
      finalTotal,

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
        setCouponCode("");
        setCouponDiscount(0);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(COUPON_STORAGE_KEY);
      },

      async applyCoupon(code) {
        const cleanCode = normalizeCouponInput(code);

        if (!cleanCode) {
          setCouponCode("");
          setCouponDiscount(0);

          return {
            ok: false,
            message: "Please enter a coupon code.",
          };
        }

        if (lines.length === 0 || total <= 0) {
          setCouponCode("");
          setCouponDiscount(0);

          return {
            ok: false,
            message: "Add a perfume to cart before applying coupon.",
          };
        }

        try {
          const response = await fetch("/api/coupons/validate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: cleanCode,
              subtotal: total,
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.valid) {
            setCouponCode("");
            setCouponDiscount(0);

            return {
              ok: false,
              message: data.error || "Invalid coupon code.",
            };
          }

          const discount = Number(data.discount || 0);
          const appliedCode = String(data.code || cleanCode);

          setCouponCode(appliedCode);
          setCouponDiscount(discount);

          return {
            ok: true,
            message: `${appliedCode} applied. You saved ${formatINR(
              discount
            )}.`,
          };
        } catch {
          setCouponCode("");
          setCouponDiscount(0);

          return {
            ok: false,
            message: "Unable to apply coupon. Please try again.",
          };
        }
      },

      removeCoupon() {
        setCouponCode("");
        setCouponDiscount(0);
        localStorage.removeItem(COUPON_STORAGE_KEY);
      },
    };
  }, [lines, total, count, couponCode, couponDiscount, finalTotal]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}