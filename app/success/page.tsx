import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Order Confirmed | House of Eon",
  description: "Your House of Eon perfume order has been confirmed.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;

  return (
    <>
      <section className="success-hero">
        <div className="container success-hero-grid">
          <div className="success-copy">
            <div className="eyebrow">Payment Successful</div>

            <h1>Order confirmed.</h1>

            <p>
              Your House of Eon perfume is now getting ready for the next step.
              Our office has been notified and shipping details will be updated
              after dispatch.
            </p>

            {order ? (
              <div className="success-order-box">
                <span>Order number</span>
                <b>{order}</b>
              </div>
            ) : null}

            <div className="product-actions">
              <Link href="/track-order" className="btn">
                Track order
              </Link>
              <Link href="/products" className="btn secondary">
                Shop more
              </Link>
            </div>
          </div>

          <div className="success-visual" aria-hidden="true">
            <div className="success-ring">
              <div className="success-check">✓</div>
            </div>

            <div className="success-bottle">
              <div className="success-bottle-cap" />
              <div className="success-bottle-shine" />
              <div className="success-bottle-label">
                <span>HOUSE OF EON</span>
                <strong>EON</strong>
                <small>ORDER CONFIRMED</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section success-section">
        <div className="container">
          <div className="success-steps-card">
            <div className="section-head">
              <div>
                <div className="eyebrow">What happens next?</div>
                <h2 className="section-title">From order placed to perfume delivered.</h2>
              </div>
            </div>

            <div className="success-steps-grid">
              <article>
                <span>01</span>
                <h3>Order received</h3>
                <p>
                  Your payment has been completed and your order has been saved
                  in our system.
                </p>
              </article>

              <article>
                <span>02</span>
                <h3>Packing begins</h3>
                <p>
                  Our team will prepare your perfume order and update the
                  shipping status after dispatch.
                </p>
              </article>

              <article>
                <span>03</span>
                <h3>Track anytime</h3>
                <p>
                  Use your order number and phone number to check payment,
                  shipping and tracking details.
                </p>
              </article>
            </div>

            <div className="success-trust-strip">
              <div>
                <b>Secure Payment</b>
                <span>Processed via Razorpay</span>
              </div>
              <div>
                <b>Order Tracking</b>
                <span>Updated after dispatch</span>
              </div>
              <div>
                <b>WhatsApp Support</b>
                <span>Help available for order issues</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}