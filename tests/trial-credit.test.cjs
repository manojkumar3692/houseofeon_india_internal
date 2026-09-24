const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loader } = require('./negotiation-loader.cjs');

const code = 'HOE-20260923-ABCDE';
const phone = '9876543210';
function backend(changes = {}) {
  const trial = {
    order_number: code, customer_phone: phone, payment_status: 'paid',
    order_type: 'trial_pack', trial_credit_redeemed_at: null,
    created_at: new Date().toISOString(), ...changes,
  };
  const charged = [], saved = [];
  const db = { from() {
    const filters = {};
    return {
      select() { return this; },
      eq(key, value) { filters[key] = value; return this; },
      async single() {
        return { data: Object.entries(filters).every(([k, v]) => trial[k] === v) ? trial : null, error: null };
      },
      async insert(order) { saved.push(order); return { error: null }; },
    };
  } };
  class Razorpay { orders = { create: async (input) => { charged.push(input); return { id: 'order_test' }; } }; }
  const load = loader({
    'next/server': { NextResponse: Response }, razorpay: Razorpay,
    '@/lib/supabaseAdmin': { getSupabaseAdmin: () => db },
    '@/lib/inventoryServer': { reserveInventory: async () => true, releaseInventoryReservation: async () => {} },
  }, { RAZORPAY_KEY_ID: 'test', RAZORPAY_KEY_SECRET: 'test' });
  return {
    validate: load('app/api/coupons/validate/route.ts').POST,
    create: load('app/api/orders/create/route.ts').POST,
    charged, saved,
  };
}
function request(body) {
  return new Request('https://store.test/api/test', { method: 'POST', body: JSON.stringify(body) });
}

function cartHarness() {
  const api = backend();
  const requests = [];
  const storage = new Map([['houseofeon_cart', JSON.stringify([{ productId: 'rank', quantity: 1 }])]]);
  const slots = [], effects = [], pending = [];
  let cursor = 0, dirty = true, value;
  const React = {
    createContext: () => ({ Provider: 'provider' }), useContext() {},
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = initial;
      return [slots[i], (v) => {
        const next = typeof v === 'function' ? v(slots[i]) : v;
        if (next !== slots[i]) { slots[i] = next; dirty = true; }
      }];
    },
    useMemo: (fn) => fn(),
    useEffect(fn, deps) {
      const i = cursor++;
      if (!effects[i] || deps.some((v, j) => v !== effects[i].deps[j])) {
        pending.push(() => { effects[i]?.cleanup?.(); effects[i] = { deps, cleanup: fn() }; });
      }
    },
  };
  const Cart = loader({ react: React }, {}, {
    localStorage: { getItem: (k) => storage.get(k) || null, setItem: (k, v) => storage.set(k, v), removeItem: (k) => storage.delete(k) },
    fetch: async (_, options) => {
      const body = JSON.parse(options.body); requests.push(body);
      return api.validate(request(body));
    },
  })('components/CartContext.tsx').CartProvider;
  async function settle() {
    for (let i = 0; i < 30; i++) {
      if (dirty) {
        dirty = false; cursor = 0; value = Cart({ children: null }).props.value;
        while (pending.length) pending.shift()();
      }
      await new Promise((resolve) => setImmediate(resolve));
      if (!dirty && !pending.length) return value;
    }
    throw new Error('Cart did not settle');
  }
  return { settle, requests, storage };
}

test('Trial Pack credit survives cart revalidation and replaces manually entered EON20', async () => {
  const h = cartHarness(); let cart = await h.settle();
  await cart.applyCoupon('EON20'); cart = await h.settle();
  assert.equal(cart.couponCode, 'EON20');
  assert.equal((await cart.applyCoupon(code, '+91 98765 43210')).ok, true);
  cart = await h.settle();
  assert.equal(cart.couponCode, code);
  assert.equal(cart.couponDiscount, 249);
  assert.equal(cart.finalTotal, 750);
  const checks = h.requests.filter((r) => r.code === code);
  assert.ok(checks.length >= 2, 'initial validation and cart revalidation both ran');
  assert.ok(checks.every((r) => r.phone === '+91 98765 43210'));
  assert.ok([...h.storage.values()].every((v) => !v.includes('98765')), 'phone stays out of localStorage');
});

