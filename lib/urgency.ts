// "Social proof" urgency signals (stock level + live viewer count) shown on
// the PDP and at checkout. These numbers are NOT read from real inventory or
// real analytics — House of Eon doesn't have per-SKU stock tracking yet —
// but they're deterministic, seeded by product + day, so the same visitor
// sees a STABLE number throughout a session and across reloads on the same
// day, rather than a different random number on every refresh. A number
// that changes every reload is the single biggest tell that a "left in
// stock" badge is fake; a number that's frozen forever is the second
// biggest. Seeding by day avoids both — it holds steady all day, then
// quietly resets overnight like a real count would after a day's orders.

function seededFraction(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 10000) / 10000;
}

function todaySeed(productId: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return `${productId}-${day}`;
}

export type StockTier = "critical" | "low" | "medium";

export type StockInfo = {
  count: number;
  label: string;
  tier: StockTier;
  // 0-100 position for the gauge marker — lower stock sits further toward
  // the red end of the track.
  percent: number;
};

// Deliberately always lands in the 3-11 range — this widget exists only to
// signal scarcity, so it never renders a "fully stocked" state.
export function getStockInfo(productId: string): StockInfo {
  const count =
    3 + Math.floor(seededFraction(`${todaySeed(productId)}-stock`) * 9);

  let label = "Selling Fast";
  let tier: StockTier = "medium";
  if (count <= 4) {
    label = "Almost Sold Out";
    tier = "critical";
  } else if (count <= 7) {
    label = "Low Stock";
    tier = "low";
  }

  return {
    count,
    label,
    tier,
    percent: Math.min(100, Math.max(8, (count / 20) * 100)),
  };
}

export function getViewerBase(productId: string): number {
  return 6 + Math.floor(seededFraction(`${todaySeed(productId)}-viewer`) * 14);
}
