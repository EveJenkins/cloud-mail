<template>
  <div class="aside-shell">
    <div class="company-card">
      <span class="company-mark" aria-hidden="true">{{ companyInitials }}</span>
      <span class="company-copy">
        <strong>{{ companyName }}</strong>
        <small>{{ settingStore.lang === 'zh' ? '企业邮件中心' : 'Business mail' }}</small>
      </span>
    </div>

    <el-scrollbar class="scroll">
      <el-menu :collapse="false">
        <div class="group-title">{{ settingStore.lang === 'zh' ? '邮箱' : 'MAIL' }}</div>
        <el-menu-item @click="router.push({name: 'email'})" index="email"
                      :class="route.meta.name === 'email' ? 'choose-item' : ''">
          <Icon icon="hugeicons:mailbox-01" width="18" height="18" />
          <span class="menu-name">{{ $t('inbox') }}</span>
          <span class="menu-count" v-if="inboxUnread">{{ inboxUnread }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'star'})" index="star"
                      :class="route.meta.name === 'star' ? 'choose-item' : ''">
          <Icon icon="solar:star-line-duotone" width="18" height="18" />
          <span class="menu-name">{{ $t('starred') }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'send'})" index="send" v-perm="'email:send'"
                      :class="route.meta.name === 'send' ? 'choose-item' : ''">
          <Icon icon="cil:send" width="17" height="17" />
          <span class="menu-name">{{ $t('sent') }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'draft'})" index="draft" v-perm="'email:send'"
                      :class="route.meta.name === 'draft' ? 'choose-item' : ''">
          <Icon icon="ep:document" width="17" height="17" />
          <span class="menu-name">{{ $t('drafts') }}</span>
        </el-menu-item>

        <div class="group-title">{{ settingStore.lang === 'zh' ? '其他' : 'OTHER' }}</div>
        <el-menu-item @click="router.push({name: 'contacts'})" index="contacts"
                      :class="route.meta.name === 'contacts' ? 'choose-item' : ''">
          <Icon icon="fluent:people-team-20-regular" width="18" height="18" />
          <span class="menu-name">{{ settingStore.lang === 'zh' ? '通讯录' : 'Contacts' }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'quickPhrases'})" index="quickPhrases" v-perm="'email:send'"
                      :class="route.meta.name === 'quickPhrases' ? 'choose-item' : ''">
          <Icon icon="solar:notes-minimalistic-linear" width="18" height="18" />
          <span class="menu-name">{{ settingStore.lang === 'zh' ? '快捷短语' : 'Quick phrases' }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'signatures'})" index="signatures" v-perm="'email:send'"
                      :class="route.meta.name === 'signatures' ? 'choose-item' : ''">
          <Icon icon="solar:pen-new-square-linear" width="18" height="18" />
          <span class="menu-name">{{ settingStore.lang === 'zh' ? '邮件签名' : 'Signatures' }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'setting'})" index="setting"
                      :class="route.meta.name === 'setting' ? 'choose-item' : ''">
          <Icon icon="fluent:settings-48-regular" width="18" height="18" />
          <span class="menu-name">{{ $t('settings') }}</span>
        </el-menu-item>

        <div class="group-title" v-perm="['all-email:query','user:query','role:query','setting:query','analysis:query','reg-key:query']">{{ settingStore.lang === 'zh' ? '团队与设置' : 'TEAM & SETTINGS' }}</div>
        <el-menu-item @click="router.push({name: 'analysis'})" index="analysis" v-perm="'analysis:query'"
                      :class="route.meta.name === 'analysis' ? 'choose-item' : ''">
          <Icon icon="fluent:data-pie-20-regular" width="18" height="18" />
          <span class="menu-name">{{ $t('analytics') }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'user'})" index="user" v-perm="'user:query'"
                      :class="route.meta.name === 'user' ? 'choose-item' : ''">
          <Icon icon="si:user-alt-2-line" width="18" height="18" />
          <span class="menu-name">{{ $t('allUsers') }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'all-email'})" index="all-email" v-perm="'all-email:query'"
                      :class="route.meta.name === 'all-email' ? 'choose-item' : ''">
          <Icon icon="fluent:mail-list-28-regular" width="18" height="18" />
          <span class="menu-name">{{ $t('allMail') }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'role'})" index="role" v-perm="'role:query'"
                      :class="route.meta.name === 'role' ? 'choose-item' : ''">
          <Icon icon="fluent:lock-closed-16-regular" width="18" height="18" />
          <span class="menu-name">{{ $t('permissions') }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'reg-key'})" index="reg-key" v-perm="'reg-key:query'"
                      :class="route.meta.name === 'reg-key' ? 'choose-item' : ''">
          <Icon icon="fluent:fingerprint-20-filled" width="18" height="18" />
          <span class="menu-name">{{ $t('inviteCode') }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'sys-setting'})" index="sys-setting" v-perm="'setting:query'"
                      :class="route.meta.name === 'sys-setting' ? 'choose-item' : ''">
          <Icon icon="eos-icons:system-ok-outlined" width="18" height="18" />
          <span class="menu-name">{{ $t('SystemSettings') }}</span>
        </el-menu-item>
      </el-menu>
    </el-scrollbar>

    <p class="compliance-note" v-if="settingStore.lang === 'zh'">本系统邮件归公司所有，收发记录按合规要求留存</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import router from '@/router/index.js'
