const HTML_SIGNATURE_PATTERN = /<(?:!doctype|html|body|table|tbody|thead|tfoot|tr|td|th|div|span|p|br|img|a)\b/i
const BLOCKED_ELEMENTS = 'script,style,iframe,object,embed,form,input,button,textarea,select,option,meta,link,base,template,video,audio,canvas'
const UNSAFE_PROTOCOL = /^\s*(?:javascript|vbscript):/i

function escapeText(value) {
  return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
}

function sanitizeStyle(element) {
  const style = element.style
  if (!style) return
  if (['fixed', 'sticky'].includes(style.position)) style.removeProperty('position')
  ;['behavior', '-moz-binding'].forEach(property => style.removeProperty(property))
  if (/expression\s*\(|url\s*\(\s*['"]?\s*javascript:/i.test(style.cssText)) {
    element.removeAttribute('style')
  }
}

function sanitizeElement(element) {
  for (const attribute of [...element.attributes]) {
    const name = attribute.name.toLowerCase()
    const value = attribute.value
    if (name.startsWith('on') || ['srcdoc', 'formaction'].includes(name)) {
      element.removeAttribute(attribute.name)
      continue
    }
    if ((name === 'href' || name === 'src' || name.endsWith(':href')) && UNSAFE_PROTOCOL.test(value)) {
      element.removeAttribute(attribute.name)
    }
  }
  sanitizeStyle(element)
  if (element.tagName === 'A' && element.getAttribute('target') === '_blank') {
    element.setAttribute('rel', 'noopener noreferrer')
  }
}

export function isHtmlSignature(content) {
  return HTML_SIGNATURE_PATTERN.test(String(content || ''))
}

export function signatureContentHtml(content) {
  const source = String(content || '').trim()
  if (!source) return ''
  if (!isHtmlSignature(source)) return escapeText(source).replaceAll('\n', '<br>')

  const documentNode = new DOMParser().parseFromString(source, 'text/html')
  documentNode.querySelectorAll(BLOCKED_ELEMENTS).forEach(element => element.remove())
  documentNode.body.querySelectorAll('*').forEach(sanitizeElement)
  sanitizeElement(documentNode.body)

  const bodyStyle = documentNode.body.getAttribute('style')
  const bodyContent = documentNode.body.innerHTML
  if (!bodyStyle) return bodyContent

  const wrapper = documentNode.createElement('div')
  wrapper.setAttribute('style', bodyStyle)
  wrapper.innerHTML = bodyContent
  return wrapper.outerHTML
}
