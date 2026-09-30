<template>
  <div class="aside-shell">
    <div class="title">
      <span class="brand-mark"><Icon icon="mdi:email-outline" width="19" height="19" /></span>
      <div class="brand-text">
        <strong>{{ settingStore.settings.title || (settingStore.lang === 'zh' ? '企业邮箱' : 'Mail') }}</strong>
        <span>{{ currentDomain }}</span>
      </div>
      <span class="role-badge">{{ userStore.user.role?.name || (settingStore.lang === 'zh' ? '成员' : 'Member') }}</span>
    </div>

    <div class="compose-wrap" v-perm="'email:send'">
      <el-button type="primary" class="compose-btn" @click="openWriter">
        <Icon icon="material-symbols:edit-outline" width="18" height="18" />
        <span>{{ settingStore.lang === 'zh' ? '写邮件' : 'Compose' }}</span>
      </el-button>
    </div>

    <button class="mailbox-card" type="button" @click="uiStore.accountShow = !uiStore.accountShow">
      <span class="mailbox-avatar">{{ mailboxInitial }}</span>
      <span class="mailbox-copy">
        <strong>{{ currentMailbox }}</strong>
        <small>{{ settingStore.lang === 'zh' ? '个人邮箱' : 'Personal mailbox' }}</small>
      </span>
      <Icon icon="mingcute:down-small-line" width="17" height="17" />
    </button>

    <el-scrollbar class="scroll">
      <el-menu :collapse="false">
        <div class="group-title">{{ settingStore.lang === 'zh' ? '邮箱' : 'MAIL' }}</div>
        <el-menu-item @click="router.push({name: 'email'})" index="email"
                      :class="route.meta.name === 'email' ? 'choose-item' : ''">
          <Icon icon="hugeicons:mailbox-01" width="19" height="19" />
          <span class="menu-name">{{ $t('inbox') }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'star'})" index="star"
                      :class="route.meta.name === 'star' ? 'choose-item' : ''">
          <Icon icon="solar:star-line-duotone" width="19" height="19" />
          <span class="menu-name">{{ $t('starred') }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'send'})" index="send" v-perm="'email:send'"
                      :class="route.meta.name === 'send' ? 'choose-item' : ''">
          <Icon icon="cil:send" width="18" height="18" />
          <span class="menu-name">{{ $t('sent') }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'draft'})" index="draft" v-perm="'email:send'"
                      :class="route.meta.name === 'draft' ? 'choose-item' : ''">
          <Icon icon="ep:document" width="18" height="18" />
          <span class="menu-name">{{ $t('drafts') }}</span>
        </el-menu-item>
        <div class="other-title">{{ settingStore.lang === 'zh' ? '其他' : 'OTHER' }}</div>
        <el-menu-item @click="router.push({name: 'contacts'})" index="contacts"
                      :class="route.meta.name === 'contacts' ? 'choose-item' : ''">
          <Icon icon="fluent:people-team-20-regular" width="19" height="19" />
          <span class="menu-name">{{ settingStore.lang === 'zh' ? '通讯录' : 'Contacts' }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'quickPhrases'})" index="quickPhrases" v-perm="'email:send'"
                      :class="route.meta.name === 'quickPhrases' ? 'choose-item' : ''">
          <Icon icon="solar:notes-minimalistic-linear" width="19" height="19" />
          <span class="menu-name">{{ settingStore.lang === 'zh' ? '快捷短语' : 'Quick phrases' }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'signatures'})" index="signatures" v-perm="'email:send'"
                      :class="route.meta.name === 'signatures' ? 'choose-item' : ''">
          <Icon icon="solar:pen-new-square-linear" width="19" height="19" />
          <span class="menu-name">{{ settingStore.lang === 'zh' ? '邮件签名' : 'Signatures' }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'setting'})" index="setting"
                      :class="route.meta.name === 'setting' ? 'choose-item' : ''">
          <Icon icon="fluent:settings-48-regular" width="19" height="19" />
          <span class="menu-name">{{ $t('settings') }}</span>
        </el-menu-item>

        <div class="manage-title" v-perm="['all-email:query','user:query','role:query','setting:query','analysis:query','reg-key:query']">{{ settingStore.lang === 'zh' ? '团队与设置' : 'TEAM & SETTINGS' }}</div>
        <el-menu-item @click="router.push({name: 'analysis'})" index="analysis" v-perm="'analysis:query'"
                      :class="route.meta.name === 'analysis' ? 'choose-item' : ''">
          <Icon icon="fluent:data-pie-20-regular" width="20" height="20" />
          <span class="menu-name">{{ $t('analytics') }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'user'})" index="user" v-perm="'user:query'"
                      :class="route.meta.name === 'user' ? 'choose-item' : ''">
          <Icon icon="si:user-alt-2-line" width="19" height="19" />
          <span class="menu-name">{{ $t('allUsers') }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'all-email'})" index="all-email" v-perm="'all-email:query'"
                      :class="route.meta.name === 'all-email' ? 'choose-item' : ''">
          <Icon icon="fluent:mail-list-28-regular" width="20" height="20" />
          <span class="menu-name">{{ $t('allMail') }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'role'})" index="role" v-perm="'role:query'"
                      :class="route.meta.name === 'role' ? 'choose-item' : ''">
          <Icon icon="fluent:lock-closed-16-regular" width="20" height="20" />
          <span class="menu-name">{{ $t('permissions') }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'reg-key'})" index="reg-key" v-perm="'reg-key:query'"
                      :class="route.meta.name === 'reg-key' ? 'choose-item' : ''">
          <Icon icon="fluent:fingerprint-20-filled" width="20" height="20" />
          <span class="menu-name">{{ $t('inviteCode') }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'sys-setting'})" index="sys-setting" v-perm="'setting:query'"
                      :class="route.meta.name === 'sys-setting' ? 'choose-item' : ''">
          <Icon icon="eos-icons:system-ok-outlined" width="19" height="19" />
          <span class="menu-name">{{ $t('SystemSettings') }}</span>
        </el-menu-item>
      </el-menu>
    </el-scrollbar>

    <div class="quota-card">
      <div class="quota-head">
        <span>{{ settingStore.lang === 'zh' ? '本月外发配额' : 'Monthly outbound quota' }}</span>
        <span>{{ quotaText }}</span>
      </div>
      <div class="quota-track"><span :style="{ width: quotaPercent + '%' }"></span></div>
      <div class="quota-foot" :class="{ warning: quotaPercent >= 80 }">
        <span>{{ settingStore.lang === 'zh' && quotaMax ? '超出需联系管理员' : quotaStatus }}</span>
        <Icon :icon="quotaPercent >= 80 ? 'solar:danger-triangle-linear' : 'solar:check-circle-linear'" />
      </div>
      <p class="compliance-note" v-if="settingStore.lang === 'zh'">本系统邮件归公司所有，收发记录按合规要求留存</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import router from '@/router/index.js'
