<template>
  <div class="content-box" ref="contentBox">
    <div ref="container" class="content-html"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  html: {
    type: String,
    required: true
  },
  comfortable: {
    type: Boolean,
    default: false
  },
  fallbackText: {
    type: String,
    default: ''
  }
})

const container = ref(null)
const contentBox = ref(null)
let shadowRoot = null
let resizeObserver = null

function escapeHtml(value) {
  return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
}

function getSafeBody() {
  const source = String(props.html || '')
  try {
    const documentNode = new DOMParser().parseFromString(source, 'text/html')
    documentNode.querySelectorAll('script, iframe, object, embed, base, meta[http-equiv="refresh"]').forEach(node => node.remove())
    const body = documentNode.body
    const bodyStyle = body?.getAttribute('style') || ''
    const documentStyles = Array.from(documentNode.head?.querySelectorAll('style') || []).map(node => node.outerHTML).join('')
    const html = `${documentStyles}${body?.innerHTML || ''}`
    const text = String(body?.textContent || '').replace(/\s+/g, ' ').trim()
    const hasVisualContent = Boolean(body?.querySelector('img, svg, table, video, audio, canvas'))
    if (!text && !hasVisualContent && props.fallbackText.trim()) {
      return {bodyStyle: '', html: `<pre class="plain-fallback">${escapeHtml(props.fallbackText)}</pre>`}
    }
    return {bodyStyle, html: html || source}
  } catch {
    return {bodyStyle: '', html: source || `<pre class="plain-fallback">${escapeHtml(props.fallbackText)}</pre>`}
  }
}

function updateContent() {
  if (!shadowRoot) return;
  const {bodyStyle, html} = getSafeBody()
  shadowRoot.innerHTML = `
    <style>
      :host {
        all: initial;
        width: 100%;
        height: 100%;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
                    'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', 'Source Han Sans SC',
                    'Noto Sans CJK SC', Arial, sans-serif;
        font-size: var(--font-read-body, ${props.comfortable ? '14.5px' : '14px'});
        line-height: ${props.comfortable ? '1.85' : '1.5'};
        color: #13181D;
        word-break: break-word;
      }

      h1, h2, h3, h4 {
          font-size: 18px;
          font-weight: 700;
      }

      p {
        margin: ${props.comfortable ? '0 0 12px' : '0'};
      }

      p:last-child { margin-bottom: 0; }

      a {
        text-decoration: none;
        color: #1677FF;
      }

      .shadow-content {
        background: #FFFFFF;
        color: #13181D;
        width: fit-content;
        height: fit-content;
        min-width: 100%;
        ${bodyStyle ? bodyStyle : ''} /* 注入 body 的 style */
      }

      .plain-fallback {
        margin: 0;
        color: #13181D;
        background: #FFFFFF;
        font: inherit;
        line-height: inherit;
        white-space: pre-wrap;
        word-break: break-word;
      }

      img:not(table img) {
        max-width: 100%;
        height: auto !important;
      }

    </style>
    <div class="shadow-content">
      ${html}
    </div>
  `;
}

function autoScale() {
  if (!shadowRoot || !contentBox.value) return

  const parent = contentBox.value
  const shadowContent = shadowRoot.querySelector('.shadow-content')

  if (!shadowContent) return

  const parentWidth = parent.offsetWidth
  const childWidth = shadowContent.scrollWidth

  if (parentWidth <= 0 || childWidth <= 0) return

  const scale = Math.min(1, parentWidth / childWidth)

  const hostElement = shadowRoot.host
  hostElement.style.zoom = scale
}

onMounted(() => {
  shadowRoot = container.value.attachShadow({ mode: 'open' })
  updateContent()
  autoScale()
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => autoScale())
    resizeObserver.observe(contentBox.value)
  }
})

watch(() => [props.html, props.fallbackText], () => {
  updateContent()
  autoScale()
})

onUnmounted(() => resizeObserver?.disconnect())
</script>

<style scoped>
.content-box {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: Inter, "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
}

.content-html {
  width: 100%;
  height: 100%;
}
</style>
