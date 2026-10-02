// Receiving-all applies only to the inbox. Sent mail always belongs to its sender identity.
export function requiresAccountFilter(type, allReceive) {
	return Number(type) !== 0 || !Boolean(Number(allReceive));
}
