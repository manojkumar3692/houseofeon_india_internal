"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/CartContext";
import s from "./future.module.css";

const MotionContext = createContext(true);
export const useEonMotion = () => useContext(MotionContext);
export function Arrow({ diagonal = false }: { diagonal?: boolean }) { return <span aria-hidden="true">{diagonal ? "↗" : "↗"}</span>; }
export default function EonShell({ children }: { children: ReactNode }) {
  const { count } = useCart();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [motion, setMotion] = useState(true);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMotion(!media.matches);
    sync(); media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => { setMenu(false); }, [pathname]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMenu(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  return <MotionContext.Provider value={motion}><div className={`${s.world} ${!motion ? s.still : ""}`}>
    <a href="#main-content" className={s.skip}>Skip to content</a>
    <div className={s.announcement}><span>MADE IN INDIA. REMEMBERED EVERYWHERE.</span><span>COMPLIMENTARY SHIPPING ACROSS INDIA ↗</span></div>
    <header className={s.header}>
      <Link className={s.wordmark} href="/" aria-label="House of Eon home">HOUSE <span>OF</span> EON<sup>®</sup></Link>
      <nav className={s.nav} aria-label="Main navigation"><Link href="/#collection">The collection</Link><Link href="/#experience">The experience</Link><Link href="/trial-pack">Discovery set <Arrow /></Link></nav>
      <div className={s.headerActions}><button className={s.motionButton} onClick={() => setMotion(!motion)} aria-pressed={!motion} aria-label={motion ? "Pause motion" : "Enable motion"}>{motion ? "Ⅱ" : "▷"}</button><Link className={s.bagLink} href="/cart" aria-label={`Shopping bag, ${count} items`}>BAG <b>{count}</b></Link><button className={s.menuButton} onClick={() => setMenu(!menu)} aria-expanded={menu} aria-controls="future-menu">{menu ? "CLOSE −" : "MENU +"}</button></div>
      {menu && <nav id="future-menu" className={s.mobileMenu} aria-label="Mobile navigation"><Link href="/#collection" onClick={() => setMenu(false)}>The collection <Arrow /></Link><Link href="/#experience" onClick={() => setMenu(false)}>The experience <Arrow /></Link><Link href="/trial-pack">Discovery set <Arrow /></Link><Link href="/track-order">Track your order <Arrow /></Link></nav>}
    </header>
    {children}
    <footer className={s.footer}><div className={s.footerTop}><div><span className={s.kicker}>YOUR NEXT CHAPTER STARTS HERE</span><h2>Leave something<br /><em>unforgettable.</em></h2></div><div><Link href="/#collection">Shop the collection</Link><Link href="/trial-pack">Discover before you decide</Link><Link href="/track-order">Track your order</Link></div><div><a href="https://wa.me/919902376600" target="_blank" rel="noopener noreferrer">Speak to the house ↗</a><a href="https://www.instagram.com/houseofeon_india/" target="_blank" rel="noopener noreferrer">Instagram ↗</a><Link href="/pages/return-refund-policy">Returns & replacement policy</Link></div></div><div className={s.footerLogo}>HOUSE OF EON<span>®</span></div><div className={s.footerBottom}><span>© {new Date().getFullYear()} HOUSE OF EON</span><span>INDEPENDENT PERFUMERY · INDIA</span><button onClick={() => window.scrollTo({top:0,behavior:motion ? "smooth" : "instant"})}>BACK TO TOP ↑</button></div></footer>
  </div></MotionContext.Provider>;
}
