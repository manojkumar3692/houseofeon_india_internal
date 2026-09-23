'use client';
import { useEffect, useRef, useState } from 'react';

type Offer = { name: string; quantity: number; itemMinor: number; shippingMinor: number; currency: string;
  expiresAt: string; state: string; pincode: string; enabled: boolean };
const money = (minor: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(minor / 100);

export default function NegotiatedCheckout({ id }: { id: string }) {
  const token = useRef('');
  const [offer, setOffer] = useState<Offer | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [clock, setClock] = useState(Date.now());
  async function call(body?: unknown) {
    const response = await fetch(`/api/negotiation/checkout/${encodeURIComponent(id)}`, {
      method: body === undefined ? 'GET' : 'POST', cache: 'no-store',
      headers: { Authorization: `Bearer ${token.current}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const result = await response.json();
    if (!response.ok) throw Error(result.error || 'Checkout unavailable');
    return result;
  }
  useEffect(() => {
    try {
      const key = `eon-checkout:${id}`, fragment = location.hash.slice(1);
      if (fragment) { sessionStorage.setItem(key, fragment); history.replaceState(null, '', location.pathname); }
      token.current = sessionStorage.getItem(key) || '';
      call().then(setOffer).catch(e => setError(e.message));
    } catch { setError('Open your offer link in a browser with session storage enabled.'); }
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
    // The credential stays in the tab, never in an URL query or analytics.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  const expired = offer ? Date.parse(offer.expiresAt) <= clock : false;
  async function action(kind: 'cancel' | 'status') {
    setBusy(true); setError('');
    try { const result = await call({ action: kind }); setOffer(v => v ? { ...v, state: result.status } : v); }
    catch (e) { setError(e instanceof Error ? e.message : 'Please try again'); }
    finally { setBusy(false); }
  }
  return <main style={{ maxWidth: 580, margin: '40px auto', padding: 24 }}>
    <h1>Your agreed offer</h1>
    {error && <p role="alert">{error}</p>}
    {!offer && !error && <p>Loading your offer…</p>}
    {offer && <>
      <p>{offer.name} × {offer.quantity}</p>
      <p>Items: {money(offer.itemMinor)} · Shipping: {money(offer.shippingMinor)}</p>
      <p><strong>Total: {money(offer.itemMinor + offer.shippingMinor)}</strong></p>
      {offer.state !== 'pending' ? <p role="status">Order status: {offer.state}</p> : <>
        <p>{expired ? 'This offer has expired.' : `Offer expires ${new Date(offer.expiresAt).toLocaleTimeString()}.`}</p>
        {!offer.enabled && <p>New negotiated payments are paused.</p>}
        <form onSubmit={async event => {
          event.preventDefault(); setBusy(true); setError('');
          const data = Object.fromEntries(new FormData(event.currentTarget));
          try { const result = await call(data); window.location.assign(result.paymentUrl); }
          catch (e) { setError(e instanceof Error ? e.message : 'Please try again'); setBusy(false); }
        }}>
          <fieldset disabled={busy || expired || !offer.enabled} style={{ display: 'grid', gap: 14, border: 0, padding: 0 }}>
            {(['name', 'phone', 'email', 'address', 'city', 'state'] as const).map(name => <label key={name} style={{ display: 'grid', gap: 4 }}>
              {({ name: 'Full name', phone: 'Phone', email: 'Email', address: 'Delivery address', city: 'City', state: 'State' })[name]}
              <input name={name} type={name === 'email' ? 'email' : name === 'phone' ? 'tel' : 'text'} required maxLength={name === 'address' ? 500 : 200} style={{ padding: 12 }} />
            </label>)}
            <label>Postcode <input name="pincode" value={offer.pincode} readOnly style={{ padding: 12 }} /></label>
            <p>Your agreed price already includes the offer. No additional coupon applies.</p>
            <button type="submit" style={{ padding: 14 }}>{busy ? 'Preparing payment…' : `Pay ${money(offer.itemMinor + offer.shippingMinor)}`}</button>
          </fieldset>
        </form>
        <button disabled={busy} onClick={() => action('cancel')} style={{ marginTop: 16 }}>Cancel checkout</button>
      </>}
      <button disabled={busy} onClick={() => action('status')} style={{ margin: 16 }}>Check payment status</button>
    </>}
  </main>;
}