test('credit retains its phone when switching single-bottle products', async () => {
  const h = cartHarness(); let cart = await h.settle();
  await cart.applyCoupon(code, phone); cart = await h.settle();
  cart.removeItem('rank'); cart.addItem('arctic-wave'); cart = await h.settle();
  assert.equal(cart.couponCode, code); assert.equal(cart.finalTotal, 750);
  assert.equal(h.requests.at(-1).phone, phone);
});

test('removing credit clears its phone without automatically applying a coupon', async () => {
  const h = cartHarness(); let cart = await h.settle();
  await cart.applyCoupon(code, phone); cart = await h.settle();
  cart.removeCoupon(); cart = await h.settle();
  assert.equal(cart.couponPhone, ''); assert.equal(cart.couponCode, '');
  assert.equal(cart.finalTotal, cart.total);
});

test('switching to a bundle removes the credit instead of stacking discounts', async () => {
  const h = cartHarness(); let cart = await h.settle();
  await cart.applyCoupon(code, phone); cart = await h.settle();
  cart.updateQuantity('rank', 2); cart = await h.settle();
  assert.equal(cart.couponCode, ''); assert.equal(cart.couponDiscount, 0);
  assert.equal(cart.finalTotal, 1598);
});

test('server accepts matching formatted phone and normalized order number', async () => {
  const response = await backend().validate(request({ code: ` ${code.toLowerCase()} `, phone: '+91 98765 43210', subtotal: 999 }));
  assert.equal(response.status, 200); assert.equal((await response.json()).discount, 249);
});

test('server rejects missing/mismatched phone, unpaid, used, expired and non-trial orders', async () => {
  for (const [changes, input] of [
    [{}, { phone: undefined }], [{}, { phone: '9876543211' }],
    [{ payment_status: 'pending' }, {}], [{ trial_credit_redeemed_at: new Date().toISOString() }, {}],
    [{ created_at: new Date(Date.now() - 31 * 86400000).toISOString() }, {}],
    [{ order_type: 'standard' }, {}], [{}, { hasBundleLine: true }],
  ]) {
    const response = await backend(changes).validate(request({ code, phone, subtotal: 999, ...input }));
    assert.equal(response.status, 400); assert.equal((await response.json()).valid, false);
  }
});

test('order creation deducts exactly 249 rupees and independently rejects a changed phone', async () => {
  const api = backend();
  const customer = { name: 'Test Buyer', phone, email: 'buyer@example.test', address: '123 Test Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' };
  const body = { customer, items: [{ productId: 'arctic-wave', quantity: 1 }], couponCode: code };
  const response = await api.create(request(body));
  assert.equal(response.status, 200); assert.equal((await response.json()).amount, 75000);
  assert.equal(api.charged[0].amount, 75000); assert.equal(api.saved[0].coupon_discount_in_paise, 24900);
  const rejected = await api.create(request({ ...body, customer: { ...customer, phone: '9876543211' } }));
  assert.equal(rejected.status, 400); assert.equal(api.charged.length, 1);
});

test('a rejected credit attempt preserves the existing coupon and total', async () => {
  const h = cartHarness(); let cart = await h.settle();
  await cart.applyCoupon('EON20'); cart = await h.settle();
  const result = await cart.applyCoupon(code, '9876543211');
  assert.equal(result.ok, false); assert.match(result.message, /doesn’t match/);
  cart = await h.settle();
  assert.equal(cart.couponCode, 'EON20'); assert.equal(cart.finalTotal, 799);
});

test('lookup failures explain the Trial Pack issue rather than saying invalid coupon', async () => {
  const scenarios = [
    [{}, { code: 'HOE-20260923-XXXXX' }, /couldn’t find/],
    [{ payment_status: 'pending' }, {}, /Payment.*isn’t confirmed/],
    [{ trial_credit_redeemed_at: new Date().toISOString() }, {}, /already been used/],
    [{ created_at: new Date(Date.now() - 31 * 86400000).toISOString() }, {}, /expired.*30 days/],
  ];
  for (const [changes, input, message] of scenarios) {
    const response = await backend(changes).validate(request({ code, phone, subtotal: 999, ...input }));
    assert.equal(response.status, 400); assert.match((await response.json()).error, message);
  }
});
