import assert from 'node:assert/strict';
import test from 'node:test';
import { requiresAccountFilter } from '../src/service/mailbox-scope.mjs';

test('sent mail stays scoped to the selected identity even with receive-all enabled', () => {
	assert.equal(requiresAccountFilter(1, 1), true);
	assert.equal(requiresAccountFilter(1, 0), true);
});

test('receive-all widens only the inbox', () => {
	assert.equal(requiresAccountFilter(0, 1), false);
	assert.equal(requiresAccountFilter(0, 0), true);
});
