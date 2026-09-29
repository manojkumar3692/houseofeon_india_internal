const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { loader } = require('./negotiation-loader.cjs');

function metaModule() {
  return loader({
    '@/lib/supabaseAdmin': { getSupabaseAdmin: () => { throw new Error('database not expected'); } },
  }, { NEXT_PUBLIC_SITE_URL: 'https://www.houseofeon.in' })('lib/metaConversions.ts');
}

test('CAPI Purchase uses the order event ID, authoritative value, catalog products and hashed matching data', () => {
  const api = metaModule();
  const payload = api.buildMetaPurchasePayload({
    order_number: 'HOE-20260929-ABCDE',
    customer_name: 'Test Buyer',
    customer_phone: '98765 43210',
    customer_email: 'Buyer@Example.Test',
    customer_city: 'Bengaluru',
    customer_state: 'Karnataka',
    customer_pincode: '560001',
    amount_in_paise: 199800,
    items: [
      { productId: 'rank', name: 'Rank', price: 999, quantity: 1 },
      { productId: 'syra', name: 'Syra', price: 999, quantity: 1 },
    ],
  }, {
    visitor_id: 'visitor-123',
    fbp: 'fb.1.1700000000000.browser123',
    fbc: 'fb.1.1700000000000.click123',
    client_ip_address: '203.0.113.5',
    client_user_agent: 'Test Browser',
    landing_url: 'https://www.houseofeon.in/scent-fix?utm_source=meta',
  }, '2026-09-29T10:00:00.000Z');

  assert.equal(payload.event_name, 'Purchase');
  assert.equal(payload.event_id, 'HOE-20260929-ABCDE');
  assert.equal(payload.event_time, Date.parse('2026-09-29T10:00:00.000Z') / 1000);
  assert.equal(payload.action_source, 'website');
  assert.equal(payload.custom_data.currency, 'INR');
  assert.equal(payload.custom_data.value, 1998);
  assert.deepEqual(payload.custom_data.content_ids, ['rank', 'syra']);
  assert.equal(payload.custom_data.num_items, 2);
  assert.equal(payload.user_data.fbp, 'fb.1.1700000000000.browser123');
  assert.equal(payload.user_data.fbc, 'fb.1.1700000000000.click123');
  assert.equal(payload.user_data.client_ip_address, '203.0.113.5');
  assert.equal(payload.user_data.client_user_agent, 'Test Browser');
  assert.equal(payload.user_data.em[0], crypto.createHash('sha256').update('buyer@example.test').digest('hex'));
  assert.equal(payload.user_data.ph[0], crypto.createHash('sha256').update('919876543210').digest('hex'));
  assert.equal(payload.user_data.external_id[0], crypto.createHash('sha256').update('visitor-123').digest('hex'));
  assert.doesNotMatch(JSON.stringify(payload.user_data), /Buyer@Example|98765 43210|visitor-123/);
});

test('trial pack CAPI content IDs match the selected catalog scents', () => {
  const api = metaModule();
  const payload = api.buildMetaPurchasePayload({
    order_number: 'HOE-20260929-TRIAL', order_type: 'trial_pack', amount_in_paise: 24900,
    trial_selected_scents: ['rank', 'syra', 'zyrox'],
    items: [{ productId: 'trial-pack', quantity: 1, price: 249 }],
  }, null, '2026-09-29T10:00:00.000Z');
  assert.deepEqual(payload.custom_data.content_ids, ['rank', 'syra', 'zyrox']);
  assert.equal(payload.custom_data.contents.length, 3);
  assert.equal(payload.custom_data.value, 249);
});

