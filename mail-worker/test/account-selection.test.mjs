import assert from 'node:assert/strict';
import test from 'node:test';
import { belongsToUser } from '../src/service/account-selection.mjs';

test('only a live mailbox owned by the logged-in user can be restored', () => {
	assert.equal(belongsToUser({accountId: 7, userId: 3}, 3), true);
	assert.equal(belongsToUser({accountId: 7, userId: 4}, 3), false);
	assert.equal(belongsToUser(null, 3), false);
});
