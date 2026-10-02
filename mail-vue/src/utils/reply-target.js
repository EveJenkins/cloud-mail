export function replyRecipients(email) {
  if (Number(email?.type) !== 1) {
    return email?.sendEmail ? [email.sendEmail] : []
  }

  try {
    const raw = email.recipient || email.receiveEmail || []
    const recipients = Array.isArray(raw) ? raw : JSON.parse(raw)
    if (!Array.isArray(recipients)) return []
    return [...new Set(recipients
      .map(item => String(item?.address || item?.email || item || '').trim())
      .filter(Boolean))]
  } catch {
    return []
  }
}
