<template>
  <nav class="mobile-tabs" aria-label="Mobile navigation">
    <button :class="{ active: route.meta.name === 'email' }" @click="go('email')">
      <Icon icon="hugeicons:mailbox-01" /><span>{{ $t('inbox') }}</span>
    </button>
    <button v-perm="'email:send'" @click="compose">
      <Icon icon="material-symbols:edit-outline" /><span>{{ settingStore.lang === 'zh' ? '写信' : 'Compose' }}</span>
    </button>
    <button :class="{ active: route.meta.name === 'star' }" @click="go('star')">
      <Icon icon="solar:star-line-duotone" /><span>{{ $t('starred') }}</span>
    </button>
    <button v-if="hasPerm('analysis:query')" :class="{ active: route.meta.name === 'analysis' }" @click="go('analysis')">
      <Icon icon="fluent:data-pie-20-regular" /><span>{{ $t('analytics') }}</span>
    </button>
    <button v-else v-perm="'email:send'" :class="{ active: route.meta.name === 'send' }" @click="go('send')">
      <Icon icon="solar:plain-2-linear" /><span>{{ $t('sent') }}</span>
    </button>
    <button :class="{ active: route.meta.name === 'setting' }" @click="go('setting')">
      <Icon icon="fluent:settings-48-regular" /><span>{{ $t('settings') }}</span>
    </button>
  </nav>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { useRoute } from 'vue-router'
import router from '@/router/index.js'
import { useUiStore } from '@/store/ui.js'
import { useSettingStore } from '@/store/setting.js'
import { hasPerm } from '@/perm/perm.js'

const route = useRoute()
const uiStore = useUiStore()
const settingStore = useSettingStore()
const go = name => router.push({ name })
const compose = () => uiStore.writerRef?.open?.()
</script>

<style lang="scss" scoped>
.mobile-tabs { display: none; }
@media (max-width: 767px) {
  .mobile-tabs {
    position: fixed;
    z-index: 90;
    left: 0;
    right: 0;
    bottom: 0;
    height: calc(58px + env(safe-area-inset-bottom));
    padding-bottom: env(safe-area-inset-bottom);
    display: flex;
    align-items: stretch;
    background: var(--surface);
    border-top: 1px solid var(--border);
    box-shadow: 0 -8px 24px rgba(15, 23, 42, .06);
  }
  button {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    color: var(--text-3);
    font-size: 10.5px;
    cursor: pointer;
  }
  button svg { width: 20px; height: 20px; }
  button.active { color: var(--brand-600); font-weight: 650; }
}
</style>
