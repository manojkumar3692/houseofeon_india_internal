const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { z } = require('zod');
const crypto = require('node:crypto');
const code = ts.transpileModule(fs.readFileSync('app/api/waitlist/route.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const valid = { email: 'Buyer@example.com', product: 'riva', website: '', consent: true };
function handler(outcome = { data: { id: 'mock-email' }, error: null }, configured = true) {
  const sent = [];
  const sandbox = { exports: {}, process: { env: configured ? { RESEND_API_KEY: 'test-only', EMAIL_FROM: 'sender@example.com' } : {} }, URL, console: { error() {} }, require(name) {
    if (name === 'zod') return { z };
    if (name === 'node:crypto') return crypto;
    if (name === 'next/server') return { NextResponse: { json: (body, opts) => Response.json(body, opts) } };
    if (name === 'resend') return { Resend: class { emails = { send: async (...args) => { sent.push(args); if (outcome instanceof Error) throw outcome; return outcome; } } } };
    throw new Error(`Unexpected module ${name}`);
  } };
  vm.runInNewContext(code, sandbox);
  return { post: sandbox.exports.POST, sent };
}
function request(data = valid, origin = 'https://www.houseofeon.in') {
  return new Request('https://www.houseofeon.in/api/waitlist', { method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: typeof data === 'string' ? data : JSON.stringify(data) });
}
test('RIVA signup goes only to orders with reply-to and explicit waitlist consent', async () => {
  const h = handler(); assert.equal((await h.post(request())).status, 200);
  const [email, options] = h.sent[0];
  assert.equal(email.to, 'orders@houseofeon.in'); assert.equal(email.replyTo, 'buyer@example.com');
  assert.match(email.text, /Customer agreed/); assert.match(email.text, /No order, payment/);
  assert.equal(email.html, undefined);
  assert.match(options.idempotencyKey, /^riva-waitlist\/[a-f0-9]{64}$/);
});
test('retries and normalized duplicate emails use identical provider payload and key', async () => {
  const h = handler(); await h.post(request()); await h.post(request({...valid, email:' buyer@example.com '}));
  assert.deepEqual(h.sent[0], h.sent[1]);
});
test('invalid emails, missing consent, other products and bots cannot send', async () => {
  for (const change of [{email:'bad'}, {email:'a@example.com\r\nBcc: x@example.com'}, {consent:false}, {product:'syra'}, {website:'spam'}, {email:'x'.repeat(255)+'@example.com'}]) {
    const h = handler(); assert.equal((await h.post(request({...valid,...change}))).status,400); assert.equal(h.sent.length,0);
  }
});
test('rejects malformed, oversized and foreign-origin requests', async () => {
  const h = handler(); assert.equal((await h.post(request('{'))).status,400);
  assert.equal((await h.post(request('x'.repeat(2049)))).status,413);
  assert.equal((await h.post(request(valid,'https://other.example'))).status,403); assert.equal(h.sent.length,0);
});
test('missing configuration cannot report success', async () => {
  const h = handler(undefined,false); assert.equal((await h.post(request())).status,503); assert.equal(h.sent.length,0);
});
test('rejection, missing acknowledgement and network failures return retryable errors', async () => {
  for (const outcome of [{data:null,error:{message:'Rejected'}},{data:null,error:null},new Error('Offline')]) {
    const response = await handler(outcome).post(request()); assert.equal(response.status,502); assert.match((await response.json()).error,/retry/);
  }
});
