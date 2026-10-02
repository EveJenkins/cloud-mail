import test from 'node:test'
import assert from 'node:assert/strict'
import {suggestedSourceLanguage} from '../src/utils/translation-hint.js'

test('suggests Chinese translation for a short English verification email', () => {
  assert.equal(suggestedSourceLanguage('Enter this temporary verification code to continue: 693553', 'zh'), 'en')
})

test('does not mistake Chinese mail with product codes for English', () => {
  assert.equal(suggestedSourceLanguage('您好，我们已经收到您的 CAT320D 询价。请确认零件编号和数量。', 'zh'), '')
})

test('suggests English translation for a Chinese message in the English interface', () => {
  assert.equal(suggestedSourceLanguage('您好，我们已收到您的询价，请确认产品型号。', 'en'), 'zh')
})
