<template>
  <div
    ref="divider"
    class="mail-pane-divider"
    role="separator"
    tabindex="0"
    aria-orientation="vertical"
    :aria-label="zh ? '调整邮件列表宽度' : 'Resize message list'"
    :aria-valuenow="width"
    :aria-valuemin="minWidth"
    :aria-valuemax="maxWidth"
    @pointerdown="startResize"
    @pointermove="moveResize"
    @pointerup="stopResize"
    @pointercancel="stopResize"
    @keydown.left.prevent="changeWidth(-24)"
    @keydown.right.prevent="changeWidth(24)"
  />
</template>

<script setup>
import { computed, onActivated, onDeactivated, onMounted, onUnmounted, ref } from 'vue'
import { useSettingStore } from '@/store/setting.js'

const storageKey = 'mail-list-pane-width'
const minWidth = 300
const width = ref(384)
const maxWidth = ref(640)
const divider = ref(null)
const settingStore = useSettingStore()
const zh = computed(() => settingStore.lang === 'zh')
let dragging = false
let workspace = null

function clamp(value) {
  maxWidth.value = Math.max(minWidth, Math.min(640, (workspace?.clientWidth || 1000) - 400))
  return Math.min(maxWidth.value, Math.max(minWidth, value))
}

function setWidth(value, save = false) {
  width.value = clamp(value)
  document.documentElement.style.setProperty('--mail-list-w', `${width.value}px`)
  if (save) localStorage.setItem(storageKey, String(width.value))
}

function startResize(event) {
  if (event.button !== 0) return
  dragging = true
  divider.value?.setPointerCapture(event.pointerId)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  event.preventDefault()
}

function moveResize(event) {
  if (!dragging || !workspace) return
  setWidth(event.clientX - workspace.getBoundingClientRect().left)
}

function stopResize() {
  if (!dragging) return
  dragging = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  localStorage.setItem(storageKey, String(width.value))
}

function changeWidth(delta) {
  setWidth(width.value + delta, true)
}

function handleResize() {
  if (!workspace?.clientWidth) return
  setWidth(width.value)
}

onMounted(() => {
  workspace = divider.value?.parentElement
  const saved = Number(localStorage.getItem(storageKey))
  width.value = Number.isFinite(saved) && saved > 0 ? saved : width.value
  handleResize()
  window.addEventListener('resize', handleResize)
})

onActivated(handleResize)
onDeactivated(stopResize)

onUnmounted(() => {
  stopResize()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.mail-pane-divider {
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(var(--mail-list-w) - 4px);
  z-index: 5;
  width: 8px;
  cursor: col-resize;
  touch-action: none;
}
.mail-pane-divider::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 3px;
  width: 2px;
  background: transparent;
  transition: background 150ms ease;
}
.mail-pane-divider:hover::after,
.mail-pane-divider:focus-visible::after { background: var(--brand-500); }
.mail-pane-divider:focus-visible { outline: none; }
</style>
