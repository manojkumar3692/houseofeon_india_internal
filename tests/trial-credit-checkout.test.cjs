const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loader } = require('./negotiation-loader.cjs');

const code = 'HOE-20260923-ABCDE';
function checkoutHarness(outcome = { ok: true, message: "Credit applied" }) {
  const slots = []; let cursor = 0, tree, release;
  const calls = [];
  const cart = {
    lines: [{ productId: 'rank', quantity: 1 }], total: 1249, finalTotal: 1249,
    hasBundleLine: false, couponCode: '', couponPhone: '', couponDiscount: 0,
    clearCart() {},
    removeCoupon() { cart.couponCode = ''; cart.couponPhone = ''; cart.couponDiscount = 0; },
    async applyCoupon(value, phone) {
      calls.push({ value, phone });
      await new Promise((resolve) => { release = resolve; });
      if (outcome instanceof Error) throw outcome;
      if (outcome.ok) { cart.couponCode = value; cart.couponPhone = phone; cart.couponDiscount = 249; cart.finalTotal = 1000; }
      return outcome;
    },
  };
  const react = {
    useState(initial) {
      const i = cursor++; if (!(i in slots)) slots[i] = initial;
      return [slots[i], (v) => { slots[i] = typeof v === 'function' ? v(slots[i]) : v; }];
    },
    useRef(initial) { const i = cursor++; return slots[i] ||= { current: initial }; },
    useMemo: (fn) => fn(), useEffect() {},
  };
  const noops = new Proxy({}, { get: () => () => {} });
  const Page = loader({
    react, 'next/navigation': { useRouter: () => ({ push() {} }) }, 'next/script': () => null,
    '@/components/CartContext': { useCart: () => cart }, '@/components/TrialPackRescue': () => null,
    '@/components/InventoryContext': { useInventory: () => ({ loaded: true, getAvailability: () => ({ available: true, maxQuantity: 20 }), refresh: async () => [] }) },
    '@/lib/analytics': noops, '@/lib/clarity': noops, '@/lib/checkoutSession': noops,
    '@/lib/assistantSession': noops,
  })('app/checkout/page.tsx').default;
  function render() { cursor = 0; tree = Page(); }
  function find(predicate, node = tree) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.map((child) => find(predicate, child)).find(Boolean);
    return predicate(node) ? node : find(predicate, node.props?.children ?? null);
  }
  function change(predicate, value) { find(predicate).props.onChange({ target: { value } }); render(); }
  render();
  return {
    cart, calls, render, find,
    phone: (value) => change((n) => n.props?.placeholder === 'Phone', value),
    code: (value) => change((n) => n.props?.id === 'credit-code', value),
    creditPhone: (value) => change((n) => n.props?.id === 'credit-phone', value),
    apply: () => find((n) => n.type === 'form' && 'aria-busy' in n.props).props.onSubmit({ preventDefault() {} }),
    release: () => release(),
  };
}

test('checkout requires a complete phone before requesting a credit', async () => {
  const h = checkoutHarness(); h.code(code); h.phone('987'); await h.apply(); h.render();
  assert.equal(h.calls.length, 0);
  assert.match(h.find((n) => n.props?.id === 'credit-phone-error').props.children, /10-digit mobile number/);
});

test('changing verified phone removes the credit, while formatting changes preserve it', async () => {
  const h = checkoutHarness(); h.code(code); h.phone('9876543210');
  const pending = h.apply(); h.release(); await pending; h.render();
  assert.equal(h.cart.couponCode, code);
  h.phone('+91 98765 43210'); assert.equal(h.cart.couponCode, code);
  h.phone('9876543211'); assert.equal(h.cart.couponCode, '');
  assert.equal(h.find((n) => n.props?.id === 'credit-code').props.value, code);
  assert.match(h.find((n) => n.props?.role === 'alert').props.children, /phone number changed/);
});

test('phone changes during validation cannot leave a stale success or discount', async () => {
  const h = checkoutHarness(); h.code(code); h.phone('9876543210');
  const pending = h.apply(); h.phone('9876543211'); h.release(); await pending; h.render();
  assert.equal(h.cart.couponCode, ''); assert.equal(h.cart.couponDiscount, 0);
  assert.match(h.find((n) => n.props?.role === 'alert').props.children, /phone number changed/);
});

