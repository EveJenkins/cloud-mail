import test from 'node:test'
import assert from 'node:assert/strict'
import {replyRecipients} from '../src/utils/reply-target.js'

test('received mail replies to its sender', () => {
  assert.deepEqual(replyRecipients({type: 0, sendEmail: 'customer@example.com'}), ['customer@example.com'])
})

test('sent mail follows up with its original recipients, never its sender', () => {
  assert.deepEqual(replyRecipients({
    type: 1,
    sendEmail: 'info@parts-hd.com',
    recipient: JSON.stringify([{address: 'buyer@example.com'}, {address: 'buyer@example.com'}]),
  }), ['buyer@example.com'])
})

test('sent mail without a valid recipient has no reply target', () => {
  assert.deepEqual(replyRecipients({type: 1, sendEmail: 'info@parts-hd.com', recipient: 'invalid'}), [])
})
