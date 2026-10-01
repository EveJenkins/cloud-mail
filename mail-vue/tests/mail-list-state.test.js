import test from 'node:test'
import assert from 'node:assert/strict'
import { mailListRows } from '../src/utils/mail-list-state.js'

test('empty inbox and zero search matches stay empty after pagination ends', () => {
  assert.deepEqual(mailListRows([], { exhausted: true }), [])
  assert.deepEqual(mailListRows([], { loadingMore: true }), [])
})

test('a populated list retains its messages and exactly one pagination row', () => {
  const messages = [{ emailId: 12 }, { emailId: 11 }]
  assert.deepEqual(mailListRows(messages, { exhausted: true }), [...messages, { emailId: 0, expand: 'noMoreData' }])
  assert.deepEqual(mailListRows(messages, { loadingMore: true }), [...messages, { emailId: 0, expand: 'loading' }])
  assert.equal(messages.length, 2)
})

test('failed pagination offers retry without discarding already loaded mail', () => {
  const messages = [{ emailId: 12 }]
  assert.deepEqual(mailListRows(messages, { loadingMore: true, failed: true }), [...messages, { emailId: 0, expand: 'retry' }])
  assert.deepEqual(mailListRows(messages), messages)
  assert.deepEqual(mailListRows([], { failed: true }), [])
})
