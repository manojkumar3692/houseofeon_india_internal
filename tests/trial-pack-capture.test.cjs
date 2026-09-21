// Exercises actual page handlers/lifecycle with isolated hooks and telemetry.
// No form data is written to a real database. Node 20+.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function mount() {
  const slots = []; let cursor = 0; let effects = []; let tree;
  const captures = []; const beacons = []; const leads = [];
  const timers = new Map(); let timerId = 0;
  const listeners = new Map();
  const events = (prefix) => ({
    addEventListener: (name, callback) => listeners.set(`${prefix}:${name}`, callback),
    removeEventListener: (name) => listeners.delete(`${prefix}:${name}`),
  });
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = initial;
      return [slots[i], (value) => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }];
    },
    useRef(initial) { const i = cursor++; return slots[i] ||= { current: initial }; },
    useMemo(fn) { return fn(); },
    useEffect(fn, deps) {
      const i = cursor++;
      const previous = slots[i];
      if (!previous || deps.some((value, j) => value !== previous.deps[j])) {
        effects.push(() => { previous?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; });
      }
    },
  };
  const products = ['rank', 'zyrox', 'silent-gold'].map((id) => ({ id, name: id, notes: [], reviews: [] }));
  const getAvailability = () => ({ available: true });
  const document = { ...events('document'), visibilityState: 'visible', referrer: '' };
  const window = {
    ...events('window'), Razorpay() {},
    setTimeout(fn) { const id = ++timerId; timers.set(id, fn); return id; },
    clearTimeout: (id) => timers.delete(id),
    sessionStorage: { getItem: () => JSON.stringify(products.map((p) => p.id)), setItem() {}, removeItem() {} },
  };
  const dependencies = {
    react,
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    'next/image': () => null, 'next/script': () => null, 'next/navigation': { useRouter: () => ({ push() {} }) },
    '@/lib/trialPack': { getTrialEligibleProducts: () => products, TRIAL_PICK_COUNT: 3, TRIAL_PACK_PRICE_INR: 249, TRIAL_VIAL_SIZE_ML: 8 },
    '@/lib/money': { formatINR: String },
    '@/lib/analytics': new Proxy({}, { get: (_, name) => name === 'trackCheckoutLead' ? (data) => leads.push(data) : () => {} }),
    '@/lib/checkoutSession': {
      captureCheckoutSession: (stage, fields) => captures.push({ stage, fields }),
      captureCheckoutSessionBeacon: (fields) => beacons.push(fields),
      getCheckoutSessionKey: () => 'test-session', getDeviceType: () => 'desktop', getUtmParams: () => ({}),
    },
    '@/components/InventoryContext': { useInventory: () => ({ loaded: true, getAvailability, refresh: async () => [] }) },
  };
  const sandbox = { exports: {}, window, document, console, process: { env: {} }, require: (name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected import ${name}`);
    return dependencies[name];
  } };
  const code = ts.transpileModule(fs.readFileSync('app/trial-pack/page.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, sandbox);
  function render() {
    cursor = 0; effects = []; tree = sandbox.exports.default();
    effects.forEach((effect) => effect());
  }
  function field(label) {
    function find(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) return node.map(find).find(Boolean);
      if (node.props?.['aria-label'] === label) return node;
      return find(node.props?.children);
    }
    const node = find(tree); assert.ok(node, `Field ${label} is rendered`); return node.props;
  }
  render(); render(); render(); captures.length = 0;
  return {
    captures, beacons, leads, field, render,
    change(label, value, rerender = true) { field(label).onChange({ target: { value } }); if (rerender) render(); },
    blur(label) { const props = field(label); props.onBlur({ target: { value: props.value } }); },
    pause() { const pending = [...timers.values()]; timers.clear(); pending.forEach((fn) => fn()); },
    hide() { document.visibilityState = 'hidden'; listeners.get('document:visibilitychange')(); },
    leave() { listeners.get('window:pagehide')(); },
    unmount() { slots.forEach((slot) => slot?.cleanup?.()); },
    listeners,
  };
}

test('all trial delivery fields save on blur and pauses before submission', () => {
  const page = mount();
  const fields = [ ['Full name', 'name', 'Test Customer'], ['Email for confirmation (optional)', 'email', 'test@example.com'], ['Full delivery address', 'address', '123 Example Road'], ['City', 'city', 'Mumbai'], ['State', 'state', 'Maharashtra'], ['Pincode', 'pincode', '400001'] ];
  for (const [label, key, value] of fields) {
    page.change(label, value); page.blur(label);
    assert.equal(page.captures.at(-1).fields[key], value);
  }
  page.change('Full delivery address', '123 Example Road, Apt 4'); page.pause();
  assert.equal(page.captures.at(-1).fields.address, '123 Example Road, Apt 4');
  assert.equal(page.captures.at(-1).fields.name, 'Test Customer');
  assert.equal(page.captures.at(-1).fields.lastActiveField, 'address');
  assert.ok(page.captures.every((entry) => entry.stage !== 'submitted'));
});

test('exit snapshot includes the last keystroke even before rerender or blur', () => {
  const page = mount(); page.leave(); assert.equal(page.beacons.length, 0);
  page.change('Full delivery address', 'Latest character!', false); page.leave();
  assert.equal(page.beacons.at(-1).address, 'Latest character!');
  page.change('Email for confirmation (optional)', 'partial@', false); page.hide();
  assert.equal(page.beacons.at(-1).email, 'partial@');
  page.unmount(); assert.equal(page.beacons.at(-1).lastActiveField, 'email');
  assert.equal(page.listeners.size, 0);
});

test('corrected phone numbers persist while the marketing Lead fires once', () => {
  const page = mount();
  page.change('Phone', '9876543210'); page.blur('Phone');
  page.change('Phone', '9876543211'); page.blur('Phone');
  assert.equal(page.captures.at(-1).fields.phone, '9876543211');
  assert.equal(page.captures.at(-1).stage, 'phone_captured');
  assert.equal(page.leads.length, 1);
  page.change('Phone', '987'); page.blur('Phone');
  assert.equal(page.captures.at(-1).fields.phone, '987');
  assert.equal(page.leads.length, 1);
});

test('clearing a field replaces its old value in saves and exit snapshots', () => {
  const page = mount();
  page.change('Email for confirmation (optional)', 'test@example.com'); page.blur('Email for confirmation (optional)');
  page.change('Email for confirmation (optional)', ''); page.blur('Email for confirmation (optional)');
  assert.equal(page.captures.at(-1).fields.email, '');
  page.leave(); assert.equal(page.beacons.at(-1).email, '');
});
