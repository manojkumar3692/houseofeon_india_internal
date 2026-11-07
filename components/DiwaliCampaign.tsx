"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { DIWALI_END, DIWALI_START, isDiwaliActive } from "@/lib/diwali";
import DiwaliFireworks from "./DiwaliFireworks";
import styles from "./DiwaliCampaign.module.css";

export function useDiwaliActive() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const refresh = () => setActive(isDiwaliActive());
    refresh();
    const boundary = Date.now() < DIWALI_START ? DIWALI_START : DIWALI_END;
    const timer = boundary > Date.now() ? setTimeout(refresh, Math.min(boundary - Date.now(), 2147483647)) : undefined;
    window.addEventListener("focus", refresh);
    return () => { clearTimeout(timer); window.removeEventListener("focus", refresh); };
  }, []);
  return active;
}

function Lamp({ small = false }: { small?: boolean }) {
  return <div className={`${styles.lamp} ${small ? styles.smallLamp : ""}`} aria-hidden="true"><i className={styles.flame} /><i className={styles.oil} /><i className={styles.bowl} /></div>;
}

export function DiwaliPriceNote() {
  const active = useDiwaliActive();
  return active ? <p className={styles.priceNote}><b>₹699 with DIWALI</b><span>50ML · Shipping included · Extended to 14 Nov</span></p> : null;
}

export default function DiwaliCampaign({ fallback = null, compact = false, productImage }: { fallback?: ReactNode; compact?: boolean; productImage?: string }) {
  const active = useDiwaliActive();
  const [remaining, setRemaining] = useState(0);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!active) return;
    const update = () => setRemaining(Math.max(0, DIWALI_END - Date.now()));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [active]);
  if (!active) return <>{fallback}</>;
  const seconds = Math.floor(remaining / 1000);
  const clock = [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60];
  return <section className={`${styles.campaign} ${compact ? styles.compact : ""}`} aria-label="Diwali sale extended by one week">
    <DiwaliFireworks />
    <div className={styles.inner}>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>HOUSE OF EON · DIWALI, EXTENDED</span>
        <div className={styles.extensionBadge}><span>BY POPULAR DEMAND</span><b>+1 WEEK</b></div>
        {compact ? <h2>You asked.<br /><em>We extended.</em></h2> : <h1>You asked.<br /><em>We extended.</em></h1>}
        <p className={styles.intro}>So many of you asked for more time.<br />Our Diwali sale continues for one more week—with the same festive price and the same code.</p>
        <div className={styles.offer}><strong>₹699</strong><span>per 50ML bottle<br /><b>Shipping included</b></span></div>
        <div className={styles.actions}>
          {!compact && <Link href="/products#collection" className={styles.shop}>Shop the extended sale <span>↗</span></Link>}
          <button type="button" className={styles.code} onClick={async () => { try { await navigator.clipboard.writeText("DIWALI"); setCopied(true); } catch { setCopied(false); } }} aria-label="Copy coupon code DIWALI"><span>{copied ? "COPIED" : "USE CODE"}</span> DIWALI <small>⧉</small></button>
        </div>
        <div className={styles.deadline}>
          <span className={styles.liveDot} /><b>One more week to celebrate.</b>
          <time dateTime="2026-11-14T23:59:59+05:30">Ends Sat, 14 Nov · 11:59 PM IST</time>
        </div>
        <div className={styles.countdown} aria-label="Time remaining in the Diwali sale" role="timer">{clock.map((value, index) => <div key={index}><b>{String(value).padStart(2, "0")}</b><span>{["DAYS", "HOURS", "MINS", "SECS"][index]}</span></div>)}</div>
        <p className={styles.terms}>Enter DIWALI in your cart. All 50ML perfumes. Cannot be combined with other coupons or Trial Pack credit. Trial Packs excluded.</p>
      </div>
      <div className={styles.scene} aria-hidden="true">
        <div className={styles.halo} /><div className={styles.orbit} /><div className={styles.arch} />
        <div className={styles.pedestal} />
        <Image className={styles.bottle} src={productImage || "/products/silent-gold.png"} alt="" width={640} height={640} priority={!compact} />
        <Lamp /><Lamp small />
        <span className={styles.sceneCaption}>THE CELEBRATION CONTINUES. ONE MORE WEEK.</span>
      </div>
    </div>
  </section>;
}
