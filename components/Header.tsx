"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartContext";

export default function Header() {
  const { count } = useCart();
  const pathname = usePathname();

  // /scent-fix is a dedicated Meta-ad landing page — its own dark design
  // system, deliberately no site nav so cold traffic can't click away
  // from the one thing the ad promised before the payoff lands.
  if (pathname?.startsWith("/scent-fix")) return null;

  return (
    <header className="header">
      <div className="container nav">
        <Link href="/" className="brand">HOUSE OF EON</Link>
        <nav className="navlinks">
          <Link href="/products">Perfumes</Link>
          <Link href="/long-lasting-perfume-for-men-india">Men</Link>
          <Link href="/best-perfume-for-women-in-india">Women</Link>
          <Link href="/track-order">Track</Link>
          <Link href="/cart" className="btn ghost">Cart ({count})</Link>
        </nav>
      </div>
    </header>
  );
}
