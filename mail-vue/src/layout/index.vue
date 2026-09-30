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
          :class="(uiStore.asideShow && isMobile)? 'overlay-show':'overlay-hide'"
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
const isMobile = ref(window.innerWidth < 1025)
const handleResize = () => {
  isMobile.value = window.innerWidth < 1025
  uiStore.asideShow = window.innerWidth > 1024;
}

onMounted(() => {
  uiStore.writerRef = writerRef

  window.addEventListener('resize', handleResize)
  handleResize()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
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

.overlay-show {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
  transition: all 0.3s;
}

.overlay-hide {
  display: flex;
  pointer-events: none;
  opacity: 0;
}

@media (min-width: 1025px) {
  .aside-hide { margin-left: calc(-1 * var(--sidebar-w)); }
}

@media (max-width: 1024px) {
  .aside {
    position: fixed;
    top: var(--topbar-h);
    bottom: 0;
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