import { useSettingStore } from '@/store/setting.js'
import { useUiStore } from '@/store/ui.js'

const settingStore = useSettingStore()
const uiStore = useUiStore()
const route = useRoute()
const companyName = computed(() => settingStore.settings.title || (settingStore.lang === 'zh' ? '企业邮箱' : 'Business mail'))
const companyInitials = computed(() => companyName.value.trim().split(/\s+/).slice(0, 2).map(word => word.charAt(0)).join('').toUpperCase())
const inboxUnread = computed(() => Number(uiStore.asideCount?.email) || 0)
</script>

<style lang="scss" scoped>
.aside-shell {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--sidebar-surface);
}

.company-card {
  flex: none;
  margin: 10px 10px 6px;
  min-height: 66px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--surface-2);
}
.company-mark { width: 40px; height: 40px; flex: none; display: grid; place-items: center; color: #fff; border-radius: var(--r-md); background: linear-gradient(135deg, var(--brand-500), var(--brand-700)); font-size: 13px; font-weight: 750; letter-spacing: .02em; }
.company-copy { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 2px; }
.company-copy strong { overflow: hidden; color: var(--text); font-size: 13px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.company-copy small { overflow: hidden; color: var(--text-3); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }

.scroll { flex: 1; min-height: 0; padding: 0 8px; }
.group-title { padding: 13px 8px 5px; color: var(--text-3); font-size: 13px; font-weight: 500; letter-spacing: .06em; }

.el-menu { width: 100%; padding-bottom: 12px; border-right: 0; background: transparent; }
.el-menu-item {
  height: 38px;
  line-height: 38px;
  margin: 1px 0 !important;
  padding: 0 8px !important;
  gap: 9px;
  border-radius: var(--r-md);
  color: var(--text-2) !important;
  font-size: var(--font-nav);
  background: transparent !important;
  transition: color var(--dur) var(--ease), background var(--dur) var(--ease);
}
.el-menu-item:hover { color: var(--text) !important; background: var(--surface-3) !important; }
.el-menu-item.choose-item { color: var(--brand-600) !important; background: var(--brand-soft) !important; font-weight: 600; }
.menu-name { min-width: 0; flex: 1; margin-left: 0; overflow: hidden; text-overflow: ellipsis; user-select: none; }
.menu-count {
  flex: none;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: var(--brand-600);
  border-radius: 99px;
  font-size: 10.5px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.compliance-note { flex: none; margin: 0; padding: 9px 14px calc(9px + env(safe-area-inset-bottom)); color: var(--text-3); border-top: 1px solid var(--border); font-size: 13.5px; line-height: 1.5; }
</style>