import { useSettingStore } from '@/store/setting.js'
import { useUiStore } from '@/store/ui.js'
import { useUserStore } from '@/store/user.js'
import { useAccountStore } from '@/store/account.js'

const settingStore = useSettingStore()
const uiStore = useUiStore()
const userStore = useUserStore()
const accountStore = useAccountStore()
const route = useRoute()

const currentEmail = computed(() => accountStore.currentAccount?.email || userStore.user.email || '')
const currentDomain = computed(() => {
  const domain = currentEmail.value.split('@')[1] || settingStore.domainList?.[0]?.replace(/^@/, '')
  return domain ? `@${domain}` : ''
})
const currentMailbox = computed(() => (currentEmail.value.split('@')[0] ? `${currentEmail.value.split('@')[0]}@` : ''))
const mailboxInitial = computed(() => (userStore.user.name || currentMailbox.value || 'M').trim().charAt(0).toUpperCase())

const quotaMax = computed(() => Number(userStore.user.role?.sendCount) || 0)
const quotaUsed = computed(() => Number(userStore.user.sendCount) || 0)
const quotaPercent = computed(() => quotaMax.value ? Math.min(100, Math.round(quotaUsed.value / quotaMax.value * 100)) : 0)
const quotaText = computed(() => quotaMax.value ? `${quotaUsed.value} / ${quotaMax.value}` : (settingStore.lang === 'zh' ? '不限' : 'Unlimited'))
const quotaStatus = computed(() => quotaPercent.value >= 80
  ? (settingStore.lang === 'zh' ? '即将达到上限' : 'Near limit')
  : (settingStore.lang === 'zh' ? '运行正常' : 'Healthy'))

function openWriter() {
  uiStore.writerRef?.open?.()
}
</script>

<style lang="scss" scoped>
.aside-shell {
  width: var(--sidebar-w);
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--sidebar-surface);
  border-right: 1px solid var(--border);
}

