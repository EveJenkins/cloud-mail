<template>
  <nav class="mobile-tabs" aria-label="Mobile navigation">
    <button :class="{ active: mailSectionActive }" :aria-current="mailSectionActive ? 'page' : undefined" @click="go('email')">
      <Icon icon="hugeicons:mailbox-01" /><span>{{ settingStore.lang === 'zh' ? '邮箱' : 'Mail' }}</span>
    </button>
    <button class="compose-tab" v-perm="'email:send'" @click="compose">
      <span class="compose-icon"><Icon icon="material-symbols:edit-outline" /></span><span>{{ settingStore.lang === 'zh' ? '写信' : 'Compose' }}</span>
    </button>
    <button :class="{ active: route.meta.name === 'contacts' }" :aria-current="route.meta.name === 'contacts' ? 'page' : undefined" @click="go('contacts')">
      <Icon icon="fluent:people-team-20-regular" /><span>{{ settingStore.lang === 'zh' ? '通讯录' : 'Directory' }}</span>
    </button>
    <button :class="{ active: route.meta.name === 'setting' }" :aria-current="route.meta.name === 'setting' ? 'page' : undefined" @click="go('setting')">
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
import { computed } from 'vue'

const route = useRoute()
const uiStore = useUiStore()
const settingStore = useSettingStore()
const mailSectionActive = computed(() => ['email', 'content', 'star', 'send', 'draft'].includes(route.meta.name))
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
    height: calc(54px + env(safe-area-inset-bottom));
    padding-bottom: env(safe-area-inset-bottom);
    display: flex;
    align-items: stretch;
    background: var(--surface);
    border-top: 1px solid var(--border);
    box-shadow: 0 -2px 10px rgba(0, 0, 0, .04);
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
  .compose-tab { color: var(--brand-700); font-weight: 650; }
  .compose-icon { width: 36px; height: 26px; display: grid; place-items: center; color: #fff; border-radius: var(--r-md); background: var(--brand-600); transform: translateY(-2px); }
  .compose-tab svg { width: 18px; height: 18px; }
}
</style>
