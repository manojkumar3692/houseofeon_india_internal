"use client";

import { useEffect, useState } from "react";
import { getStockInfo, getViewerBase } from "@/lib/urgency";

type UrgencyStripProps = {
  productId: string;
  productName?: string;
  className?: string;
};

// Shown right next to the buy decision (PDP, just above Add to Cart /
// Buy Now) and again at checkout (just above Pay) — the two moments
// urgency actually changes behavior, rather than as a banner buried
// somewhere no one's looking at when they decide.
export default function UrgencyStrip({
  productId,
  productName,
  className,
}: UrgencyStripProps) {
  const stock = getStockInfo(productId);
  const [viewers, setViewers] = useState(() => getViewerBase(productId));

  // Small, slow live jitter so the viewer count still feels "live" if
  // someone lingers on the page — erratic jumps every few seconds are what
  // make these counters read as obviously fake, so this moves rarely and
  // only by ±1/±2 within a band around the day's base number.
  useEffect(() => {
    const base = getViewerBase(productId);

    const tick = () => {
      setViewers((current) => {
        const delta = Math.floor(Math.random() * 5) - 2; // -2..+2
        const next = current + delta;
        return Math.max(base - 3, Math.min(base + 5, next));
      });
    };

    const interval = setInterval(tick, 30000 + Math.random() * 15000);
    return () => clearInterval(interval);
  }, [productId]);

  return (
    <div
      className={`urgency-strip urgency-strip-${stock.tier}${
        className ? ` ${className}` : ""
      }`}
    >
      <div className="urgency-strip-top">
        <span className="urgency-strip-label">{stock.label}</span>
        <span className="urgency-strip-count">Only {stock.count} left</span>
      </div>

      <div className="urgency-gauge">
        <span
          className="urgency-gauge-marker"
          style={{ left: `${stock.percent}%` }}
        />
      </div>

      <div className="urgency-strip-viewers">
        <span className="urgency-live-dot" aria-hidden="true" />
        <span>
          <b>{viewers}</b> {viewers === 1 ? "person is" : "people are"}{" "}
          viewing{productName ? ` ${productName}` : " this"} right now
        </span>
      </div>
    </div>
  );
}
