import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReplyContext } from '../src/service/ai-reply-context.mjs';

test('sent quote produces a follow-up addressed to the original customer', () => {
	const context = buildReplyContext({recipient: '[{"address":"buyer@example.com"}]'}, {
		sent: true,
		sender: 'info@parts-hd.com',
		subject: '报价',
		body: '本报价自发出之日起 30 天内有效。'
	});
	assert.match(context.direction, /already SENT to a customer/);
	assert.match(context.direction, /Do not write as the customer/);
	assert.match(context.source, /From our company: info@parts-hd.com/);
	assert.match(context.source, /To customer: buyer@example.com/);
});

test('received inquiry produces a reply to its sender', () => {
	const context = buildReplyContext({}, {
		sent: false,
		sender: 'buyer@example.com',
		subject: 'Inquiry',
		body: 'Could you send a quote?'
	});
	assert.match(context.direction, /company RECEIVED/);
	assert.match(context.source, /From customer: buyer@example.com/);
});
