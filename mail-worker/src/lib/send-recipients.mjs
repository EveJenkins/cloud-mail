const emailPattern = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/

export function normalizeSendRecipients({receiveEmail, ccEmail = [], bccEmail = []}) {
  const seen = new Set()
  const normalize = (addresses, label) => {
    if (!Array.isArray(addresses)) throw new Error(`${label} must be an array`)
    return addresses.map(value => {
      const address = String(value || '').trim()
      if (!emailPattern.test(address)) throw new Error(`Invalid ${label} address: ${address}`)
      const key = address.toLowerCase()
      if (seen.has(key)) throw new Error(`Duplicate recipient: ${address}`)
      seen.add(key)
      return address
    })
  }
  const to = normalize(receiveEmail, 'To')
  const cc = normalize(ccEmail, 'Cc')
  const bcc = normalize(bccEmail, 'Bcc')
  if (!to.length) throw new Error('At least one To recipient is required')
  const all = [...to, ...cc, ...bcc]
  if (all.length > 50) throw new Error('A message can have at most 50 recipients')
  return {to, cc, bcc, all}
}

export function recipientMetadata({to, cc, bcc}, includeBcc) {
  const encode = addresses => JSON.stringify(addresses.map(address => ({address, name: ''})))
  return {
    recipient: encode(to),
    cc: encode(cc),
    bcc: encode(includeBcc ? bcc : [])
  }
}
