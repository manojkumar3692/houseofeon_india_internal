// Node 20+. Source persistence and actual checkout payloads; no external calls.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function environment({ storage = new Map(), referrer = 'https://instagram.com/', search = '?utm_source=ig&utm_medium=paid&utm_campaign=campaign1', blocked = false } = {}) {
  const document = { referrer };
  const window = {
    location: { hostname: 'www.houseofeon.in', pathname: '/products/rank-perfume', search },
    sessionStorage: {
      getItem(key) { if (blocked) throw new Error('Blocked'); return storage.get(key) || null; },
      setItem(key, value) { if (blocked) throw new Error('Blocked'); storage.set(key, value); },
    },
  };
  const requests = []; const beacons = [];
  function load(file, imports = {}) {
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const sandbox = {
      exports: {}, window, document, URL, URLSearchParams, Blob, TextEncoder,
      crypto: { randomUUID: () => 'test-session' },
      fetch: async (url, options) => { requests.push({ url, ...options }); return {}; },
      navigator: { sendBeacon: (url, body) => { beacons.push({ url, body }); return true; } },
      require: (name) => { if (!(name in imports)) throw new Error(name); return imports[name]; },
    };
    vm.runInNewContext(code, sandbox);
    return sandbox.exports;
  }
  const attribution = load('lib/visitorAttribution.ts');
  const checkout = load('lib/checkoutSession.ts', { '@/lib/visitorAttribution': attribution });
  return { window, document, storage, attribution, checkout, requests, beacons };
}

test('real incoming tags survive product/cart/trial navigation and a document reload', () => {
  const h = environment(); h.attribution.captureVisitorAttribution();
  h.window.location.search = ''; h.window.location.pathname = '/trial-pack';
  const result = h.checkout.getUtmParams();
  assert.equal(result.utmSource, 'ig'); assert.equal(result.utmCampaign, 'campaign1');
  const reloaded = environment({ storage: h.storage, search: '', referrer: 'https://www.houseofeon.in/products/rank-perfume' });
  assert.equal(reloaded.checkout.getUtmParams().utmCampaign, 'campaign1');
});

test('untagged and social-referral visits are never fabricated as paid campaigns', () => {
  for (const referrer of ['', 'https://instagram.com/', 'https://www.google.com/']) {
    const h = environment({ search: '', referrer });
    const result = h.attribution.captureVisitorAttribution();
    assert.equal(result.utmCampaign, undefined); assert.equal(result.utmMedium, undefined);
    if (referrer) assert.equal(result.referrer, referrer);
  }
});

test('new tagged entry replaces the whole UTM group and clears obsolete saved values', () => {
  const h = environment(); h.attribution.captureVisitorAttribution();
  h.window.location.search = '?utm_source=newsletter';
  h.checkout.captureCheckoutSession(undefined, { phone: 'test-only' });
  const fields = JSON.parse(h.requests[0].body).fields;
  assert.equal(fields.utmSource, 'newsletter'); assert.equal(fields.utmMedium, ''); assert.equal(fields.utmCampaign, '');
});

test('a later external Google entry cannot inherit the previous paid campaign', () => {
  const h = environment(); h.attribution.captureVisitorAttribution();
  const later = environment({ storage: h.storage, search: '', referrer: 'https://www.google.com/search?q=private-query' });
  const result = later.attribution.captureVisitorAttribution();
  assert.equal(result.utmCampaign, undefined); assert.equal(result.referrer, 'https://www.google.com/search');
});

test('every field save and exit beacon carries the preserved source even without a page-view save', async () => {
  const h = environment(); h.attribution.captureVisitorAttribution();
  h.window.location.search = ''; h.window.location.pathname = '/trial-pack';
  h.document.referrer = 'https://www.houseofeon.in/products';
  h.checkout.captureCheckoutSession(undefined, { address: 'Synthetic test address', referrer: h.document.referrer });
  h.checkout.captureCheckoutSessionBeacon({ address: 'Latest synthetic address' });
  const regular = JSON.parse(h.requests[0].body);
  const beacon = JSON.parse(await h.beacons[0].body.text());
  for (const payload of [regular, beacon]) {
    assert.equal(payload.fields.utmCampaign, 'campaign1');
    assert.equal(payload.fields.referrer, 'https://instagram.com/');
    assert.equal(payload.sessionKey, 'test-session');
  }
  assert.equal(h.requests[0].keepalive, true);
  assert.equal(beacon.fields.address, 'Latest synthetic address');
});

test('blocked or malformed storage never breaks attribution or fabricates data', () => {
  const blocked = environment({ blocked: true }); blocked.attribution.captureVisitorAttribution();
  blocked.window.location.search = '';
  assert.equal(blocked.attribution.captureVisitorAttribution().utmCampaign, 'campaign1');
  for (const raw of ['invalid-json', 'null', '[]']) {
    const h = environment({ storage: new Map([['houseofeon_visitor_attribution', raw]]), search: '', referrer: '' });
    assert.equal(h.attribution.captureVisitorAttribution().utmCampaign, undefined);
  }
});

test('source values fit the existing API limits and omit referrer query/fragment', () => {
  const h = environment({ search: '?utm_campaign=' + 'x'.repeat(500), referrer: 'https://example.org/path?email=private@example.org#private' });
  const result = h.attribution.captureVisitorAttribution();
  assert.equal(result.utmCampaign.length, 200); assert.equal(result.referrer, 'https://example.org/path');
});
