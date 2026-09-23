import { createHmac, timingSafeEqual } from 'node:crypto';
import { connectorConfig } from './config';

export function identity() {
  // Reporting for existing orders must work while new invitations/checkouts
  // are paused. Credentials remain the same; no credential regeneration.
  const config = connectorConfig({ ...process.env, NEGOTIATION_CONNECTOR_ENABLED: 'true' });
  if (!config) throw Error('Connector identity unavailable');
  return config;
}

export function checkoutToken(id: string) {
  const { installationId, secret } = identity();
  return createHmac('sha256', secret).update(`houseofeon:checkout:v1:${installationId}:${id}`).digest('base64url');
}

export function authorizeCheckout(id: string, request: Request) {
  if (!/^[a-f0-9-]{36}$/i.test(id)) throw Error('Checkout unavailable');
  const provided = request.headers.get('authorization')?.replace(/^Bearer /, '') || '';
  const expected = checkoutToken(id);
  if (provided.length !== expected.length || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) throw Error('Checkout unavailable');
}

export function checkoutEnabled() {
  return !!connectorConfig(process.env) && process.env.NEGOTIATION_CHECKOUT_ENABLED === 'true' &&
    process.env.INVENTORY_ENFORCEMENT_ENABLED === 'true';
}

export function assertCheckoutEnabled() {
  if (!checkoutEnabled()) throw Error('Negotiated checkout is paused');
}
