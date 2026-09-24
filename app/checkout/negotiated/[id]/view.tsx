'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './checkout.module.css';

type Offer = { name: string; productSlug?: string; productImage?: string; quantity: number; itemMinor: number; shippingMinor: number; currency: string;
  expiresAt: string; paymentStartUntil: string; state: string; pincode: string; enabled: boolean };
const money = (minor: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(minor / 100);
const fields = [
  { name: 'name', label: 'Full name', autoComplete: 'name', placeholder: 'Name on your delivery' },
  { name: 'phone', label: 'Mobile number', autoComplete: 'tel', placeholder: '10-digit mobile number', type: 'tel' },
  { name: 'email', label: 'Email address', autoComplete: 'email', placeholder: 'you@example.com', type: 'email' },
  { name: 'address', label: 'Delivery address', autoComplete: 'street-address', placeholder: 'House, building, street and area' },
  { name: 'city', label: 'City', autoComplete: 'address-level2', placeholder: 'City' },
  { name: 'state', label: 'State', autoComplete: 'address-level1', placeholder: 'State' },
];

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
      if (!token.current) setError('Open the secure checkout link from your EON conversation in the original browser tab.');
      else call().then(setOffer).catch(e => setError(e.message));
    } catch { setError('Open your offer link in a browser with session storage enabled.'); }
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
    // The credential stays in the tab, never in a query or analytics.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  const productHref = offer?.productSlug ? `/products/${encodeURIComponent(offer.productSlug)}` : '/products';
  const backLabel = offer ? `Back to ${offer.name}` : 'Back to perfumes';
  const expired = offer ? Date.parse(offer.expiresAt) <= clock : false;
  const tooLate = offer ? Date.parse(offer.paymentStartUntil) <= clock : false;
  const payable = offer?.state === 'pending' && !expired && !tooLate;
  const seconds = offer ? Math.max(0, Math.floor((Date.parse(offer.paymentStartUntil) - clock) / 1000)) : 0;
  async function action(kind: 'cancel' | 'status') {
    if (kind === 'cancel' && !window.confirm('Cancel this agreed offer? You will need a new offer to pay.')) return;
    setBusy(true); setError('');
    try { await call({ action: kind }); setOffer(await call()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Please try again'); }
    finally { setBusy(false); }
  }
  return <main className={styles.page}>
    <a className={styles.back} href={productHref}>← {backLabel}</a>
    <header className={styles.heading}><span className={styles.eyebrow}>YOUR EON OFFER</span><h1>A little closer to yours.</h1><p>Your agreed price. Free delivery. One secure checkout.</p></header>
    {error && <div className={styles.alert} role="alert">{error}</div>}
    {!offer && !error && <div className={styles.panel} role="status">Loading your secure offer…</div>}
    {offer && <div className={styles.layout}>
      <aside className={`${styles.panel} ${styles.summary}`}>
        <span className={styles.eyebrow}>YOUR ORDER</span>
        <div className={styles.product}>{offer.productImage && <img src={offer.productImage} alt={`${offer.name} perfume`} width={100} height={120} />}<div><h2>{offer.name}</h2><p>50 ml · Quantity {offer.quantity}</p><span className={styles.badge}>Agreed EON price</span></div></div>
        <dl className={styles.totals}><div><dt>Items</dt><dd>{money(offer.itemMinor)}</dd></div><div><dt>Delivery</dt><dd>{offer.shippingMinor === 0 ? 'Free' : money(offer.shippingMinor)}</dd></div><div className={styles.total}><dt>Total to pay</dt><dd>{money(offer.itemMinor + offer.shippingMinor)}</dd></div></dl>
        <p className={styles.note}>Your agreed offer is already included. No additional coupon applies.</p>
        {payable && <p className={styles.timer}>Start payment within <strong>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</strong></p>}
      </aside>
      <section className={styles.panel}>
        {payable ? <>
          <h2>Where should we deliver?</h2><p className={styles.intro}>Enter your details, then continue to Razorpay to pay securely.</p>
          {!offer.enabled && <div className={styles.alert}>New negotiated payments are temporarily paused.</div>}
          <form onSubmit={async event => {
            event.preventDefault(); setBusy(true); setError('');
            const data = Object.fromEntries(new FormData(event.currentTarget));
            try {
              const result = await call(data);
              if (typeof result.paymentUrl !== 'string' || !result.paymentUrl.startsWith('https://')) throw Error('Payment link unavailable. Check payment status before retrying.');
              window.location.assign(result.paymentUrl);
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Please try again');
              try { setOffer(await call()); } catch { /* Preserve the useful payment error. */ }
              setBusy(false);
            }
          }}>
            <fieldset disabled={busy || !offer.enabled} className={styles.fields}>
              {fields.map(field => <label className={field.name === 'city' || field.name === 'state' ? styles.half : styles.full} key={field.name}>
                {field.label}<input name={field.name} type={field.type || 'text'} autoComplete={field.autoComplete} placeholder={field.placeholder} required
                  minLength={field.name === 'address' ? 8 : undefined} pattern={field.name === 'phone' ? '\\+?[0-9]{10,13}' : undefined}
                  maxLength={field.name === 'address' ? 500 : field.name === 'email' ? 200 : field.name === 'phone' ? 14 : 100} />
              </label>)}
              <label className={styles.full}>Delivery postcode<input name="pincode" value={offer.pincode} readOnly autoComplete="postal-code" /><small>Locked to the postcode used for this offer.</small></label>
              <button className={styles.pay} type="submit">{busy ? 'Opening secure payment…' : `Continue to pay ${money(offer.itemMinor + offer.shippingMinor)} →`}</button>
            </fieldset>
            <p className={styles.secure}>Secure payment via Razorpay · Free shipping</p>
          </form>
        </> : <div className={styles.state} role="status">
          <span className={styles.eyebrow}>YOUR CHECKOUT</span>
          <h2>{offer.state === 'paid' ? 'Payment received. Thank you.' : offer.state === 'refunded' ? 'Your payment has been refunded.' : offer.state === 'cancelled' ? 'This checkout is closed.' : 'This offer’s payment window has ended.'}</h2>
          <p>{offer.state === 'paid' ? 'Your order is confirmed. We’ll send the order details to your email.' : offer.state === 'refunded' ? 'Your bank or payment provider will process the refund to your original payment method.' : `Return to ${offer.name} and request a fresh offer through EON. This checkout cannot start a new payment.`}</p>
          <a className={styles.returnLink} href={productHref}>{backLabel} →</a>
        </div>}
        <div className={styles.actions}><button disabled={busy} onClick={() => action('status')}>{busy ? 'Please wait…' : 'Check payment status'}</button>{offer.state === 'pending' && <button disabled={busy} onClick={() => action('cancel')}>Cancel this offer</button>}</div>
      </section>
    </div>}
  </main>;
}
