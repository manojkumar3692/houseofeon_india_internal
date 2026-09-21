// Node 20+: node --test tests/meta-purchases.test.cjs
// Actual route/helper code, isolated database/provider mocks; no live events.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');

function load(file, dependencies = {}, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const sandbox = {
    exports: {}, URL, Request, Response, AbortSignal, Buffer, Date,
    console: { error() {}, warn() {} },
    process: { env: {} },
    require(name) {
      if (name in dependencies) return dependencies[name];
      if (['crypto', 'net', 'zod'].includes(name)) return require(name);
      throw new Error(`Unexpected dependency: ${name}`);
    }, ...globals,
  };
  vm.runInNewContext(code, sandbox, { filename: file });
  return sandbox.exports;
}

const ids = load('lib/metaPurchaseId.ts');
const order = (changes = {}) => ({
  id: 'order-db-1', order_number: 'HOE-TEST-1', order_type: 'trial_pack',
  created_at: '2026-09-21T10:00:00Z', payment_captured_at: '2026-09-21T10:05:00Z',
  payment_status: 'paid', amount_in_paise: 24900, customer_email: ' Buyer@Example.com ',
  customer_phone: '09876543210', trial_selected_scents: ['rank', 'zyrox', 'silent-gold'],
  razorpay_order_id: 'order_rzp_1', items: [], ...changes,
});
const env = {
  NODE_ENV: 'production', VERCEL_ENV: 'production', VERCEL: '1',
  RAZORPAY_KEY_ID: 'rzp_live_testfixture', NEXT_PUBLIC_META_PIXEL_ID: '123456789',
  META_CAPI_ENABLED: 'true', META_CAPI_ACCESS_TOKEN: 'mock-private-token',
  META_CAPI_START_AT: '2026-09-21T09:00:00Z', RAZORPAY_WEBHOOK_SECRET: 'mock-webhook-secret',
};
const origin = 'https://www.houseofeon.in';
const hash = (text) => crypto.createHash('sha256').update(text).digest('hex');

function database(orders = [order()]) {
  const ledger = new Map();
  const state = { ledger, orders, queries: [], failContext: false, failAck: false, failQueue: false };
  state.from = (table) => {
    const query = { table, operation: 'select', value: null, filters: [], limit: Infinity };
    state.queries.push(query);
    const builder = {
      insert(value) { query.operation = 'insert'; query.value = value; return builder; },
      upsert(value) { query.operation = 'upsert'; query.value = value; return builder; },
      update(value) { query.operation = 'update'; query.value = value; return builder; },
      select(value) { query.select = value; return builder; },
      eq(key, value) { query.filters.push([key, value]); return builder; },
      is(key, value) { query.filters.push([key, value]); return builder; },
      not(key, operator, value) { query.not = [key, value]; return builder; },
      gte(key, value) { query.gte = [key, value]; return builder; },
      order() { query.sorted = true; return builder; },
      limit(value) { query.limit = value; return builder; },
      abortSignal(value) { query.signal = value; return builder; },
      single() { query.single = true; return builder; },
      then(resolve, reject) { return Promise.resolve().then(execute).then(resolve, reject); },
    };
    function execute() {
      if (table === 'meta_purchase_events') {
        if (query.operation === 'upsert') {
          if (state.failContext && query.value.browser_context) return { error: { message: 'Unavailable' } };
          if (!ledger.has(query.value.order_number)) {
            ledger.set(query.value.order_number, { sent_at: null, last_attempt_at: null, browser_context: {}, ...query.value });
          }
          return { error: null };
        }
        let rows = [...ledger.values()];
        if (query.select?.includes('orders!inner')) {
          rows = rows.map((row) => ({ ...row, orders: orders.find((o) => o.order_number === row.order_number) }));
        }
        const field = (row, key) => key.startsWith('orders.') ? row.orders?.[key.slice(7)] : row[key];
        rows = rows.filter((row) => query.filters.every(([key, value]) => field(row, key) === value));
        if (query.not) rows = rows.filter((row) => field(row, query.not[0]) != null);
        if (query.gte) rows = rows.filter((row) => field(row, query.gte[0]) >= query.gte[1]);
        if (query.operation === 'update') {
          if (query.value.sent_at && state.failAck) return { error: { message: 'Unavailable' } };
          rows.forEach((row) => Object.assign(row, query.value));
          return { error: null };
        }
        if (query.sorted) rows.sort((a, b) => String(a.last_attempt_at || '').localeCompare(String(b.last_attempt_at || '')));
        rows = rows.slice(0, query.limit);
        return { data: query.single ? rows[0] : rows, error: null };
      }
      if (table === 'orders') {
        if (query.operation === 'insert') { orders.push({ ...query.value }); return { error: null }; }
        const rows = orders.filter((row) => query.filters.every(([key, value]) => row[key] === value));
        if (query.operation === 'update') rows.forEach((row) => Object.assign(row, query.value));
        return { data: query.single ? rows[0] : rows, error: null };
      }
      if (table === 'checkout_sessions') return { error: null };
      throw new Error(`Unexpected table ${table}`);
    }
    return builder;
  };
  state.rpc = async (name, { p_start_at }) => {
    assert.equal(name, 'enqueue_trial_meta_purchases');
    if (state.failQueue) return { error: { message: 'Unavailable' } };
    for (const o of orders) {
      if (o.order_type === 'trial_pack' && o.payment_status === 'paid' && o.payment_captured_at && Date.parse(o.created_at) >= Date.parse(p_start_at) && !ledger.has(o.order_number)) {
        ledger.set(o.order_number, { order_number: o.order_number, event_id: ids.metaPurchaseEventId(o.order_number), browser_context: {}, sent_at: null, last_attempt_at: null });
      }
    }
    return { error: null };
  };
  return state;
}

