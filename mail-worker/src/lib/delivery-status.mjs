const eventStatuses = {
  delivered: 'delivered',
  deferred: 'delayed',
  bounced: 'bounced',
  rejected: 'bounced',
  failed: 'failed',
  complained: 'complained'
}
const finalStatuses = new Set(['delivered', 'bounced', 'failed', 'complained'])

export function applyCloudflareDeliveryEvent(message, event, addresses) {
  if (event?.source?.type !== 'email.sending' || !event.type?.startsWith('cf.email.sending.message.')) return null
  const status = eventStatuses[event.type.split('.').pop()]
  const payload = event.payload || {}
  const address = String(payload.recipient || '').trim()
  const known = addresses.find(item => item.toLowerCase() === address.toLowerCase())
  if (!status || !known || !payload.messageId) return null

  let data = {}
  try { data = message ? JSON.parse(message) : {} } catch { data = {} }
  if (!data || typeof data !== 'object' || Array.isArray(data)) data = {}
  const delivery = data.delivery?.provider === 'cloudflare' ? {...data.delivery} : {provider: 'cloudflare', recipients: {}}
  delivery.recipients = {...delivery.recipients}
  const key = known.toLowerCase()
  const previous = delivery.recipients[key]
  const at = String(event.metadata?.eventTimestamp || '')
  if (previous?.eventId && previous.eventId === payload.eventId) return null
  if (previous?.at && at && previous.at > at) return null
  if (finalStatuses.has(previous?.status) && status === 'delayed') return null

  delivery.recipients[key] = {
    address: known,
    status,
    at,
    eventId: String(payload.eventId || ''),
    reason: String(payload.bounce?.reason || payload.failure?.reason || payload.rejection?.detail || payload.rejection?.reason || payload.delivery?.smtpResponse || '').slice(0, 500)
  }
  const states = addresses.map(item => delivery.recipients[item.toLowerCase()]?.status || 'pending')
  let aggregateStatus = 1 // Accepted by the provider, but not yet delivered.
  if (states.includes('complained')) aggregateStatus = 4
  else if (states.includes('bounced')) aggregateStatus = 3
  else if (states.includes('failed')) aggregateStatus = 8
  else if (states.every(item => item === 'delivered')) aggregateStatus = 2
  else if (states.includes('delayed')) aggregateStatus = 5

  data.delivery = delivery
  data.message = states.includes('bounced') || states.includes('failed')
    ? addresses.filter(item => ['bounced', 'failed'].includes(delivery.recipients[item.toLowerCase()]?.status))
      .map(item => `${item}: ${delivery.recipients[item.toLowerCase()].reason || delivery.recipients[item.toLowerCase()].status}`).join('; ')
    : ''
  return {status: aggregateStatus, message: JSON.stringify(data)}
}
