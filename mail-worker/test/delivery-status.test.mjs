import assert from 'node:assert/strict'
import test from 'node:test'
import {applyCloudflareDeliveryEvent} from '../src/lib/delivery-status.mjs'

const addresses = ['one@example.com', 'two@example.com']
const event = (kind, recipient, at, id = `${kind}-${recipient}`) => ({
  type: `cf.email.sending.message.${kind}`,
  source: {type: 'email.sending'},
  payload: {messageId: 'message-1', recipient, eventId: id, bounce: kind === 'bounced' ? {reason: '550 mailbox unavailable'} : undefined},
  metadata: {eventTimestamp: at}
})

test('delivery is confirmed only after every recipient has a delivered event', () => {
  const first = applyCloudflareDeliveryEvent(null, event('delivered', addresses[0], '2026-10-03T00:01:00Z'), addresses)
  assert.equal(first.status, 1)
  const second = applyCloudflareDeliveryEvent(first.message, event('delivered', addresses[1], '2026-10-03T00:02:00Z'), addresses)
  assert.equal(second.status, 2)
})

test('a bounce identifies the affected recipient and older events cannot clear it', () => {
  const bounced = applyCloudflareDeliveryEvent(null, event('bounced', addresses[1], '2026-10-03T00:02:00Z'), addresses)
  assert.equal(bounced.status, 3)
  assert.match(JSON.parse(bounced.message).message, /two@example.com: 550 mailbox unavailable/)
  assert.equal(applyCloudflareDeliveryEvent(bounced.message, event('deferred', addresses[1], '2026-10-03T00:01:00Z'), addresses), null)
  assert.equal(applyCloudflareDeliveryEvent(bounced.message, event('bounced', addresses[1], '2026-10-03T00:02:00Z'), addresses), null)
})

test('unrelated addresses and untrusted event sources are ignored', () => {
  assert.equal(applyCloudflareDeliveryEvent(null, event('delivered', 'stranger@example.com', '2026-10-03T00:01:00Z'), addresses), null)
  const spoofed = event('delivered', addresses[0], '2026-10-03T00:01:00Z')
  spoofed.source.type = 'other'
  assert.equal(applyCloudflareDeliveryEvent(null, spoofed, addresses), null)
})

test('provider failure is shown separately from a recipient bounce', () => {
  const failed = applyCloudflareDeliveryEvent(null, event('failed', addresses[0], '2026-10-03T00:01:00Z'), addresses)
  assert.equal(failed.status, 8)
  assert.equal(JSON.parse(failed.message).delivery.recipients[addresses[0]].status, 'failed')
})
