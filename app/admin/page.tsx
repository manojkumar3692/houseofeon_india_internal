"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatINR, paiseToINR } from "@/lib/money";

type Order = {
  id:string; order_number:string; customer_name:string; customer_phone:string; customer_email?:string|null;
  customer_address:string; customer_city?:string; customer_state?:string; customer_pincode?:string;
  items:Array<{name:string;quantity:number;lineTotal:number}>; amount_in_paise:number; payment_status:string;
  shipping_status:string; tracking_url?:string|null; created_at:string;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  useEffect(() => { const saved = localStorage.getItem("hoe_admin_token"); if (saved) setToken(saved); }, []);
  useEffect(() => { if (token) loadOrders(token); }, [token]);

  async function login(event: FormEvent) {
    event.preventDefault();
    setError("");
    const res = await fetch("/api/admin/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({password}) });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Login failed");
    localStorage.setItem("hoe_admin_token", data.token);
    setToken(data.token);
  }

  async function loadOrders(authToken = token) {
    const res = await fetch("/api/admin/orders", { headers:{ Authorization:`Bearer ${authToken}` } });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not load orders");
    setOrders(data.orders);
  }

  async function updateOrder(id:string, shipping_status:string, tracking_url:string) {
    const res = await fetch(`/api/admin/orders/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`}, body:JSON.stringify({shipping_status, tracking_url}) });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Update failed");
    await loadOrders();
  }

  if (!token) {
    return <section className="section"><div className="container"><form className="card form" onSubmit={login} style={{maxWidth:420}}><h1>Admin login</h1><input className="input" type="password" placeholder="Admin password" value={password} onChange={(e)=>setPassword(e.target.value)} /><button className="btn">Login</button>{error ? <p className="notice">{error}</p> : null}</form></div></section>;
  }

  return (
    <section className="section"><div className="container"><h1 className="section-title">Admin Orders</h1><button className="btn secondary" onClick={()=>loadOrders()}>Refresh</button>{error ? <p className="notice">{error}</p> : null}<div style={{overflowX:"auto", marginTop:20}}><table className="table"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Amount</th><th>Payment</th><th>Shipping</th><th>Tracking</th><th>Action</th></tr></thead><tbody>{orders.map((order)=><AdminRow key={order.id} order={order} updateOrder={updateOrder} />)}</tbody></table></div></div></section>
  );
}

function AdminRow({ order, updateOrder }: { order: Order; updateOrder:(id:string,status:string,tracking:string)=>void }) {
  const [status, setStatus] = useState(order.shipping_status);
  const [tracking, setTracking] = useState(order.tracking_url || "");
  return <tr><td><b>{order.order_number}</b><br/><span className="muted">{new Date(order.created_at).toLocaleString()}</span></td><td>{order.customer_name}<br/>{order.customer_phone}<br/><span className="muted">{order.customer_address}, {order.customer_city}</span></td><td>{order.items.map((item)=><div key={item.name}>{item.name} x {item.quantity}</div>)}</td><td>{formatINR(paiseToINR(order.amount_in_paise))}</td><td className="status">{order.payment_status}</td><td><select className="select" value={status} onChange={(e)=>setStatus(e.target.value)}><option value="pending">pending</option><option value="packed">packed</option><option value="shipped">shipped</option><option value="delivered">delivered</option><option value="cancelled">cancelled</option></select></td><td><input className="input" placeholder="Tracking URL" value={tracking} onChange={(e)=>setTracking(e.target.value)} /></td><td><button className="btn" onClick={()=>updateOrder(order.id,status,tracking)}>Save</button></td></tr>;
}
