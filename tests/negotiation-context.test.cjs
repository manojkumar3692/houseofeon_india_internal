const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');
const source = ts.transpileModule(fs.readFileSync('lib/negotiation/merchant.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const validUntil = new Date(Date.now() + 120000).toISOString();
const cart = { currency: 'INR', lines: [{ productId: 'test', variantId: 'test:50ml', quantity: 1 }],
  promotionCodes: [], paymentMethod: 'prepaid', destination: { country: 'IN', postalCode: '600001' } };
function merchant(change = {}) {
  const policy = { floor_minor: 70000, prepaid_fee_minor: 100, tax_basis: 'inclusive', valid_until: validUntil, ...change.policy };
  const rate = { id: 'rate', merchant_cost_minor: 6000, customer_charge_minor: 0, valid_until: validUntil, ...change.rate };
  const inventory = { product_key: 'test', size: '50ml', available_stock: 3, available: true, storefront_enabled: true, ...change.inventory };
  const db = { rpc: async () => ({ data: [inventory], error: change.stockError }), from: name => {
    const query = { select: () => query, eq: () => query,
      single: async () => ({ data: name === 'negotiation_product_policy' ? policy : rate, error: change.policyError }) };
    return query;
  } };
  const sandbox = { exports: {}, process: { env: { NEGOTIATION_STAGING_PRODUCT_ID: 'test',
    INVENTORY_ENFORCEMENT_ENABLED: 'true', RAZORPAY_KEY_ID: 'rzp_test_fixture', RAZORPAY_KEY_SECRET: 'fixture', ...change.env } },
    require(name) {
      if (name === 'server-only') return {};
      if (name === 'node:crypto') return crypto;
      if (name === '@/lib/supabaseAdmin') return { getSupabaseAdmin: () => db };
      if (name === '@/lib/products') return { products: [{ id: 'test', size: '50ml', name: 'Test', price: change.price || 1249 }] };
      if (name === '@/lib/pricing') return { getUnitPrice: (base, quantity) => quantity >= 2 ? 799 : base };
      throw Error(name);
    } };
  vm.runInNewContext(source, sandbox);
  return sandbox.exports;
}
test('exact cart returns stock, approved economics and bounded freshness', async () => {
  const value = await merchant().getContext(cart);
  assert.equal(value.line.unitPriceMinor, 124900); assert.equal(value.line.availableToSell, 3);
  assert.equal(value.line.approvedFloorMinor, 70000); assert.equal(value.shipping.merchantCostMinor, 6000);
  assert.equal(value.sales, null); assert.equal(value.checkoutSupported, false);
  assert.ok(Date.parse(value.expiresAt) <= Date.now() + 60000);
});
test('quantity pricing and changes in price/stock produce different context revisions', async () => {
  const original = await merchant().getContext(cart);
  const bundle = await merchant().getContext({ ...cart, lines: [{ ...cart.lines[0], quantity: 2 }] });
  assert.equal(bundle.line.unitPriceMinor, 79900);
  assert.notEqual(bundle.revision, original.revision);
  assert.notEqual((await merchant({ price: 1300 }).getContext(cart)).revision, original.revision);
  assert.notEqual((await merchant({ inventory: { available_stock: 2 } }).getContext(cart)).revision, original.revision);
});
test('missing, expired or invalid economic facts and unavailable inventory fail closed', async () => {
  for (const change of [{ policy: { floor_minor: null } }, { policy: { floor_minor: 130000 } },
    { policy: { prepaid_fee_minor: null } }, { policy: { tax_basis: null } },
    { rate: { merchant_cost_minor: null } }, { rate: { valid_until: 'invalid' } },
    { rate: { valid_until: '2020-01-01T00:00:00Z' } }, { policy: { valid_until: '2020-01-01T00:00:00Z' } },
    { inventory: { available_stock: 0 } }, { inventory: { available_stock: null } },
    { inventory: { available: false } }, { stockError: true }, { policyError: true },
    { env: { INVENTORY_ENFORCEMENT_ENABLED: 'false' } }, { env: { RAZORPAY_KEY_ID: 'rzp_live_fixture' } }]) {
    await assert.rejects(merchant(change).getContext(cart), { code: 'UNSUPPORTED' });
  }
});
test('unsupported destinations, promotions and payment methods cannot negotiate', async () => {
  for (const change of [{ destination: null }, { destination: { country: 'AE', postalCode: '000000' } },
    { currency: 'USD' }, { promotionCodes: ['EON20'] }, { paymentMethod: 'cod' }, { paymentMethod: 'partial_cod' },
    { lines: [{ ...cart.lines[0], variantId: 'test:8ml' }] }]) {
    await assert.rejects(merchant().getContext({ ...cart, ...change }), { code: 'UNSUPPORTED' });
  }
});
