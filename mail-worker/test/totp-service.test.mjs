import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import { totp } from '../src/utils/totp.mjs';
let source = await readFile(new URL('../src/service/totp-service.js', import.meta.url),'utf8');
source = source.replace("import BizError from '../error/biz-error';", 'class BizError extends Error {}').replace("'../utils/totp.mjs'", JSON.stringify(new URL('../src/utils/totp.mjs',import.meta.url).href));
const {default:service} = await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
function context() {
 const db = new DatabaseSync(':memory:');
 const adapter = {prepare(sql) {
  let args = [];
  return {bind(...values) { args = values; return this; },async first() {return db.prepare(sql).get(...args) ?? null;},async run() {return db.prepare(sql).run(...args);} };
 }, async batch(statements) {for (const statement of statements) await statement.run();}};
 return {env:{db:adapter,jwt_secret:'test-secret'},db};
}
test('setup stays disabled until proof; expired setups cannot enable', async () => {
 const c = context(); await service.init(c); await service.init(c);
 const setup = await service.setup(c,{userId:1,email:'test@example.com'});
 assert.equal((await service.row(c,1)).enabled,0);
 assert.match(setup.uri,/otpauth:\/\/totp\//);
 c.db.exec('UPDATE user_totp SET expires=0');
 await assert.rejects(service.verify(c,1,await totp(setup.secret,Math.floor(Date.now()/30000)),true),/expired/);
 c.db.close();
});
test('enabled accounts prevent replacement, reuse, expired and over-limit challenges', async () => {
 const c = context(); await service.init(c);
 const setup = await service.setup(c,{userId:1,email:'test@example.com'});
 const code = await totp(setup.secret,Math.floor(Date.now()/30000));
 await service.verify(c,1,code,true);
 assert.equal((await service.row(c,1)).enabled,1);
 await assert.rejects(service.setup(c,{userId:1,email:'test@example.com'}),/already enabled/);
 const challenge = await service.challenge(c,1);
 await assert.rejects(service.consume(c,challenge.challenge,code),/already used/);
 c.db.exec('UPDATE user_totp SET last_step=-1');
 assert.equal(await service.consume(c,challenge.challenge,code),1);
 await assert.rejects(service.consume(c,challenge.challenge,code),/expired/);
 const expired = await service.challenge(c,1); c.db.prepare('UPDATE totp_challenge SET expires=0 WHERE id=?').run(expired.challenge);
 await assert.rejects(service.consume(c,expired.challenge,code),/expired/);
 const limited = await service.challenge(c,1); c.db.prepare('UPDATE totp_challenge SET attempts=5 WHERE id=?').run(limited.challenge);
 await assert.rejects(service.consume(c,limited.challenge,code),/expired/);
 await assert.rejects(service.consume(c,'user:1',code),/expired/);
 c.db.close();
});
test('five failed user attempts block further verification', async () => {
 const c = context(); await service.init(c); await service.setup(c,{userId:2,email:'test@example.com'});
 for (let n=0;n<5;n++) await assert.rejects(service.verify(c,2,'bad',true),/Invalid/);
 await assert.rejects(service.verify(c,2,'bad',true),/Too many/);
 c.db.close();
});

test('upgraded databases initialize on first read and preserve existing bindings', async () => {
 const c = context();
 assert.equal(await service.row(c,1),null);
 const setup = await service.setup(c,{userId:1,email:'test@example.com'});
 await service.verify(c,1,await totp(setup.secret,Math.floor(Date.now()/30000)),true);
 const before = await service.row(c,1);
 await service.init(c);
 assert.deepEqual(await service.row(c,1),before);
 c.db.close();
});
test('challenge, verify and consume handle uninitialized databases', async () => {
 const c = context();
 assert.equal((await service.challenge(c,1)).requiresTotp,true);
 c.db.close();
 const verifyContext = context();
 await assert.rejects(service.verify(verifyContext,1,'123456'),/unavailable/);
 verifyContext.db.close();
 const consumeContext = context();
 await assert.rejects(service.consume(consumeContext,'missing','123456'),/expired/);
 consumeContext.db.close();
});
test('concurrent reads initialize once and failed initialization retries', async () => {
 const c = context();
 const batch = c.env.db.batch;
 let calls = 0;
 c.env.db.batch = async statements => { calls++; if (calls === 1) throw new Error('D1 unavailable'); return batch(statements); };
 await assert.rejects(service.row(c,1),/D1 unavailable/);
 assert.deepEqual(await Promise.all([service.row(c,1),service.row(c,2),service.row(c,3)]),[null,null,null]);
 assert.equal(calls,2);
 c.db.close();
});
