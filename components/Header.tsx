"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "./CartContext";

export default function Header() {
  const { count } = useCart();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  // /scent-fix is a dedicated Meta-ad landing page — its own dark design
  // system, deliberately no site nav so cold traffic can't click away
  // from the one thing the ad promised before the payoff lands.
  if (pathname?.startsWith("/scent-fix")) return null;

  // The Discovery Set is primarily a paid-traffic landing page. Keep the
  // visitor focused on choosing and checking out while retaining a direct
  // support route for the trust questions that commonly block cold traffic.
  if (pathname?.startsWith("/trial-pack")) {
    return (
      <header className="header trial-landing-header">
        <div className="container trial-landing-nav">
          <Link href="/" className="brand">HOUSE OF EON</Link>
          <a
            className="trial-landing-help"
            href="https://wa.me/919902376600"
            target="_blank"
            rel="noopener noreferrer"
          >
            Need help? <strong>WhatsApp</strong>
          </a>
        </div>
      </header>
    );
  }

  // Checkout intentionally removes shopping navigation so a customer who is
  // ready to pay has one clear path forward, while keeping help one tap away.
  if (pathname?.startsWith("/checkout")) {
    return (
      <header className="header checkout-focused-header">
        <div className="container checkout-focused-nav">
          <span className="brand">HOUSE OF EON</span>
          <div className="checkout-focused-actions">
            <span className="checkout-focused-secure" aria-label="Secure checkout">
              <span aria-hidden="true">&#128274;</span> Secure checkout
            </span>
            <a
              className="checkout-focused-help"
              href="https://wa.me/919902376600?text=Hi%20House%20of%20Eon%2C%20I%20need%20help%20completing%20my%20payment."
              target="_blank"
              rel="noopener noreferrer"
            >
              Need help? <strong>WhatsApp</strong>
            </a>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="header">
      <div className="container nav">
        <Link href="/" className="brand">HOUSE OF EON</Link>

        <nav className="navlinks desktop-nav" aria-label="Main navigation">
          <Link href="/products">Perfumes</Link>
          <Link href="/long-lasting-perfume-for-men-india">Men</Link>
          <Link href="/best-perfume-for-women-in-india">Women</Link>
          <Link href="/track-order">Track</Link>
          <Link
            href="/trial-pack"
            className="nav-trial-link"
            aria-current={pathname === "/trial-pack" ? "page" : undefined}
          >
            Trial Pack
          </Link>
          <Link href="/cart" className="btn ghost">Cart ({count})</Link>
        </nav>

        <div className="mobile-nav-actions">
          <Link
            href="/trial-pack"
            className="mobile-trial-link"
            aria-current={pathname === "/trial-pack" ? "page" : undefined}
          >
            Trial Pack
          </Link>
          <Link href="/cart" className="mobile-cart-link" aria-label={`Cart with ${count} items`}>
            Cart <span>{count}</span>
          </Link>
          <button
            type="button"
            className={`menu-toggle${menuOpen ? " is-open" : ""}`}
            aria-expanded={menuOpen}
            aria-controls="mobile-site-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      <nav
        id="mobile-site-menu"
        className={`mobile-menu${menuOpen ? " is-open" : ""}`}
        aria-label="Mobile navigation"
      >
        <div className="container mobile-menu-inner">
          <Link href="/products" onClick={() => setMenuOpen(false)}>Perfumes <span>01</span></Link>
          <Link href="/long-lasting-perfume-for-men-india" onClick={() => setMenuOpen(false)}>Men <span>02</span></Link>
          <Link href="/best-perfume-for-women-in-india" onClick={() => setMenuOpen(false)}>Women <span>03</span></Link>
          <Link href="/track-order" onClick={() => setMenuOpen(false)}>Track Order <span>04</span></Link>
        </div>
      </nav>
    </header>
  );
}
