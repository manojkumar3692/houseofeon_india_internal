import { authorizeCheckout, checkoutEnabled } from '@/lib/negotiation/security';
import { checkoutRecord, customerSchema } from '@/lib/negotiation/checkout';
import { beginPayment, cancelCheckout, reconcile } from '@/lib/negotiation/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const json = (data: unknown, status = 200) => Response.json(data, { status,
  headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    authorizeCheckout(id, request);
    const c = await checkoutRecord(id);
    return json({ name: c.items[0].name, quantity: c.quote.cart.lines[0].quantity,
      itemMinor: c.quote.amountMinor, shippingMinor: c.quote.shippingMinor, currency: c.quote.currency,
      expiresAt: c.expires_at, state: c.state, pincode: c.quote.cart.destination?.postalCode,
      enabled: checkoutEnabled() });
  } catch { return json({ error: 'Checkout unavailable' }, 404); }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    authorizeCheckout(id, request);
    if (Number(request.headers.get('content-length')) > 8192) return json({ error: 'Request too large' }, 413);
    const raw = await request.text();
    if (raw.length > 8192) return json({ error: 'Request too large' }, 413);
    const input = JSON.parse(raw);
    if (input?.action === 'status' && Object.keys(input).length === 1) return json(await reconcile(id));
    if (input?.action === 'cancel' && Object.keys(input).length === 1) { await cancelCheckout(id); return json({ status: 'cancelled' }); }
    // Strict schema rejects supplied prices/items/coupons or arbitrary actions.
    const customer = customerSchema.parse(input);
    return json(await beginPayment(id, customer));
  } catch { return json({ error: 'Checkout unavailable or payment pending recovery. Retry, or contact support.' }, 409); }
}
