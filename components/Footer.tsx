"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const instagramUrl = "https://www.instagram.com/houseofeon_india/";
const instagramReelsUrl = "https://www.instagram.com/houseofeon_india/reels/";
const facebookUrl = "https://www.facebook.com/profile.php?id=61569101812630";
const whatsappUrl = "https://wa.me/919902376600";

export default function Footer() {
  const pathname = usePathname();
  // The floating WhatsApp bubble is fixed-position at the bottom-right —
  // on checkout that's the exact spot the sticky mobile Pay bar lives too,
  // so it's a genuine accidental-tap risk sitting right on top of the one
  // button that matters most. Hide only the floating bubble here; the
  // plain WhatsApp support link further down in the footer still works for
  // anyone who deliberately scrolls down looking for it.
  const isCheckout =
    pathname?.startsWith("/checkout") || pathname?.startsWith("/trial-pack");

  // Same reasoning as Header: /scent-fix is a standalone ad landing page
  // with its own dark design system and no site chrome.
  if (pathname?.startsWith("/scent-fix")) return null;

  return (
    <footer className="footer brand-footer">
      <div className="container footer-grid">
        <div>
          <div className="footer-brand">HOUSE OF EON</div>

          <p>
            Premium long-lasting perfumes crafted for modern Indian confidence.
            Shop online with secure checkout and WhatsApp support.
          </p>

          <div className="footer-socials" aria-label="House of Eon social links">
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>

            <a href={instagramReelsUrl} target="_blank" rel="noopener noreferrer">
              Reels
            </a>

            <a href={facebookUrl} target="_blank" rel="noopener noreferrer">
              Facebook
            </a>

            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          </div>
        </div>

        <div>
          <b>Shop</b>

          <Link href="/products">All perfumes</Link>
          <Link href="/long-lasting-perfume-for-men-india">
            Best perfume for men
          </Link>
          <Link href="/best-perfume-for-women-in-india">
            Best perfume for women
          </Link>
          <Link href="/scent-fix">Find your scent</Link>
          <Link href="/pages/diwali-perfume">Diwali perfume gifts</Link>
          <Link href="/scent-swipe">Play &amp; win 20%</Link>
          <Link href="/guides">Perfume guides</Link>
          <Link href="/cart">Cart</Link>
          <Link href="/track-order">Track order</Link>
        </div>

        <div>
          <b>Support</b>

          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            WhatsApp support
          </a>

          <p className="footer-mini-text">
            Shipping tracking will be shared after dispatch.
          </p>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} House of Eon</span>
        <span>Made in India · Premium perfumes</span>
      </div>

      {!isCheckout ? (
        <a
          className="whatsapp"
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with House of Eon on WhatsApp"
        >
          WhatsApp
        </a>
      ) : null}
    </footer>
  );
}
