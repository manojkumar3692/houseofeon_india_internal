"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getProductById } from "@/lib/products";
import { requiresExplicitCoupon } from "@/lib/catalogOffer";
import { formatINR } from "@/lib/money";
import { getLineTotal, cartHasBundleLine } from "@/lib/pricing";

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
  loaded: boolean;
  addItem: (productId: string, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  total: number;
  count: number;
  hasBundleLine: boolean;

  couponCode: string;
  couponPhone: string;
  couponDiscount: number;
  finalTotal: number;
  // phone is optional and only meaningful for trial-pack credit codes
  // (see lib/trialCredit.ts) — a static coupon like EON20 validates fine
  // without it.
  applyCoupon: (code: string, phone?: string) => Promise<ApplyCouponResult>;
  removeCoupon: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "houseofeon_cart";
const COUPON_STORAGE_KEY = "houseofeon_coupon";
const EXPLICIT_COUPON_KEY = "houseofeon_explicit_coupon";

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
  // Keep the verification phone in memory, never in browser storage.
  // Every revalidation of a Trial Pack credit needs the same phone.
  const [couponPhone, setCouponPhone] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponExplicit, setCouponExplicit] = useState(false);
  const explicitRequired = requiresExplicitCoupon(lines);

  const count = useMemo(() => {
    return lines.reduce((sum, line) => sum + line.quantity, 0);
  }, [lines]);

  // Bundle pricing (2+ perfumes total, any mix of products) is decided by
  // the cart's total quantity, not any single line's quantity.
  const total = useMemo(() => {
    return lines.reduce((sum, line) => {
      const product = getProductById(line.productId);
      return product
        ? sum + getLineTotal(product.price, line.quantity, count)
        : sum;
    }, 0);
  }, [lines, count]);

  const hasBundleLine = useMemo(() => cartHasBundleLine(lines), [lines]);

  const activeDiscount = explicitRequired && !couponExplicit ? 0 : couponDiscount;
  const finalTotal = Math.max(0, total - activeDiscount);

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
        setCouponExplicit(localStorage.getItem(EXPLICIT_COUPON_KEY) === normalizeCouponInput(savedCoupon));
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
      localStorage.removeItem(EXPLICIT_COUPON_KEY);
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
      localStorage.removeItem(EXPLICIT_COUPON_KEY);
      setCouponDiscount(0);
      return;
    }

    localStorage.setItem(COUPON_STORAGE_KEY, couponCode);
    if (couponExplicit) localStorage.setItem(EXPLICIT_COUPON_KEY, couponCode);
    else localStorage.removeItem(EXPLICIT_COUPON_KEY);
  }, [couponCode, couponExplicit, loaded]);

  // Bundle pricing (2+ perfumes total, any mix of products) is a bigger
  // automatic discount and is deliberately mutually exclusive with coupon
  // codes — drop any active coupon the moment the cart becomes
  // bundle-eligible.
  useEffect(() => {
    if (!loaded) return;
    if (!hasBundleLine || !couponCode) return;

    setCouponCode("");
    setCouponDiscount(0);
  }, [hasBundleLine, couponCode, loaded]);

  // Discard old automatic coupons for all perfume carts, including
  // legacy persisted coupons whose origin was never recorded.
  useEffect(() => {
    if (loaded && explicitRequired && couponCode && !couponExplicit) {
      setCouponCode(""); setCouponDiscount(0);
    }
  }, [loaded, explicitRequired, couponCode, couponExplicit]);

  // Recalculate coupon discount when cart total changes.
  useEffect(() => {
    if (!loaded) return;
    if (!couponCode || (explicitRequired && !couponExplicit)) return;
    if (hasBundleLine) return;
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
            hasBundleLine,
            phone: couponPhone || undefined,
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
  }, [total, couponCode, couponPhone, loaded, hasBundleLine, explicitRequired, couponExplicit]);

  const value = useMemo<CartContextValue>(() => {
    return {
      lines,
      loaded,
      total,
      count,
      hasBundleLine,

      couponCode: explicitRequired && !couponExplicit ? "" : couponCode,
      couponPhone,
      couponDiscount: activeDiscount,
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
        setCouponPhone("");
        setLines([]);
        setCouponCode("");
        setCouponDiscount(0);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(COUPON_STORAGE_KEY);
      localStorage.removeItem(EXPLICIT_COUPON_KEY);
      },

      async applyCoupon(code, phone) {
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

        if (hasBundleLine) {
          return {
            ok: false,
            message:
              "Coupon codes can't be combined with 2-bottle bundle pricing — you're already getting the better deal.",
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
              hasBundleLine,
              phone: phone || undefined,
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.valid) {
            return {
              ok: false,
              message: data.error || "Invalid coupon code.",
            };
          }

          const discount = Number(data.discount || 0);
          const appliedCode = String(data.code || cleanCode);

          setCouponExplicit(true);
          setCouponPhone(phone || "");
          setCouponCode(appliedCode);
          setCouponDiscount(discount);

          return {
            ok: true,
            message: `${appliedCode} applied. You saved ${formatINR(
              discount
            )}.`,
          };
        } catch {
          return {
            ok: false,
            message: "Unable to apply coupon. Please try again.",
          };
        }
      },

      removeCoupon() {
        setCouponPhone("");
        setCouponExplicit(false);
        setCouponCode("");
        setCouponDiscount(0);
        localStorage.removeItem(COUPON_STORAGE_KEY);
      localStorage.removeItem(EXPLICIT_COUPON_KEY);
      },
    };
  }, [
    lines,
    loaded,
    total,
    count,
    hasBundleLine,
    couponCode,
    couponPhone,
    couponDiscount,
    finalTotal,
    couponExplicit, explicitRequired, activeDiscount,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
