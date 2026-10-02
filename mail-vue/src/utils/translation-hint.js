const englishClues = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'have',
  'in', 'is', 'it', 'of', 'on', 'or', 'please', 'that', 'the', 'this',
  'to', 'we', 'with', 'you', 'your',
])

export function suggestedSourceLanguage(text, interfaceLanguage) {
  const sample = String(text || '')
    .replace(/https?:\/\/\S+|\b\S+@\S+\b/g, ' ')
    .slice(0, 1000)
  const hanCount = (sample.match(/\p{Script=Han}/gu) || []).length
  const words = (sample.match(/[A-Za-z]+(?:['’-][A-Za-z]+)?/g) || []).map(word => word.toLowerCase())
  const latinCount = words.join('').length

  if (interfaceLanguage === 'en') {
    return hanCount >= 8 && hanCount > latinCount / 3 ? 'zh' : ''
  }

  const clueCount = words.filter(word => englishClues.has(word)).length
  return words.length >= 5 && latinCount >= 24 && hanCount < latinCount / 5
    && (clueCount >= 1 || words.length >= 12) ? 'en' : ''
}
