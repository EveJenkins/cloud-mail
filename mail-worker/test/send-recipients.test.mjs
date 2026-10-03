import assert from 'node:assert/strict'
import test from 'node:test'
import {normalizeSendRecipients, recipientMetadata} from '../src/lib/send-recipients.mjs'

test('To, Cc and Bcc all receive a message while only the sender stores Bcc', () => {
  const recipients = normalizeSendRecipients({
    receiveEmail: [' to@example.com '],
    ccEmail: ['cc@example.com'],
    bccEmail: ['bcc@example.com']
  })
  assert.deepEqual(recipients.all, ['to@example.com', 'cc@example.com', 'bcc@example.com'])
  const sent = recipientMetadata(recipients, true)
  const received = recipientMetadata(recipients, false)
  assert.deepEqual(JSON.parse(sent.bcc), [{address: 'bcc@example.com', name: ''}])
  assert.deepEqual(JSON.parse(received.cc), [{address: 'cc@example.com', name: ''}])
  assert.deepEqual(JSON.parse(received.bcc), [])
})

test('recipient lists reject duplicates, invalid addresses and more than 50 people', () => {
  assert.throws(() => normalizeSendRecipients({receiveEmail: ['a@example.com'], bccEmail: ['A@example.com']}), /Duplicate recipient/)
  assert.throws(() => normalizeSendRecipients({receiveEmail: ['a@example.com'], ccEmail: ['bad-address']}), /Invalid Cc/)
  assert.throws(() => normalizeSendRecipients({receiveEmail: []}), /At least one To/)
  assert.throws(() => normalizeSendRecipients({receiveEmail: Array.from({length: 51}, (_, index) => `user${index}@example.com`)}), /at most 50/)
})
