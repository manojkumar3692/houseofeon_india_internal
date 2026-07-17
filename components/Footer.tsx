import Link from "next/link";

const instagramUrl = "https://www.instagram.com/houseofeon_india/";
const instagramReelsUrl = "https://www.instagram.com/houseofeon_india/reels/";
const facebookUrl = "https://www.facebook.com/profile.php?id=61569101812630";
const whatsappUrl = "https://wa.me/919902376600";

export default function Footer() {
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
            Perfume guide
          </Link>
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

      <a
        className="whatsapp"
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with House of Eon on WhatsApp"
      >
        WhatsApp
      </a>
    </footer>
  );
}