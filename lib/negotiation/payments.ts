import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { checkoutRecord, customerSchema, rpc, type Checkout, type Customer } from './checkout';
import { assertCheckoutEnabled, identity } from './security';
import { PLATFORM_ORIGIN } from './facts';
import { sendConnectorEvent } from './vendor/handler.mjs';
import { after } from 'next/server';
import { createDelhiveryShipmentForPaidOrder } from '@/lib/delhivery';
import { sendOrderEmails } from '@/lib/email';
import { buildCustomerAddress } from '@/lib/order';

type Link = {
  id: string; reference_id: string; amount: number; amount_paid: number; currency: string;
  accept_partial: boolean; expire_by: number; short_url: string; status: string;
  payments?: { payment_id: string; status: string }[] | null;
};
type Payment = { id: string; order_id: string; amount: number; currency: string; status: string; amount_refunded: number };

async function provider<T>(path: string, body?: unknown): Promise<T> {
  const { RAZORPAY_KEY_ID: key, RAZORPAY_KEY_SECRET: secret } = process.env;
  if (!key || !secret) throw Error('Payment provider not configured');
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method: body === undefined ? 'GET' : 'POST', redirect: 'error', cache: 'no-store',
    headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw Object.assign(Error('Payment provider unavailable; retry to recover the existing checkout'),
    { definiteRejection: response.status === 400 || response.status === 422 });
  return response.json();
}

export function validateLink(c: Checkout, link: Link) {
  const url = new URL(link.short_url);
  if (!/^plink_[A-Za-z0-9]+$/.test(link.id) || link.reference_id !== c.id ||
      link.amount !== c.quote.amountMinor + c.quote.shippingMinor || link.currency !== c.quote.currency ||
      link.accept_partial !== false || link.expire_by !== Math.floor(Date.parse(c.expires_at) / 1000) ||
      url.protocol !== 'https:' || url.username || url.password ||
      !['rzp.io', 'rzp.in', 'razorpay.com'].some(h => url.hostname === h || url.hostname.endsWith(`.${h}`))) {
    throw Error('Payment link does not match approved quote');
  }
}

async function findLink(c: Checkout): Promise<Link | null> {
  if (c.provider_link_id) return provider<Link>(`payment_links/${encodeURIComponent(c.provider_link_id)}`);
  if (c.provider_state === 'unstarted') return null;
  const result = await provider<{ payment_links: Link[] }>(`payment_links?reference_id=${encodeURIComponent(c.id)}`);
  if (!Array.isArray(result.payment_links)) throw Error('Payment recovery unavailable');
  const matches = result.payment_links.filter(link => link.reference_id === c.id);
  if (matches.length > 1) throw Error('Ambiguous provider reference');
  return matches[0] || null;
}

async function persistLink(c: Checkout, link: Link) {
  validateLink(c, link);
  const { error } = await getSupabaseAdmin().from('negotiation_checkouts')
    .update({ provider_link_id: link.id, provider_url: link.short_url, provider_state: 'ready' })
    .eq('id', c.id).eq('installation_id', c.installation_id);
  if (error) throw Error('Payment link persistence unavailable; retry to recover');
}

