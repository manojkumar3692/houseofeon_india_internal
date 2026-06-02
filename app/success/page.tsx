import Link from "next/link";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  return (
    <section className="section">
      <div className="container">
        <div className="card">
          <h1 className="section-title">Order confirmed</h1>
          <p className="lead">Thank you. Your payment is successful.</p>
          {order ? <p><b>Order number:</b> {order}</p> : null}
          <p className="muted">Our office has been notified. Shipping details will be updated after dispatch.</p>
          <div className="product-actions">
            <Link href="/track-order" className="btn">Track order</Link>
            <Link href="/products" className="btn secondary">Shop more</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
