// Pagination rows must never hide the empty state of the actual message list.
export function mailListRows(messages, { loadingMore = false, exhausted = false, failed = false } = {}) {
  if (!messages.length) return []
  const expand = failed ? 'retry' : loadingMore ? 'loading' : exhausted ? 'noMoreData' : null
  return expand ? [...messages, { emailId: 0, expand }] : [...messages]
}