.title {
  height: 52px;
  padding: 0 14px;
  flex: none;
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--text);
  font-size: 15px;
  font-weight: 600;

}

.brand-mark { width: 30px; height: 30px; flex: none; display: grid; place-items: center; color: #fff; border-radius: var(--r-md); background: var(--brand-600); }
.brand-text { min-width: 0; flex: 1; display: flex; flex-direction: column; }
.brand-text strong { overflow: hidden; color: var(--text); font-size: 13.5px; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; }
.brand-text span { margin-top: 1px; overflow: hidden; color: var(--text-3); font-size: 10.5px; font-weight: 400; text-overflow: ellipsis; white-space: nowrap; }
.role-badge { margin-left: auto; max-width: 62px; overflow: hidden; text-overflow: ellipsis; padding: 2px 6px; border-radius: var(--r-sm); color: var(--brand-600); background: var(--brand-soft); font-size: 10px; font-weight: 600; }
.compose-wrap { padding: 0 14px 10px; }
.compose-btn { width: 100%; height: 36px; display: flex; gap: 6px; }
:global(html.dark) .compose-btn { border: 1px solid rgba(255, 255, 255, .10); box-shadow: none; }
.mailbox-card { width: calc(100% - 28px); margin: 2px 14px 8px; padding: 6px 8px; display: flex; align-items: center; gap: 8px; color: var(--text); border: 1px solid var(--border); border-radius: var(--r-md); background: var(--surface-2); cursor: pointer; }
.mailbox-card:hover { border-color: color-mix(in srgb, var(--brand-500) 45%, var(--border)); }
.mailbox-avatar { width: 26px; height: 26px; flex: none; display: grid; place-items: center; color: #fff; border-radius: var(--r-sm); background: var(--brand-600); font-size: 11px; font-weight: 600; }
.mailbox-copy { min-width: 0; flex: 1; display: flex; flex-direction: column; text-align: left; }
.mailbox-copy strong { overflow: hidden; font-size: 12.5px; text-overflow: ellipsis; white-space: nowrap; }
.mailbox-copy small { margin-top: 1px; color: var(--text-3); font-size: 10.5px; }
.scroll { flex: 1; min-height: 0; padding: 0 14px; }
.group-title, .other-title, .manage-title { padding: 6px 10px 4px; color: var(--text-3); font-size: 11px; font-weight: 500; letter-spacing: .06em; }
.other-title, .manage-title { padding-top: 16px; }

.el-menu { width: 100%; padding-bottom: 20px; border-right: 0; background: transparent; }
.el-menu-item {
  height: 36px;
  line-height: 36px;
  margin: 2px 0 !important;
  padding: 0 10px !important;
  gap: 10px;
  border-radius: var(--r-md);
  color: var(--text-2) !important;
  font-size: 13px;
  background: transparent !important;
  transition: color var(--dur) var(--ease), background var(--dur) var(--ease);
}
.el-menu-item:hover { color: var(--text) !important; background: var(--surface-3) !important; }
.el-menu-item.choose-item { position: relative; color: var(--brand-600) !important; background: var(--brand-soft) !important; font-weight: 600; }
.el-menu-item.choose-item::before { content: ""; position: absolute; left: -14px; top: 50%; width: 2px; height: 16px; border-radius: 99px; background: var(--brand-600); transform: translateY(-50%); }
.menu-name { margin-left: 0; user-select: none; }

.quota-card { flex: none; margin: 10px 14px 12px; padding: 10px; border: 1px solid var(--border); border-radius: var(--r-md); background: var(--surface-2); }
.quota-head, .quota-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12px; }
.quota-head { color: var(--text-2); font-weight: 500; }
.quota-head span:last-child { color: var(--text-3); font-variant-numeric: tabular-nums; }
.quota-track { height: 4px; margin: 8px 0 6px; overflow: hidden; border-radius: 99px; background: var(--border); }
.quota-track span { display: block; height: 100%; min-width: 4px; border-radius: inherit; background: var(--brand-600); transition: width var(--dur) var(--ease); }
.quota-foot { justify-content: flex-start; color: var(--success); font-size: 11.5px; }
.quota-foot svg { margin-left: auto; }
.quota-foot.warning { color: var(--warning); }
.compliance-note { margin: 8px -1px -1px; padding-top: 8px; color: var(--text-3); border-top: 1px solid var(--border); font-size: 10.5px; line-height: 1.5; }
</style>
