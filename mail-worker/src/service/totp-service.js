import BizError from '../error/biz-error';
import { encodeSecret, verifyTotp, seal } from '../utils/totp.mjs';

const service = {
 async init(c) {
  await c.env.db.batch([
   c.env.db.prepare(`CREATE TABLE IF NOT EXISTS user_totp (user_id INTEGER PRIMARY KEY, secret TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 0, expires INTEGER NOT NULL, last_step INTEGER NOT NULL DEFAULT -1)`),
   c.env.db.prepare(`CREATE TABLE IF NOT EXISTS totp_challenge (id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0)`)
  ]);
 },
 async row(c, id) { return c.env.db.prepare('SELECT * FROM user_totp WHERE user_id = ?').bind(id).first(); },
 async challenge(c, id) {
  const challenge = crypto.randomUUID();
  await c.env.db.prepare('DELETE FROM totp_challenge WHERE expires < ?').bind(Date.now()).run();
  await c.env.db.prepare('INSERT INTO totp_challenge (id,user_id,expires) VALUES (?,?,?)').bind(challenge,id,Date.now()+300000).run();
  return { requiresTotp:true, challenge };
 },
 async setup(c, user) {
  if ((await this.row(c,user.userId))?.enabled) throw new BizError('Google Authenticator is already enabled');
  const secret = encodeSecret(crypto.getRandomValues(new Uint8Array(20)));
  const encrypted = await seal(secret,c.env.jwt_secret);
  await c.env.db.prepare(`INSERT INTO user_totp (user_id,secret,expires) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET secret=excluded.secret, expires=excluded.expires WHERE enabled=0`).bind(user.userId,encrypted,Date.now()+600000).run();
  return {secret, uri:`otpauth://totp/${encodeURIComponent('Cloud Mail:' + user.email)}?secret=${secret}&issuer=Cloud%20Mail&algorithm=SHA1&digits=6&period=30`};
 },
 async verify(c, id, code, enabling = false) {
  // Reserve an attempt in D1 so concurrent requests cannot bypass the limit.
  const limitId = 'user:' + id;
  await c.env.db.prepare('DELETE FROM totp_challenge WHERE id=? AND expires < ?').bind(limitId,Date.now()).run();
  await c.env.db.prepare('INSERT OR IGNORE INTO totp_challenge (id,user_id,expires) VALUES (?,?,?)').bind(limitId,id,Date.now()+300000).run();
  const attempt = await c.env.db.prepare('UPDATE totp_challenge SET attempts=attempts+1 WHERE id=? AND attempts<5 RETURNING id').bind(limitId).first();
  if (!attempt) throw new BizError('Too many attempts. Try again in 5 minutes.');
  const row = await this.row(c,id);
  if (!row || (enabling ? row.enabled || row.expires < Date.now() : !row.enabled)) throw new BizError('Authenticator setup expired or unavailable');
  const step = await verifyTotp(await seal(row.secret,c.env.jwt_secret,true),code);
  if (step === null || step <= row.last_step) throw new BizError('Invalid or already used authenticator code');
  const updated = await c.env.db.prepare('UPDATE user_totp SET last_step=?, enabled=1 WHERE user_id=? AND secret=? AND last_step < ? RETURNING user_id').bind(step,id,row.secret,step).first();
  if (!updated) throw new BizError('Authenticator code already used');
  await c.env.db.prepare('DELETE FROM totp_challenge WHERE id=?').bind(limitId).run();
 },
 async consume(c, challenge, code) {
  if (typeof challenge !== 'string') throw new BizError('Invalid login challenge');
  const row = await c.env.db.prepare(`UPDATE totp_challenge SET attempts=attempts+1 WHERE id=? AND expires>? AND attempts<5 AND id NOT LIKE 'user:%' RETURNING *`).bind(challenge,Date.now()).first();
  if (!row) throw new BizError('Login challenge expired. Sign in again.');
  await this.verify(c,row.user_id,code);
  const consumed = await c.env.db.prepare('DELETE FROM totp_challenge WHERE id=? RETURNING id').bind(challenge).first();
  if (!consumed) throw new BizError('Login challenge already used');
  return row.user_id;
 }
};
export default service;
