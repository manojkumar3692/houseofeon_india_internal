// Run with Node 20+: node --test tests/corporate-gifting.test.cjs
// Isolated provider mock: no real emails or production credentials are used.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { z } = require('zod');
const code = ts.transpileModule(fs.readFileSync('app/api/corporate-gifting/route.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const valid = { requestId: 'bb7d463d-c89e-4f54-a7cf-301b52c85c77', name: 'Test Buyer', company: 'Example Company', email: 'buyer@example.com', phone: '+91 9999999999', quantity: '50', budget: 'Under ₹500', occasion: 'Employee appreciation', delivery: 'Chennai 600001', date: '2026-12-01', branding: 'Explore the options', message: '<sample request>', website: '', consent: true };
function handler(outcome = { data: { id: 'mock-email' }, error: null }, configured = true) {
  const sent = [];
  const sandbox = { exports: {}, process: { env: configured ? { RESEND_API_KEY: 'test-only', EMAIL_FROM: 'House of Eon <sender@example.com>' } : {} }, URL, console: { error() {} }, require(name) {
    if (name === 'zod') return { z };
    if (name === 'next/server') return { NextResponse: { json: (body, opts) => Response.json(body, opts) } };
    if (name === 'resend') return { Resend: class { emails = { send: async (...args) => { sent.push(args); if (outcome instanceof Error) throw outcome; return outcome; } } } };
    throw new Error(`Unexpected module ${name}`);
  } };
  vm.runInNewContext(code, sandbox);
  return { post: sandbox.exports.POST, sent };
}
function request(data = valid, origin = 'https://www.houseofeon.in') {
  return new Request('https://www.houseofeon.in/api/corporate-gifting', { method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: typeof data === 'string' ? data : JSON.stringify(data) });
}
test('valid enquiry goes only to orders, with reply-to, full brief and idempotency key', async () => {
  const h = handler(); const response = await h.post(request()); assert.equal(response.status, 200);
  assert.equal(h.sent.length, 1); const [email, opts] = h.sent[0];
  assert.equal(email.to, 'orders@houseofeon.in'); assert.equal(email.replyTo, valid.email);
  assert.match(email.text, /Quantity: 50 gift sets/); assert.match(email.text, /Chennai 600001/);
  assert.match(email.text, /<sample request>/); assert.equal(email.html, undefined);
  assert.equal(opts.idempotencyKey, `corporate-gifting/${valid.requestId}`);
});
test('rejects invalid and spam submissions before sending', async () => {
  for (const change of [{email:'bad'}, {quantity:0}, {quantity:1.5}, {consent:false}, {website:'spam.example'}, {company:'a\r\nb'}, {date:'2026-02-31'}, {message:'x'.repeat(2001)}, {phone:'-------'}, {requestId:'invalid'}]) {
    const h = handler(); assert.equal((await h.post(request({...valid,...change}))).status, 400, JSON.stringify(change)); assert.equal(h.sent.length, 0);
  }
});
test('rejects malformed, oversized and cross-origin requests', async () => {
  const h = handler(); assert.equal((await h.post(request('{'))).status, 400);
  assert.equal((await h.post(request('x'.repeat(12001)))).status, 413);
  assert.equal((await h.post(request(valid,'https://other.example'))).status, 403);
  assert.equal(h.sent.length, 0);
});
test('missing email configuration cannot produce false success', async () => {
  const h = handler(undefined, false); assert.equal((await h.post(request())).status, 503); assert.equal(h.sent.length, 0);
});
test('provider rejection, empty acknowledgement and network failures return recoverable errors', async () => {
  for (const outcome of [{data:null,error:{message:'Rejected'}},{data:null,error:null},new Error('Offline')]) {
    const response = await handler(outcome).post(request()); assert.equal(response.status, 502); assert.match((await response.json()).error,/retry/);
  }
});

test('personalised gift card and chosen scents reach the enquiry email', async () => {
  const h = handler();
  const response = await h.post(request({...valid, giftMessage: 'Thank you for a wonderful year.', fragrances: ['Zyrox','RANK','Silent Gold']}));
  assert.equal(response.status, 200);
  assert.match(h.sent[0][0].text, /Gift card message: Thank you for a wonderful year\./);
  assert.match(h.sent[0][0].text, /Requested fragrances: Zyrox, RANK, Silent Gold/);
});
test('personalisation rejects unsupported, repeated or incomplete scent choices and long cards', async () => {
  for (const change of [{fragrances:['SYRA','RANK','Zyrox']},{fragrances:['RANK','RANK','Zyrox']},{fragrances:['Zyrox']},{giftMessage:'x'.repeat(141)}]) {
    const h = handler(); assert.equal((await h.post(request({...valid,...change}))).status,400); assert.equal(h.sent.length,0);
  }
});
