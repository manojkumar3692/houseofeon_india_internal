"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type StorefrontAvailability = {
  productId: string;
  size: "8ml" | "50ml";
  available: boolean;
  lowStock: boolean;
  maxQuantity: number;
  reason: "out_of_stock" | "manually_disabled" | null;
};

type InventoryContextValue = {
  loaded: boolean;
  enforced: boolean;
  getAvailability: (productId: string, size: "8ml" | "50ml") => StorefrontAvailability;
  refresh: () => Promise<StorefrontAvailability[]>;
};

const InventoryContext = createContext<InventoryContextValue | null>(null);

const fallback = (productId: string, size: "8ml" | "50ml"): StorefrontAvailability => ({
  productId,
  size,
  available: true,
  lowStock: false,
  maxQuantity: 20,
  reason: null,
});

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<StorefrontAvailability[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [enforced, setEnforced] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/inventory/availability", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Availability check failed");
      const nextItems = Array.isArray(data.items) ? data.items : [];
      setItems(nextItems);
      setEnforced(Boolean(data.enforced));
      return nextItems;
    } catch {
      // Fail open in the browser. When enforcement is enabled, the order API
      // still fails closed before Razorpay opens, so no overselling occurs.
      setEnforced(false);
      return [];
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const value = useMemo<InventoryContextValue>(() => ({
    loaded,
    enforced,
    getAvailability(productId, size) {
      return items.find((item) => item.productId === productId && item.size === size)
        || fallback(productId, size);
    },
    refresh,
  }), [items, loaded, enforced, refresh]);

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) throw new Error("useInventory must be used inside InventoryProvider");
  return context;
}
