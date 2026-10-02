export function belongsToUser(account, userId) {
	return Boolean(account && Number(account.userId) === Number(userId));
}