function setup(options = {}) {
  const db = options.db || database();
  const calls = [];
  const outcomes = options.outcomes || [];
  const config = { ...env, ...options.env };
  const api = load('lib/metaConversions.ts', {
    '@/lib/supabaseAdmin': { getSupabaseAdmin: () => db },
    '@/lib/metaPurchaseId': ids,
  }, {
    process: { env: config },
    fetch: async (url, init) => {
      calls.push({ url, ...init, payload: JSON.parse(init.body) });
      const outcome = outcomes.shift();
      if (outcome instanceof Error) throw outcome;
      return Response.json(outcome?.body || { events_received: 1 }, { status: outcome?.status || 200 });
    },
  });
  return { ...api, db, calls, config };
}

test('only enabled production, live, paid trial orders after rollout can send', async () => {
  for (const change of [{ META_CAPI_ENABLED: 'false' }, { NODE_ENV: 'development' }, { VERCEL_ENV: 'preview' }, { RAZORPAY_KEY_ID: 'rzp_test_example' }]) {
    const h = setup({ env: change });
    await h.sendTrialMetaPurchase(order(), origin);
    assert.equal(h.calls.length, 0); assert.equal(h.db.queries.length, 0);
  }
  for (const change of [{ order_type: 'regular' }, { payment_status: 'pending' }, { payment_captured_at: null }, { created_at: '2026-09-20T00:00:00Z' }]) {
    const h = setup(); await h.sendTrialMetaPurchase(order(change), origin); assert.equal(h.calls.length, 0);
  }
  const h = setup(); await h.sendTrialMetaPurchase(order(), 'https://preview.example'); assert.equal(h.calls.length, 0);
  await assert.rejects(setup({ env: { META_CAPI_START_AT: '' } }).sendTrialMetaPurchase(order(), origin), /rollout/);
  await assert.rejects(setup({ env: { META_CAPI_ACCESS_TOKEN: '' } }).sendTrialMetaPurchase(order(), origin), /configuration/);
});

