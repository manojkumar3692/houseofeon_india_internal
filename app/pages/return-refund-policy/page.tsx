import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Return & Replacement Policy | House of Eon",
  description:
    "House of Eon's policy for defective or damaged products, replacements and return shipping in India.",
  alternates: {
    canonical: `${SITE_URL}/pages/return-refund-policy`,
  },
};

export default function ReturnRefundPolicyPage() {
  return (
    <main>
      <section className="section">
        <div className="container" style={{ maxWidth: 820 }}>
          <div className="eyebrow">Customer Support</div>
          <h1>Return &amp; replacement policy</h1>

          <p className="muted">
            This policy applies to orders delivered within India.
          </p>

          <h2>Defective or damaged products</h2>
          <p>
            If your product arrives defective or damaged, contact House of Eon
            within three calendar days of delivery. Include your order number
            and clear photographs of the product and packaging so the issue can
            be reviewed.
          </p>

          <h2>Eligible resolution</h2>
          <p>
            Approved defective or damaged products are eligible for a
            replacement or exchange. House of Eon does not accept returns or
            provide refunds for change of mind, fragrance preference, or an
            opened product that is not defective or damaged.
          </p>

          <h2>Return shipping</h2>
          <p>
            Return shipping is not free. The customer is responsible for the
            cost of sending an approved return to House of Eon. Instructions
            will be provided after the claim is reviewed.
          </p>

          <h2>Request support</h2>
          <p>
            Contact us through WhatsApp within the three-day claim window. Do
            not send a product back before receiving return instructions.
          </p>

          <p>
            <a
              className="btn"
              href="https://wa.me/919902376600"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact WhatsApp support
            </a>
          </p>

          <p>
            <Link href="/products" className="text-link">
              Return to all perfumes →
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