export async function beginPayment(id: string, customer: Customer) {
  assertCheckoutEnabled();
  customerSchema.parse(customer);
  let c = await checkoutRecord(id);
  if (c.quote.cart.destination?.postalCode !== customer.pincode || c.quote.cart.destination.country !== 'IN') throw Error('Use the postcode from the approved offer');
  const claim = await rpc('prepare_negotiation_payment', {
    p_id: id, p_installation: c.installation_id, p_customer: customer,
  });
  c = await checkoutRecord(id);
  let link = claim.claimed ? null : await findLink(c);
  if (!link && claim.claimed) {
    // There is no ordinary coupon input here. Payment provider receives the
    // approved total once, no partial payments, no offers, no notifications.
    try { link = await provider<Link>('payment_links', {
      amount: c.quote.amountMinor + c.quote.shippingMinor, currency: c.quote.currency,
      accept_partial: false, reference_id: c.id, expire_by: Math.floor(Date.parse(c.expires_at) / 1000),
      customer: { name: customer.name, email: customer.email, contact: customer.phone },
      description: `House of EON negotiated order EON-${id.replaceAll('-', '')}`,
      notify: { sms: false, email: false }, reminder_enable: false,
      notes: { negotiation_quote_id: id, negotiation_installation_id: c.installation_id },
    }); } catch (error) {
      // A validation rejection created no payable link (e.g. unsupported TTL).
      // Timeouts, 409s and 5xx remain recoverable and are never assumed absent.
      if ((error as { definiteRejection?: boolean }).definiteRejection) {
        await applyState(c, 'cancelled', undefined, true);
        await deliverEvents(id);
      }
      throw error;
    }
  }
  // An uncertain external write is never repeated. A later retry recovers by
  // reference_id. If no link exists, operations must resolve the creating row.
  if (!link) throw Error('Payment creation is pending recovery; please retry shortly');
  await persistLink(c, link);
  if (c.state !== 'pending' || Date.parse(c.expires_at) <= Date.now() || link.status !== 'created') throw Error('Checkout is no longer payable');
  return { paymentUrl: link.short_url };
}

async function applyState(c: Checkout, state: 'paid' | 'cancelled' | 'refunded', payment?: Payment, providerCancelled = false) {
  return rpc('apply_negotiation_state', { p_id: c.id, p_installation: c.installation_id, p_state: state,
    p_payment: payment?.id ?? null, p_provider_order: payment?.order_id ?? null, p_refunded: payment?.amount_refunded ?? 0,
    p_provider_cancelled: providerCancelled });
}

export async function deliverEvents(id: string) {
  const { installationId, secret } = identity();
  for (let count = 0; count < 3; count++) {
    const event = await rpc('claim_negotiation_event', { p_id: id, p_installation: installationId });
    if (!event) return;
    try {
      await sendConnectorEvent({ platformOrigin: PLATFORM_ORIGIN, installationId, secret,
        event: { eventId: event.event_id, externalId: event.checkout_id, type: event.event_type,
          occurredAt: new Date(event.occurred_at).toISOString() } });
      const { error } = await getSupabaseAdmin().from('negotiation_outbox').update({ delivered_at: new Date().toISOString(), lease_until: null })
        .eq('event_id', event.event_id).eq('lease_token', event.lease_token);
      if (error) throw Error('Event acknowledgement unavailable');
    } catch {
      await getSupabaseAdmin().from('negotiation_outbox').update({ lease_until: null })
        .eq('event_id', event.event_id).eq('lease_token', event.lease_token);
      throw Error('Payment event pending delivery');
    }
  }
}

