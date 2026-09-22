import assert from 'node:assert/strict';
const base = process.argv[2] || 'http://localhost:3000';
const canonical = 'https://www.houseofeon.in';
async function get(path) {
  const response = await fetch(`${base}${path}`);
  assert.equal(response.status, 200, `${path} HTTP status`);
  return response.text();
}
const robots = await get('/robots.txt');
for (const agent of ['OAI-SearchBot', 'PerplexityBot', 'Claude-SearchBot']) assert.ok(robots.includes(agent));
const sitemap = await get('/sitemap.xml');
assert.ok(!sitemap.includes('localhost'));
const paths = ['/fragrances-india', '/about', '/contact', '/shipping',
  '/guides/everyday-perfume-under-1500-india', '/guides/office-perfume-men-india-not-too-strong',
  '/guides/unisex-perfume-hot-humid-weather-india', '/guides/first-date-perfume-india',
  '/guides/buy-perfume-online-india-checklist', '/products/arctic-wave-perfume'];
for (const path of paths) {
  assert.ok(sitemap.includes(`${canonical}${path}`), `${path} in sitemap`);
  const html = await get(path);
  assert.ok(html.includes(`rel="canonical" href="${canonical}${path}"`), `${path} canonical`);
  assert.ok(html.includes('<h1'), `${path} rendered heading`);
  for (const match of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) JSON.parse(match[1]);
  if (path === '/fragrances-india') {
    for (const text of ['<table', 'Arctic Wave', '₹', 'Silent Gold']) assert.ok(html.includes(text), `SSR comparison: ${text}`);
  }
  if (path.startsWith('/products/')) {
    const schemas = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(m => JSON.parse(m[1]));
    const product = schemas.find(s => s['@type'] === 'Product');
    assert.equal(product.sku, 'arctic-wave');
    assert.equal(product.offers.priceCurrency, 'INR');
  }
}
const feed = await get('/product-feed.xml');
assert.ok(!feed.includes('g:sale_price'), 'No coupon-only sale price');
assert.equal((feed.match(/<item>/g) || []).length, 6);
for (const path of ['/cart', '/checkout', '/admin', '/track-order']) {
  const response = await fetch(`${base}${path}`);
  assert.ok(response.headers.get('x-robots-tag')?.includes('noindex'), `${path} noindex`);
}
for (const [oldPath, newPath] of [['/pages/about-us','/about'], ['/pages/contact-us','/contact'], ['/pages/shipping-policy','/shipping']]) {
  const response = await fetch(`${base}${oldPath}`, { redirect: 'manual' });
  assert.ok([301,308].includes(response.status));
  assert.ok(response.headers.get('location')?.endsWith(newPath));
}
console.log(`Discovery checks passed: ${paths.length} pages, schemas, feed, sitemap, robots, private routes and redirects.`);