test('server payload uses original capture, INR order value, hashes and browser context', async () => {
  const h = setup();
  await h.saveTrialMetaContext(order().order_number, new Request(`${origin}/api/trial-orders/create`, {
    headers: { cookie: '_fbp=fb.1.1770000000000.1234; _fbc=fb.1.1770000000000.real_click', 'user-agent': 'Customer Browser', 'x-vercel-forwarded-for': '203.0.113.1', 'x-forwarded-for': '203.0.113.2' },
  }));
  await h.sendTrialMetaPurchase(order(), `${origin}/api/webhooks/razorpay`);
  const call = h.calls[0]; const event = call.payload.data[0];
  assert.equal(call.headers.Authorization, 'Bearer mock-private-token');
  assert.equal(call.url, 'https://graph.facebook.com/v23.0/123456789/events');
  assert.ok(call.signal); assert.equal(call.cache, 'no-store');
  assert.equal(event.event_name, 'Purchase'); assert.equal(event.event_id, 'purchase:HOE-TEST-1');
  assert.equal(event.event_time, Date.parse(order().payment_captured_at) / 1000);
  assert.equal(event.custom_data.value, 249); assert.equal(event.custom_data.currency, 'INR');
  assert.deepEqual(event.custom_data.content_ids, order().trial_selected_scents);
  assert.equal(event.user_data.em[0], hash('buyer@example.com'));
  assert.equal(event.user_data.ph[0], hash('919876543210'));
  assert.equal(event.user_data.client_user_agent, 'Customer Browser');
  assert.equal(event.user_data.client_ip_address, '203.0.113.1');
  assert.equal(event.user_data.fbc, 'fb.1.1770000000000.real_click');
  assert.equal(event.action_source, 'website'); assert.equal(event.event_source_url, `${origin}/trial-pack`);
  assert.doesNotMatch(call.body, /Buyer@Example|09876543210|mock-private-token/);
  assert.ok(h.db.ledger.get(order().order_number).sent_at);
  await h.sendTrialMetaPurchase(order(), origin); assert.equal(h.calls.length, 1, 'Acknowledged webhook replay must not send again');
});

test('browser context is optional, never fabricated and failure cannot reject checkout', async () => {
  const h = setup(); h.db.failContext = true;
  await h.saveTrialMetaContext(order().order_number, new Request(`${origin}/api/trial-orders/create`));
  await h.sendTrialMetaPurchase(order(), origin);
  assert.equal(h.calls.length, 1); assert.equal(h.calls[0].payload.data[0].user_data.fbc, undefined);
  const fallback = setup();
  await fallback.saveTrialMetaContext(order().order_number, new Request(`${origin}/api/trial-orders/create`, {
    headers: { referer: `${origin}/trial-pack?fbclid=real_click`, 'user-agent': 'Customer Browser' },
  }));
  assert.match(fallback.db.ledger.get(order().order_number).browser_context.fbc, /^fb\.1\.\d{13}\.real_click$/);
  const foreign = setup();
  await foreign.saveTrialMetaContext(order().order_number, new Request(`${origin}/api/trial-orders/create`, {
    headers: { referer: 'https://other.example/?fbclid=not_our_click', cookie: '_fbc=invalid' },
  }));
  assert.equal(foreign.db.ledger.get(order().order_number).browser_context.fbc, undefined);
});

test('network failures, rejections and missing acknowledgement retry with identical event ID/time', async () => {
  for (const outcome of [new Error('Offline'), { status: 503, body: { error: { message: 'Secret provider detail' } } }, { body: { events_received: 0 } }, { body: { events_received: 1, error: {} } }]) {
    const h = setup({ outcomes: [outcome] });
    await assert.rejects(h.sendTrialMetaPurchase(order(), origin), /Meta purchase:/);
    const row = h.db.ledger.get(order().order_number);
    assert.equal(row.sent_at, null); assert.ok(row.last_error); assert.doesNotMatch(row.last_error, /Secret/);
    await h.sendTrialMetaPurchase(order(), origin);
    assert.equal(h.calls.length, 2);
    assert.equal(h.calls[0].payload.data[0].event_id, h.calls[1].payload.data[0].event_id);
    assert.equal(h.calls[0].payload.data[0].event_time, h.calls[1].payload.data[0].event_time);
    assert.ok(row.sent_at); assert.equal(row.last_error, null);
  }
});

test('lost acknowledgement storage and concurrent deliveries preserve deduplication ID', async () => {
  const h = setup(); h.db.failAck = true;
  await assert.rejects(h.sendTrialMetaPurchase(order(), origin), /acknowledgement_storage_failed/);
  h.db.failAck = false; await h.sendTrialMetaPurchase(order(), origin);
  assert.equal(h.calls[0].payload.data[0].event_id, h.calls[1].payload.data[0].event_id);
  const parallel = setup();
  await Promise.all([parallel.sendTrialMetaPurchase(order(), origin), parallel.sendTrialMetaPurchase(order(), origin)]);
  assert.equal(new Set(parallel.calls.map((call) => call.payload.data[0].event_id)).size, 1);
});

