export function buildReplyContext(email, {sent, sender, subject, body}) {
	if (!sent) {
		return {
			direction: 'The source is an email our company RECEIVED. Draft a reply FROM our company TO its original sender.',
			source: `Received email follows.\nFrom customer: ${sender}\nSubject: ${subject}\nBody:\n${body}`
		};
	}

	let recipients = [];
	try {
		const raw = typeof email.recipient === 'string' ? JSON.parse(email.recipient) : email.recipient;
		recipients = Array.isArray(raw) ? raw.map(item => String(item?.address || item?.email || item || '').trim()).filter(Boolean) : [];
	} catch {
		recipients = [];
	}

	return {
		direction: 'The source is an email our company already SENT to a customer. Draft a follow-up FROM our company TO its original recipient. Do not write as the customer, answer our own message, treat our offer as the customer’s quote, or claim the customer has responded. The category and summary must describe a sent follow-up, not an incoming inquiry. If a response is needed to proceed, politely ask for it.',
		source: `Already-sent email follows.\nFrom our company: ${sender}\nTo customer: ${recipients.join(', ').slice(0, 500)}\nSubject: ${subject}\nBody:\n${body}`
	};
}