test('browser Pixel Purchase carries the same stable order event ID used by CAPI', () => {
  const calls = [];
  const storage = new Map();
  const api = loader({
    '@/lib/checkoutSession': { hashEmailForMeta: async () => '', hashPhoneForMeta: async () => '' },
    '@/lib/assistantSession': {
      getConciergeSessionId: () => 'session', captureLandingContext: () => ({}), getConciergeVariant: () => ({ group: 'control' }),
    },
    '@/lib/campaignAttribution': { getCampaignEventParams: () => ({}) },
  }, { NEXT_PUBLIC_RAZORPAY_KEY_ID: 'rzp_live_test' }, {
    window: {
      fbq: (...args) => calls.push(args),
      sessionStorage: { getItem: (key) => storage.get(key) || null, setItem: (key, val) => storage.set(key, val) },
    },
  })('lib/analytics.ts');

  api.trackPurchase({
    orderId: 'HOE-20260929-ABCDE', value: 999,
    items: [{ item_id: 'rank', item_name: 'Rank', price: 999, quantity: 1 }],
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'track');
  assert.equal(calls[0][1], 'Purchase');
  assert.equal(calls[0][3].eventID, 'HOE-20260929-ABCDE');
  assert.match(storage.get('houseofeon_meta_event_ids'), /HOE-20260929-ABCDE/);
});

test('catalog funnel events use product IDs while non-product landing views do not emit ViewContent', () => {
  const calls = [];
  const storage = new Map();
  const api = loader({
    '@/lib/checkoutSession': { hashEmailForMeta: async () => '', hashPhoneForMeta: async () => '' },
    '@/lib/assistantSession': {
      getConciergeSessionId: () => 'session', captureLandingContext: () => ({}), getConciergeVariant: () => ({ group: 'control' }),
    },
    '@/lib/campaignAttribution': { getCampaignEventParams: () => ({}) },
  }, {}, {
    window: {
      fbq: (...args) => calls.push(args),
      sessionStorage: { getItem: (key) => storage.get(key) || null, setItem: (key, val) => storage.set(key, val) },
    },
  })('lib/analytics.ts');

  api.trackBeginCheckout({
    value: 1998,
    items: [
      { item_id: 'rank', item_name: 'Rank', price: 999, quantity: 1 },
      { item_id: 'syra', item_name: 'Syra', price: 999, quantity: 1 },
    ],
  });
  assert.equal(calls[0][1], 'InitiateCheckout');
  assert.deepEqual(calls[0][2].content_ids, ['rank', 'syra']);

  api.trackScentFixViewContent();
  assert.equal(calls[1][0], 'trackCustom');
  assert.equal(calls[1][1], 'ScentFixViewed');
  assert.equal(calls[1][2].event_name, undefined);
  assert.notEqual(calls[1][1], 'ViewContent');

  api.trackTrialBuilderStarted();
  assert.equal(calls[2][0], 'trackCustom');
  assert.equal(calls[2][1], 'TrialBuilderStarted');
});

test('temporary Meta failure is scheduled for retry and the same event ID is later delivered once', async () => {
  const updates = [];
  const requests = [];
  let claim = 0;
  const order = {
    order_number: 'HOE-RETRY', payment_status: 'paid', payment_captured_at: '2026-09-29T10:00:00.000Z',
    customer_name: 'Retry Buyer', customer_phone: '9876543210', amount_in_paise: 99900,
    items: [{ productId: 'rank', price: 999, quantity: 1 }],
  };
  const session = { visitor_id: 'visitor-retry', fbp: 'fb.1.1.browser', fbc: 'fb.1.1.click' };
  const db = {
    async rpc() {
      claim++;
      return { data: [{ id: 'outbox-1', event_id: 'HOE-RETRY', event_name: 'Purchase', order_number: 'HOE-RETRY', event_time: order.payment_captured_at, attempts: claim, lease_token: `lease-${claim}` }], error: null };
    },
    from(table) {
      let change;
      const builder = {
        select() { return this; }, eq() { return this; }, order() { return this; }, limit() { return this; },
        update(value) { change = value; return this; },
        async single() { return { data: order, error: null }; },
        async maybeSingle() { return { data: session, error: null }; },
        then(resolve) { if (table === 'meta_conversion_outbox' && change) updates.push(change); return Promise.resolve(resolve({ error: null })); },
      };
      return builder;
    },
  };
  const api = loader({
    '@/lib/supabaseAdmin': { getSupabaseAdmin: () => db },
  }, {
    META_CONVERSIONS_ACCESS_TOKEN: 'test-token', META_PIXEL_ID: '123456', META_GRAPH_API_VERSION: 'v25.0',
    NEXT_PUBLIC_SITE_URL: 'https://www.houseofeon.in',
  }, {
    fetch: async (url, options) => {
      requests.push({ url, options, body: JSON.parse(options.body) });
      return requests.length === 1
        ? Response.json({ error: { message: 'Temporary outage', code: 2 } }, { status: 503 })
        : Response.json({ events_received: 1, fbtrace_id: 'trace' });
    },
  })('lib/metaConversions.ts');

  let result = await api.deliverPendingMetaConversions(1);
  assert.equal(result.delivered, 0); assert.equal(result.failed, 1);
  assert.equal(updates[0].status, 'pending');
  assert.ok(updates[0].next_attempt_at);
  assert.equal(requests[0].body.data[0].event_id, 'HOE-RETRY');

  result = await api.deliverPendingMetaConversions(1);
  assert.equal(result.delivered, 1); assert.equal(result.failed, 0);
  assert.equal(updates[1].status, 'delivered');
  assert.equal(updates[1].delivered_at !== null, true);
  assert.equal(requests[1].body.data[0].event_id, 'HOE-RETRY');
});

test('checkout capture stores server-observed IP and user agent with browser attribution', async () => {
  let saved;
  const db = { from() { return { async upsert(row) { saved = row; return { error: null }; } }; } };
  const route = loader({
    'next/server': { NextResponse: Response },
    '@/lib/supabaseAdmin': { getSupabaseAdmin: () => db },
  })('app/api/checkout-session/route.ts');
  const response = await route.POST(new Request('https://www.houseofeon.in/api/checkout-session', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.7, 10.0.0.1', 'user-agent': 'Meta Test Browser' },
    body: JSON.stringify({ sessionKey: 'session-1', fields: { visitorId: 'visitor-1', fbc: 'fb.1.1.click' } }),
  }));
  assert.equal(response.status, 200);
  assert.equal(saved.client_ip_address, '203.0.113.7');
  assert.equal(saved.client_user_agent, 'Meta Test Browser');
  assert.equal(saved.visitor_id, 'visitor-1');
  assert.equal(saved.fbc, 'fb.1.1.click');
});