test('recovery finds missing background deliveries and excludes pending, failed, legacy and regular orders', async () => {
  const db = database([order(), order({ order_number: 'pending', payment_status: 'pending', payment_captured_at: null }), order({ order_number: 'regular', order_type: 'regular' }), order({ order_number: 'legacy', created_at: '2026-09-20T10:00:00Z' }), order({ order_number: 'failed', payment_status: 'failed' })]);
  const h = setup({ db });
  let result = await h.retryTrialMetaPurchases(origin);
  assert.equal(result.attempted, 1); assert.equal(result.failed, 0); assert.equal(h.calls.length, 1);
  result = await h.retryTrialMetaPurchases(origin); assert.equal(result.attempted, 0);
  const failed = setup({ outcomes: [new Error('Offline')] });
  assert.equal((await failed.retryTrialMetaPurchases(origin)).failed, 1);
  assert.equal((await failed.retryTrialMetaPurchases(origin)).failed, 0);
});

test('browser Purchase sends the same ID in Meta options; other analytics retain their contract', () => {
  const pixel = []; const ga = [];
  const analytics = load('lib/analytics.ts', {
    '@/lib/metaPurchaseId': ids,
    '@/lib/checkoutSession': {}, '@/lib/assistantSession': {},
    '@/lib/campaignAttribution': { getCampaignEventParams: () => ({}) },
  }, { process: { env: { NEXT_PUBLIC_RAZORPAY_KEY_ID: 'rzp_live_fixture' } }, window: { fbq: (...args) => pixel.push(args), gtag: (...args) => ga.push(args) } });
  analytics.trackPurchase({ orderId: order().order_number, value: 249, items: [{ item_id: 'rank', item_name: 'RANK', price: 249, quantity: 1 }] });
  assert.equal(pixel[0][1], 'Purchase'); assert.equal(pixel[0][3].eventID, ids.metaPurchaseEventId(order().order_number));
  assert.equal(ga[0][1], 'purchase'); assert.equal(ga[0][2].transaction_id, order().order_number);
  analytics.trackMetaEvent('Lead', { value: 249 }); assert.equal(pixel[1].length, 3);
});

test('signed webhook persists payment and acknowledges Meta failure; replay does not repeat emails', async () => {
  const db = database([order({ payment_status: 'pending', payment_captured_at: null })]);
  const after = []; let emails = 0; let shipments = 0; let metaCalls = 0;
  const route = load('app/api/webhooks/razorpay/route.ts', {
    'next/server': { after: (fn) => after.push(fn), NextResponse: { json: (body, opts) => Response.json(body, opts) } },
    '@/lib/supabaseAdmin': { getSupabaseAdmin: () => db },
    '@/lib/order': { buildCustomerAddress: () => 'Test address' },
    '@/lib/email': { sendOrderEmails: async () => { emails++; } },
    '@/lib/trialCredit': { markTrialCreditRedeemed: async () => {} },
    '@/lib/delhivery': { createDelhiveryShipmentForPaidOrder: async () => { shipments++; } },
    '@/lib/metaConversions': { sendTrialMetaPurchase: async (saved) => { assert.equal(saved.payment_status, 'paid'); assert.ok(saved.payment_captured_at); metaCalls++; throw new Error('Meta offline'); } },
  }, { process: { env } });
  const request = (event = 'payment.captured', signatureOverride) => {
    const body = JSON.stringify({ event, payload: { payment: { entity: { id: 'pay_fixture', order_id: 'order_rzp_1', amount: 24900 } } } });
    const signature = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(body).digest('hex');
    return new Request(`${origin}/api/webhooks/razorpay`, { method: 'POST', headers: { 'x-razorpay-signature': signatureOverride || signature }, body });
  };
  assert.equal((await route.POST(request('payment.captured', 'invalid'))).status, 400); assert.equal(after.length, 0);
  assert.equal((await route.POST(request())).status, 200);
  assert.equal(db.orders[0].payment_status, 'paid'); assert.equal(emails, 1); assert.equal(metaCalls, 0);
  while (after.length) await after.shift()();
  assert.equal(metaCalls, 1); assert.equal(shipments, 1);
  assert.equal((await route.POST(request())).status, 200);
  while (after.length) await after.shift()();
  assert.equal(emails, 1); assert.equal(metaCalls, 2);
  assert.equal((await route.POST(request('payment.failed'))).status, 200);
  assert.equal(db.orders[0].payment_status, 'paid'); assert.equal(after.length, 0);
});

