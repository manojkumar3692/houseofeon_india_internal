import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { createConnectorHandler, sendConnectorEvent } from '../lib/negotiation/vendor/handler.mjs';

const workspaceId = '11111111-1111-4111-8111-111111111111';
const installationId = '22222222-2222-4222-8222-222222222222';
const secret = 'test-only-installation-secret-not-a-credential';
const now = Date.now();
const caps = { businessModels: ['physical_goods'], catalog: true, inventory: true, economics: true,
  sales: false, shipping: 'zone_table', checkout: false, reconciliation: true, events: true };
const input = { schemaVersion: '3', workspaceId, installationId, operation: 'capabilities' };
function request(body = input, overrides = {}) {
  const raw = typeof body === 'string' ? body : JSON.stringify(body);
  const timestamp = overrides.timestamp || String(now), nonce = overrides.nonce || randomUUID();
  const signature = createHmac('sha256', secret).update(`${timestamp}\n${nonce}\n${raw}`).digest('hex');
  return new Request('https://staging.example/api/negotiation/v3', { method: 'POST', body: raw,
    headers: { authorization: `Bearer ${secret}`, 'x-negotiation-timestamp': timestamp,
      'x-negotiation-nonce': nonce, 'x-negotiation-signature': signature, ...overrides } });
}
function handler(overrides = {}) {
  const used = new Set();
  return createConnectorHandler({ workspaceId, installationId, secret, now: () => now,
    capabilities: async () => caps,
    claimNonce: async nonce => { if (used.has(nonce)) return false; used.add(nonce); return true; },
    createCheckout: async () => { throw Object.assign(Error(), { code: 'UNSUPPORTED' }); },
    ...overrides });
}
test('reference protocol returns validated, bound and fresh capabilities', async () => {
  const response = await handler()(request());
  assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
  const body = await response.json(); assert.equal(body.installationId, installationId);
  assert.equal(body.capabilities.checkout, false); assert.equal(Date.parse(body.expiresAt) - now, 60000);
});
test('rejects missing authentication, malformed HMAC, stale and future timestamps', async () => {
  for (const headers of [{ authorization: '' }, { 'x-negotiation-signature': '0'.repeat(64) },
    { 'x-negotiation-signature': 'a'.repeat(64) + 'zz' }, { timestamp: String(now - 30001) },
    { timestamp: String(now + 30001) }, { 'x-negotiation-nonce': 'a'.repeat(241) }]) {
    assert.equal((await handler()(request(input, headers))).status, 401);
  }
});
test('same signed request concurrently claims exactly once', async () => {
  const h = handler(), nonce = randomUUID();
  const results = await Promise.all(Array.from({ length: 20 }, () => h(request(input, { nonce }))));
  assert.equal(results.filter(r => r.status === 200).length, 1);
  assert.equal(results.filter(r => r.status === 409).length, 19);
});
test('nonce database failure is fail closed', async () => {
  assert.equal((await handler({ claimNonce: async () => { throw Error('offline'); } })(request())).status, 503);
});
test('wrong tenant, extra fields, invalid JSON and oversized input fail', async () => {
  for (const [body, status] of [[{ ...input, installationId: workspaceId }, 403],
    [{ ...input, leaked: true }, 400], ['{', 400], ['x'.repeat(256001), 413]]) {
    assert.equal((await handler()(request(body))).status, status);
  }
});
test('invalid backend response or exception never exposes raw data', async () => {
  for (const capabilities of [async () => ({ ...caps, password: 'hidden' }), async () => { throw Error('hidden'); }]) {
    const response = await handler({ capabilities })(request());
    assert.equal(response.status, 503); assert.doesNotMatch(await response.text(), /hidden/);
  }
});
test('checkout cannot fall through to retail checkout, even with a valid signed quote', async () => {
  const cart = { currency: 'INR', lines: [{ productId: 'test', variantId: 'test:50ml', quantity: 1 }],
    promotionCodes: [], paymentMethod: 'prepaid', destination: { country: 'IN', postalCode: '600001' } };
  const quote = { id: randomUUID(), cart, amountMinor: 100, shippingMinor: 0, currency: 'INR',
    expiresAt: new Date(now + 60000).toISOString(), contextRevision: 'revision' };
  assert.equal((await handler()(request({ ...input, operation: 'checkout', quote, idempotencyKey: randomUUID() }))).status, 422);
});
test('all event types use exact signed bytes and stable retry identifiers', async () => {
  for (const type of ['checkout.paid', 'checkout.cancelled', 'checkout.refunded']) {
    const event = { eventId: randomUUID(), type, externalId: randomUUID(), occurredAt: new Date(now).toISOString() };
    await sendConnectorEvent({ platformOrigin: 'https://eon-negotiation.vercel.app', installationId, secret, event, now,
      fetcher: async (url, opts) => {
        assert.equal(url, `https://eon-negotiation.vercel.app/api/webhooks/custom/${installationId}`);
        assert.equal(opts.redirect, 'error'); assert.deepEqual(JSON.parse(opts.body), { schemaVersion: '3', ...event });
        const h = opts.headers;
        assert.equal(h['X-Negotiation-Signature'], createHmac('sha256', secret)
          .update(`${h['X-Negotiation-Timestamp']}\n${h['X-Negotiation-Nonce']}\n${opts.body}`).digest('hex'));
        return Response.json({ ok: true });
      } });
  }
});
test('event rejection propagates to retry worker', async () => {
  await assert.rejects(sendConnectorEvent({ platformOrigin: 'https://eon-negotiation.vercel.app', installationId, secret,
    event: { type: 'checkout.paid', externalId: 'test' }, fetcher: async () => new Response('', { status: 503 }) }));
});
