import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { encodeSecret, totp, verifyTotp, seal } from '../src/utils/totp.mjs';
globalThis.crypto ??= webcrypto;
const secret = encodeSecret(new TextEncoder().encode('12345678901234567890'));
test('RFC 6238 SHA-1 test vectors including timestamps beyond 2038', async () => {
 for (const [time, expected] of [[59,'94287082'],[1111111109,'07081804'],[1111111111,'14050471'],[1234567890,'89005924'],[2000000000,'69279037'],[20000000000,'65353130']]) {
  assert.equal(await totp(secret,Math.floor(time/30),8),expected);
 }
});
test('six digits, adjacent time windows and rejection', async () => {
 const now = 1234567890000, step = Math.floor(now/30000);
 for (const delta of [-1,0,1]) assert.equal(await verifyTotp(secret,await totp(secret,step+delta),now),step+delta);
 assert.equal(await verifyTotp(secret,await totp(secret,step-2),now),null);
 for (const code of ['',123456,'12345','1234567','abcdef',' 123456']) assert.equal(await verifyTotp(secret,code,now),null);
});
test('encrypted storage round trip and tamper detection', async () => {
 const encrypted = await seal(secret,'test-key');
 assert.notEqual(encrypted,secret);
 assert.equal(await seal(encrypted,'test-key',true),secret);
 assert.notEqual(await seal(secret,'test-key'),encrypted);
 await assert.rejects(seal(encrypted,'wrong-key',true));
 const bytes = Uint8Array.from(atob(encrypted),c=>c.charCodeAt(0)); bytes[20] ^= 1;
 await assert.rejects(seal(btoa(String.fromCharCode(...bytes)),'test-key',true));
});
