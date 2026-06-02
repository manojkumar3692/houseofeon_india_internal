"use client";

import Link from "next/link";
import { useCart } from "./CartContext";

export default function Header() {
  const { count } = useCart();
  return (
    <header className="header">
      <div className="container nav">
        <Link href="/" className="brand">HOUSE OF EON</Link>
        <nav className="navlinks">
          <Link href="/products">Perfumes</Link>
          <Link href="/track-order">Track</Link>
          <Link href="/cart" className="btn ghost">Cart ({count})</Link>
        </nav>
      </div>
    </header>
  );
}
