const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, imports = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const sandbox = { URL, exports: {}, require: name => {
    if (!(name in imports)) throw new Error(name);
    return imports[name];
  } };
  vm.runInNewContext(code, sandbox);
  return sandbox.exports;
}
const { getAIReferralSource } = load('lib/aiReferral.ts');
test('classify real AI referrals and known source tags without guessing Google/direct traffic', () => {
  assert.equal(getAIReferralSource('https://chatgpt.com/c/123'), 'chatgpt');
  assert.equal(getAIReferralSource('https://www.perplexity.ai/search/test'), 'perplexity');
  assert.equal(getAIReferralSource('', 'chatgpt.com'), 'chatgpt');
  for (const input of ['', 'https://google.com/search?q=perfume', 'https://chatgpt.com.evil.test', 'invalid']) {
    assert.equal(getAIReferralSource(input), undefined);
  }
});
test('JSON-LD cannot break out of the script element', () => {
  const { jsonLd } = load('lib/seo.ts');
  const input = { name: '</script><script>alert(1)</script>' };
  assert.ok(!jsonLd(input).includes('<'));
  assert.deepEqual(JSON.parse(jsonLd(input)), input);
});
function inventory(enforced, response) {
  return load('lib/catalogAvailability.ts', {
    '@/lib/inventoryServer': { isInventoryEnforcementEnabled: () => enforced },
    '@/lib/products': { products: [{id: 'a'}, {id: 'b'}] },
    '@/lib/supabaseAdmin': { getSupabaseAdmin: () => ({ rpc: async () => {
      if (response instanceof Error) throw response;
      return response;
    } }) },
  }).getCatalogAvailability;
}
test('inventory uses 50ml status and keeps missing or failed data unknown', async () => {
  const result = await inventory(true, { data: [{product_key:'a',size:'50ml',available:false},{product_key:'a',size:'8ml',available:true}], error:null })();
  assert.equal(result.a, false);
  assert.equal(result.b, undefined);
  assert.equal(await inventory(true, {data:null,error:{message:'unavailable'}})(), null);
  assert.equal(await inventory(true, new Error('offline'))(), null);
  const fallback = await inventory(false, new Error('must not call'))();
  assert.equal(fallback.a, true);
});
test('new guide slugs and product recommendations resolve', () => {
  const { discoveryGuides } = load('lib/discoveryGuides.ts');
  const { products } = load('lib/products.ts');
  const { guides } = load('lib/guides.ts', { '@/lib/discoveryGuides': { discoveryGuides } });
  assert.equal(new Set(guides.map(g => g.slug)).size, guides.length);
  for (const guide of discoveryGuides) for (const id of guide.relatedProductIds) assert.ok(products.some(p => p.id === id), `${guide.slug}: ${id}`);
});

test('public single-bottle sale uses checkout math and falls back when inactive', () => {
  const coupons = load('lib/coupons.ts');
  const { getCatalogOffer } = load('lib/catalogOffer.ts', { '@/lib/coupons': coupons });
  assert.equal(getCatalogOffer(1249).price, 999);
  assert.equal(getCatalogOffer(1249).basePrice, 1249);
  coupons.coupons.find(c => c.code === 'EON20').active = false;
  assert.equal(getCatalogOffer(1249).price, 1249);
  assert.equal(getCatalogOffer(1249).onSale, false);
});
