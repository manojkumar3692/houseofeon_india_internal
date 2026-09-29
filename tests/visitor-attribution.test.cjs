// Node 20+. Source persistence and actual checkout payloads; no external calls.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function environment({ storage = new Map(), cookieJar = new Map(), referrer = 'https://instagram.com/', search = '?utm_source=ig&utm_medium=paid&utm_campaign=campaign1', blocked = false } = {}) {
  const document = { referrer };
  Object.defineProperty(document, 'cookie', {
    get() { return [...cookieJar].map(([key, val]) => `${key}=${val}`).join('; '); },
    set(raw) { const [pair] = raw.split(';'); const split = pair.indexOf('='); cookieJar.set(pair.slice(0, split), pair.slice(split + 1)); },
  });
  const location = { hostname: 'www.houseofeon.in', pathname: '/products/rank-perfume', search, protocol: 'https:' };
  Object.defineProperty(location, 'href', { get() { return `https://${location.hostname}${location.pathname}${location.search}`; } });
  const window = {
    location,
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
  return { window, document, storage, cookieJar, attribution, checkout, requests, beacons };
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

test('Meta click identifiers and a stable first-party visitor reach every checkout save', () => {
  const cookies = new Map([['_fbp', 'fb.1.1700000000000.browser123']]);
  const h = environment({ cookieJar: cookies, search: '?utm_source=meta&utm_campaign=launch&fbclid=click-123&private=omit-me' });
  const result = h.attribution.captureVisitorAttribution();
  assert.equal(result.visitorId, 'test-session');
  assert.equal(result.fbp, 'fb.1.1700000000000.browser123');
  assert.match(result.fbc, /^fb\.1\.\d+\.click-123$/);
  assert.match(result.landingUrl, /fbclid=click-123/);
  assert.doesNotMatch(result.landingUrl, /private/);

  h.checkout.captureCheckoutSession('page_viewed');
  const fields = JSON.parse(h.requests[0].body).fields;
  assert.equal(fields.visitorId, 'test-session');
  assert.equal(fields.fbp, result.fbp);
  assert.equal(fields.fbc, result.fbc);
  assert.equal(fields.fbclid, 'click-123');

  const reload = environment({ storage: h.storage, cookieJar: h.cookieJar, search: '', referrer: 'https://www.houseofeon.in/cart' });
  assert.equal(reload.attribution.captureVisitorAttribution().visitorId, 'test-session');
});
