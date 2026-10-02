<template>
  <div class="layout">
    <header class="topbar">
      <Header />
    </header>
    <div class="layout-body">
      <aside
          class="aside"
          :class="uiStore.asideShow ? 'aside-show' : 'aside-hide'">
        <Aside />
      </aside>
      <div
          class="sidebar-overlay"
          :class="{ 'is-visible': uiStore.asideShow && isMobile }"
          @click="uiStore.asideShow = false"
      ></div>
      <div class="main-container">
        <Main />
      </div>
    </div>
  </div>
  <MobileTab />
  <writer ref="writerRef" />
</template>

<script setup>
import Aside from '@/layout/aside/index.vue'
import Header from '@/layout/header/index.vue'
import Main from '@/layout/main/index.vue'
import MobileTab from '@/layout/mobile-tab/index.vue'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import {useUiStore} from "@/store/ui.js";
import writer from '@/layout/write/index.vue'

const uiStore = useUiStore();
const writerRef = ref({})
const mobileViewport = window.matchMedia('(max-width: 767px)')
const isMobile = ref(mobileViewport.matches)
const handleViewportChange = ({ matches }) => {
  isMobile.value = matches
  uiStore.asideShow = !matches
}

onMounted(() => {
  uiStore.writerRef = writerRef

  mobileViewport.addEventListener('change', handleViewportChange)
})

onBeforeUnmount(() => {
  mobileViewport.removeEventListener('change', handleViewportChange)
})
</script>

<style lang="scss" scoped>
.layout {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg);
}

.topbar {
  flex: none;
  height: var(--topbar-h);
  background: var(--topbar-bg);
  color: var(--topbar-fg);
  z-index: 102;
}

.layout-body {
  flex: 1;
  min-height: 0;
  display: flex;
  position: relative;
}

.aside {
  flex: none;
  width: var(--sidebar-w);
  height: 100%;
  background: var(--sidebar-surface);
  border-right: 1px solid var(--border);
  transition: margin-left var(--dur) var(--ease), transform var(--dur) var(--ease);
}

.main-container {
  flex: 1;
  min-width: 0;
  background: var(--settings-page-background);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity var(--dur) var(--ease), visibility 0s var(--dur);
}

.sidebar-overlay.is-visible {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition-delay: 0s;
}

@media (min-width: 768px) {
  .aside-hide { margin-left: calc(-1 * var(--sidebar-w)); }
}

@media (max-width: 767px) {
  .aside {
    position: fixed;
    top: var(--topbar-h);
    bottom: 0;
    height: auto;
    left: 0;
    z-index: 101;
    transform: translateX(-100%);
  }
  .aside-show { transform: translateX(0); }
}

@media (max-width: 767px) {
  .topbar { height: 48px; }
  .main-container { padding-bottom: calc(54px + env(safe-area-inset-bottom)); }
  .aside { top: 48px; }
}
</style>