test('payment submission waits for pending credit validation', async () => {
  const h = checkoutHarness(); h.code(code); h.phone('9876543210');
  const pending = h.apply(); h.render();
  await h.find((n) => n.type === 'form').props.onSubmit({ preventDefault() {} }); h.render();
  assert.ok(h.find((n) => n.props?.children === 'Please wait while we check your Trial Pack credit.'));
  h.release(); await pending;
});

test('empty submission shows both field errors and leaves Apply enabled for feedback', async () => {
  const h = checkoutHarness();
  assert.equal(h.find((n) => n.props?.children === 'Apply ₹249 credit').props.disabled, false);
  await h.apply(); h.render();
  assert.equal(h.calls.length, 0);
  assert.match(h.find((n) => n.props?.id === 'credit-code-error').props.children, /Enter your Trial Pack order number/);
  assert.ok(h.find((n) => n.props?.id === 'credit-phone-error'));
  assert.equal(h.find((n) => n.props?.id === 'credit-phone').props['aria-invalid'], true);
});

test('credit phone is visible beside the order number and syncs both ways with delivery', () => {
  const h = checkoutHarness();
  assert.ok(h.find((n) => n.type === 'label' && n.props?.htmlFor === 'credit-phone'));
  h.creditPhone('9876543210');
  assert.equal(h.find((n) => n.props?.id === 'delivery-phone').props.value, '9876543210');
  h.phone('+91 98765 43210');
  assert.equal(h.find((n) => n.props?.id === 'credit-phone').props.value, '+91 98765 43210');
});

test('malformed order numbers explain where to find the correct value', async () => {
  const h = checkoutHarness(); h.code('EON20'); h.creditPhone('9876543210');
  await h.apply(); h.render();
  assert.equal(h.calls.length, 0);
  assert.match(h.find((n) => n.props?.id === 'credit-code-error').props.children, /confirmation/);
});

test('server rejection is a visible alert and keeps the entered details for retry', async () => {
  const message = 'This phone number doesn’t match your Trial Pack order.';
  const h = checkoutHarness({ ok: false, message }); h.code(code); h.creditPhone('9876543210');
  const pending = h.apply(); h.render();
  assert.ok(h.find((n) => n.props?.role === 'status'));
  h.release(); await pending; h.render();
  assert.equal(h.find((n) => n.props?.role === 'alert').props.children, message);
  assert.equal(h.find((n) => n.props?.id === 'credit-code').props.value, code);
  assert.equal(h.find((n) => n.props?.children === 'Apply ₹249 credit').props.disabled, false);
});

test('unexpected network errors release the loading state and show a retry message', async () => {
  const h = checkoutHarness(new Error('Offline')); h.code(code); h.creditPhone('9876543210');
  const pending = h.apply(); h.release(); await pending; h.render();
  assert.match(h.find((n) => n.props?.role === 'alert').props.children, /try again/);
  assert.equal(h.find((n) => n.props?.children === 'Apply ₹249 credit').props.disabled, false);
});

test('success confirms the amount and new total, editing the code removes stale success', async () => {
  const h = checkoutHarness(); h.code(code); h.creditPhone('9876543210');
  const pending = h.apply(); h.release(); await pending; h.render();
  assert.ok(h.find((n) => n.props?.children === '₹249 Trial Pack credit applied'));
  assert.ok(h.find((n) => n.type === 'span' && JSON.stringify(n.props.children).includes('1,000')));
  assert.equal(h.find((n) => n.props?.children === '₹249 credit applied').props.disabled, true);
  h.code('HOE-'); assert.equal(h.cart.couponDiscount, 0);
  assert.equal(h.find((n) => n.props?.className === 'checkout-credit-success'), undefined);
});

test('bundle shoppers see why credit cannot be applied instead of a disappearing section', () => {
  const h = checkoutHarness(); h.cart.hasBundleLine = true; h.render();
  assert.ok(h.find((n) => n.props?.id === 'credit-heading'));
  assert.match(h.find((n) => n.props?.className === 'checkout-credit-sublabel').props.children, /bundle pricing/);
  assert.equal(h.find((n) => n.props?.id === 'credit-code'), undefined);
});