test('retry endpoint requires a configured bearer secret and reports failures', async () => {
  let runs = 0;
  const make = (secret, failed = 0) => load('app/api/internal/meta-purchases/retry/route.ts', {
    'next/server': { NextResponse: { json: (body, opts) => Response.json(body, opts) } },
    '@/lib/metaConversions': { retryTrialMetaPurchases: async () => { runs++; return { enabled: true, attempted: 1, failed }; } },
  }, { process: { env: { CRON_SECRET: secret } } });
  const req = (authorization = '') => new Request(`${origin}/api/internal/meta-purchases/retry`, { headers: { authorization } });
  assert.equal((await make('').GET(req())).status, 503);
  assert.equal((await make('secret').GET(req())).status, 401);
  assert.equal(runs, 0);
  assert.equal((await make('secret').GET(req('Bearer secret'))).status, 200);
  assert.equal((await make('secret', 1).GET(req('Bearer secret'))).status, 503);
});

test('real trial create route still returns a payable order when tracking storage is unavailable', async () => {
  const db = database([]); db.failContext = true;
  const h = setup({ db }); let released = 0; let reserved = 0; const payments = [];
  const route = load('app/api/trial-orders/create/route.ts', {
    razorpay: class { orders = { create: async (data) => { payments.push(data); return { id: 'order_rzp_created' }; } }; },
    'next/server': { NextResponse: { json: (body, opts) => Response.json(body, opts) } },
    '@/lib/order': { createOrderNumber: () => 'HOE-NEW-TRIAL' },
    '@/lib/supabaseAdmin': { getSupabaseAdmin: () => db },
    '@/lib/trialPack': { TRIAL_PICK_COUNT: 3, TRIAL_PACK_PRICE_INR: 249, TRIAL_VIAL_SIZE_ML: 8, getTrialPackAmountInPaise: () => 24900, isTrialEligibleProductId: () => true },
    '@/lib/products': { getProductById: (id) => ({ id, name: id }) },
    '@/lib/inventoryServer': { reserveInventory: async () => { reserved++; return true; }, releaseInventoryReservation: async () => { released++; } },
    '@/lib/metaConversions': h,
  }, { process: { env: { ...env, RAZORPAY_KEY_SECRET: 'mock-secret' } } });
  const response = await route.POST(new Request(`${origin}/api/trial-orders/create`, {
    method: 'POST', body: JSON.stringify({
      customer: { name: 'Test Customer', phone: '9876543210', email: '', address: '123 Example Street', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
      selectedScents: ['rank', 'zyrox', 'silent-gold'],
    }),
  }));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.amount, 24900); assert.equal(result.currency, 'INR');
  assert.equal(result.razorpayOrderId, 'order_rzp_created'); assert.ok(result.inventoryReservationKey);
  assert.equal(payments.length, 1); assert.equal(reserved, 1); assert.equal(released, 0);
  assert.equal(db.orders.length, 1); assert.equal(db.orders[0].payment_status, 'pending');
  assert.equal(h.calls.length, 0, 'Order creation must never emit Purchase');
});

test('test-mode browser payments cannot emit Purchase', () => {
  const pixel = []; const ga = [];
  const analytics = load('lib/analytics.ts', {
    '@/lib/metaPurchaseId': ids, '@/lib/checkoutSession': {}, '@/lib/assistantSession': {},
    '@/lib/campaignAttribution': { getCampaignEventParams: () => ({}) },
  }, { process: { env: { NEXT_PUBLIC_RAZORPAY_KEY_ID: 'rzp_test_fixture' } }, window: { fbq: (...args) => pixel.push(args), gtag: (...args) => ga.push(args) } });
  analytics.trackPurchase({ orderId: 'TEST', value: 249, items: [] });
  assert.equal(pixel.length, 0); assert.equal(ga.length, 0);
});