export async function reconcile(id: string) {
  let c = await checkoutRecord(id);
  const { error: checkedError } = await getSupabaseAdmin().from('negotiation_checkouts')
    .update({ last_reconciled_at: new Date().toISOString() }).eq('id', id).eq('installation_id', c.installation_id);
  if (checkedError) throw Error('Reconciliation storage unavailable');
  const link = await findLink(c);
  if (link) {
    await persistLink(c, link);
    if (link.status === 'paid') {
      if (link.amount_paid !== link.amount) throw Error('Captured total mismatch');
      const paymentId = c.payment_id || link.payments?.find(p => p.status === 'captured')?.payment_id;
      if (!paymentId) throw Error('Capture details pending');
      const payment = await provider<Payment>(`payments/${encodeURIComponent(paymentId)}`);
      if (payment.id !== paymentId || payment.amount !== link.amount || payment.currency !== link.currency ||
          !['captured', 'refunded'].includes(payment.status) || !Number.isSafeInteger(payment.amount_refunded) ||
          payment.amount_refunded < 0 || payment.amount_refunded > payment.amount) throw Error('Capture mismatch');
      const state = payment.amount_refunded === payment.amount ? 'refunded' : 'paid';
      const changed = await applyState(c, state, payment);
      if (changed && state === 'paid' && c.order_id) {
        after(async () => {
          const { data: order } = await getSupabaseAdmin().from('orders').select('*').eq('id', c.order_id).single();
          const current = await checkoutRecord(c.id);
          if (!order || current.state !== 'paid' || order.shipping_status === 'cancelled') return;
          await createDelhiveryShipmentForPaidOrder(order.id);
          await sendOrderEmails({ orderNumber: order.order_number, order_id: order.order_number,
            customerName: order.customer_name, customerPhone: order.customer_phone, customerEmail: order.customer_email,
            address: buildCustomerAddress(order), amountInPaise: order.amount_in_paise, items: order.items,
            razorpayOrderId: order.razorpay_order_id, razorpayPaymentId: order.razorpay_payment_id, paymentType: 'full',
            tokenAmountInPaise: 0, balanceDueInPaise: 0 });
        });
      }
    } else if (['cancelled', 'expired'].includes(link.status)) {
      await applyState(c, 'cancelled', undefined, true);
    }
  } else if (c.provider_state === 'unstarted' && Date.parse(c.expires_at) <= Date.now()) {
    await applyState(c, 'cancelled');
  } else if (c.provider_state === 'creating') {
    throw Error('Provider creation requires recovery');
  }
  c = await checkoutRecord(id);
  await deliverEvents(id);
  return { externalId: id, status: c.state };
}

export async function cancelCheckout(id: string) {
  const c = await checkoutRecord(id);
  if (c.state === 'refunded') return;
  if (c.state === 'paid') throw Error('Paid checkout requires a provider refund');
  const link = await findLink(c);
  if (link) {
    validateLink(c, link);
    if (link.status === 'paid') { await reconcile(id); throw Error('Payment already captured; refund required'); }
    if (!['cancelled', 'expired'].includes(link.status)) {
      const cancelled = await provider<Link>(`payment_links/${encodeURIComponent(link.id)}/cancel`, {});
      validateLink(c, cancelled);
      if (cancelled.status !== 'cancelled') throw Error('Cancellation not confirmed');
    }
  } else if (c.provider_state !== 'unstarted') throw Error('Recover the provider request before cancellation');
  await applyState(c, 'cancelled', undefined, !!link);
  await deliverEvents(id);
}

export async function processNegotiationWebhook(body: any): Promise<boolean> {
  const event = body?.event;
  if (typeof event !== 'string') return false;
  const db = getSupabaseAdmin();
  let id: string | undefined;
  if (event.startsWith('payment_link.')) {
    const reference = body?.payload?.payment_link?.entity?.reference_id;
    if (typeof reference !== 'string' || !/^[a-f0-9-]{36}$/i.test(reference)) return false;
    const { data, error } = await db.from('negotiation_checkouts').select('id').eq('id', reference).maybeSingle();
    if (error) throw Error('Negotiated checkout lookup unavailable');
    id = data?.id;
  } else if (['payment.captured', 'payment.failed', 'refund.processed'].includes(event)) {
    const payment = body?.payload?.payment?.entity;
    const paymentId = body?.payload?.refund?.entity?.payment_id || payment?.id;
    const orderId = payment?.order_id;
    if (!paymentId && !orderId) return false;
    // Older ordinary orders have no negotiation attribution; they retain their
    // original handler even before the additive migration is installed.
    let query = db.from('orders').select('*');
    query = orderId ? query.eq('razorpay_order_id', orderId) : query.eq('razorpay_payment_id', paymentId);
    const { data, error } = await query.maybeSingle();
    if (error) throw Error('Order lookup unavailable');
    id = data?.negotiation_quote_id;
  }
  if (!id) return false;
  // A failed attempt does not cancel a reusable, still-payable provider link.
  await reconcile(id);
  return true;
}
