"use client";

import { FormEvent, useState } from "react";

type Order = { order_number:string; payment_status:string; shipping_status:string; tracking_url?:string | null; created_at:string };

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setOrder(null);
    const response = await fetch(`/api/orders/track?order=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`);
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Order not found");
    setOrder(data.order);
  }

  return (
    <section className="section">
      <div className="container">
        <h1 className="section-title">Track Order</h1>
        <form className="card form" onSubmit={submit} style={{maxWidth:620}}>
          <input className="input" required placeholder="Order number" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
          <input className="input" required placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button className="btn">Check status</button>
        </form>
        {error ? <p className="notice" style={{maxWidth:620}}>{error}</p> : null}
        {order ? <div className="card" style={{maxWidth:620,marginTop:20}}>
          <h2>{order.order_number}</h2>
          <p><b>Payment:</b> <span className="status">{order.payment_status}</span></p>
          <p><b>Shipping:</b> <span className="status">{order.shipping_status}</span></p>
          {order.tracking_url ? <a className="btn" href={order.tracking_url} target="_blank">Open tracking link</a> : <p className="muted">Tracking link will appear after dispatch.</p>}
        </div> : null}
      </div>
    </section>
  );
}
