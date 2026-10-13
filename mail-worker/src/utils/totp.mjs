const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function encodeSecret(bytes) {
 let bits = 0, value = 0, out = '';
 for (const b of bytes) { value = (value << 8) | b; bits += 8; while (bits >= 5) { bits -= 5; out += alphabet[(value >>> bits) & 31]; } }
 if (bits) out += alphabet[(value << (5 - bits)) & 31];
 return out;
}
export async function totp(secret, step, digits = 6) {
 let bits = 0, value = 0, bytes = [];
 for (const ch of secret) { const n = alphabet.indexOf(ch); if (n < 0) throw new Error('Invalid secret'); value = (value << 5) | n; bits += 5; if (bits >= 8) { bits -= 8; bytes.push((value >>> bits) & 255); } }
 const counter = new Uint8Array(8); new DataView(counter.buffer).setBigUint64(0, BigInt(step));
 const key = await crypto.subtle.importKey('raw', new Uint8Array(bytes), {name:'HMAC', hash:'SHA-1'}, false, ['sign']);
 const hash = new Uint8Array(await crypto.subtle.sign('HMAC', key, counter));
 const offset = hash[hash.length - 1] & 15;
 const number = new DataView(hash.buffer).getUint32(offset) & 0x7fffffff;
 return String(number % (10 ** digits)).padStart(digits, '0');
}
export async function verifyTotp(secret, code, now = Date.now()) {
 if (typeof code !== 'string' || !/^\d{6}$/.test(code)) return null;
 const step = Math.floor(now / 30000);
 for (const delta of [0, -1, 1]) if (await totp(secret, step + delta) === code) return step + delta;
 return null;
}
export async function seal(secret, keySecret, encrypted = false) {
 const key = await crypto.subtle.importKey('raw', await crypto.subtle.digest('SHA-256', new TextEncoder().encode('cloud-mail:totp:' + keySecret)), 'AES-GCM', false, ['encrypt','decrypt']);
 if (encrypted) {
  const bytes = Uint8Array.from(atob(secret), c => c.charCodeAt(0));
  return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM', iv:bytes.slice(0,12)}, key, bytes.slice(12)));
 }
 const iv = crypto.getRandomValues(new Uint8Array(12));
 const data = new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, new TextEncoder().encode(secret)));
 return btoa(String.fromCharCode(...iv, ...data));
}
