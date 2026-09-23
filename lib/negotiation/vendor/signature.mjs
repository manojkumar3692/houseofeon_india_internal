// Extracted from the platform's custom.js; excludes platform credential code.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
export const fingerprint = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function verifyConnectorSignature(secret, { timestamp, nonce, body, signature, now = Date.now() }) {
  if (!/^\d{13}$/.test(timestamp || '') || Math.abs(now - Number(timestamp)) > 30000 ||
      !/^[\x21-\x7e]{1,240}$/.test(nonce || '') || !/^[a-f0-9]{64}$/.test(signature || '')) return false;
  const expected = createHmac('sha256', secret).update(`${timestamp}\n${nonce}\n${body}`).digest();
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}
