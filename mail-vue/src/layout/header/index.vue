<template>
  <div class="header" :class="[{ 'not-send': !hasPerm('email:send'), 'mobile-search-open': mobileSearchOpen, 'has-switcher': canSwitch }]">
    <div class="brand">
      <button class="header-btn" type="button" :aria-label="settingStore.lang === 'zh' ? '收起或展开菜单' : 'Toggle menu'" @click="changeAside">
        <hanburger />
      </button>
      <span class="brand-mark"><Icon icon="mdi:email-outline" width="18" height="18" /></span>
      <strong class="brand-title">{{ settingStore.settings.title || (settingStore.lang === 'zh' ? '企业邮箱' : 'Mail') }}</strong>
    </div>
    <div class="global-search" :class="{ open: mobileSearchOpen }">
      <button class="mobile-context" type="button" @click="openMobileSearch">
        <span>{{ routeTitle }}</span>
        <small>{{ currentContext }}</small>
      </button>
      <Icon class="search-icon" icon="solar:magnifer-linear" width="17" height="17"/>
      <input
          ref="searchRef"
          v-model="searchQuery"
          :placeholder="settingStore.lang === 'zh' ? '搜索发件人、主题或正文…' : 'Search senders, subjects or message text…'"
          aria-label="Global search"
          @keydown.enter="submitGlobalSearch"
          @keydown.esc="clearGlobalSearch"
      />
      <kbd>Ctrl K</kbd>
      <button class="mobile-search-close" type="button" :aria-label="settingStore.lang === 'zh' ? '关闭搜索' : 'Close search'" @click="closeMobileSearch">
        <Icon icon="solar:close-circle-linear" width="19" height="19" />
      </button>
    </div>
    <div v-if="canSwitch" class="mailbox-switcher" ref="mailboxSwitchRef">
      <button class="mailbox-trigger" type="button" :aria-label="settingStore.lang === 'zh' ? `切换邮箱，当前为 ${currentMailboxEmail}` : `Switch mailbox, current ${currentMailboxEmail}`" :aria-expanded="uiStore.accountShow" @click="toggleMailbox">
        <span class="mailbox-initial">{{ currentMailboxEmail.charAt(0).toUpperCase() }}</span>
        <strong class="mailbox-label" :title="currentMailboxEmail">{{ currentMailboxEmail }}</strong>
        <Icon class="mailbox-chevron" icon="mingcute:down-small-fill" width="17" />
      </button>
      <transition name="mailbox-pop">
        <div v-show="uiStore.accountShow" class="mailbox-pop"><AccountSwitcher /></div>
      </transition>
    </div>
    <div class="toolbar">
      <button v-if="hasPerm('email:send')" class="compose-btn" :class="{ active: composeOpen }" type="button"
              :aria-pressed="composeOpen" :aria-label="settingStore.lang === 'zh' ? '写邮件' : 'Compose'" @click="openSend">
        <Icon icon="material-symbols:edit-outline" width="17" height="17" />
        <span>{{ settingStore.lang === 'zh' ? '写邮件' : 'Compose' }}</span>
      </button>
      <button class="mobile-search-trigger icon-item" type="button" :aria-label="settingStore.lang === 'zh' ? '搜索邮件' : 'Search mail'" @click="openMobileSearch">
        <Icon icon="solar:magnifer-linear" />
      </button>
      <button v-if="uiStore.dark" class="sun-icon icon-item" type="button" :aria-label="settingStore.lang === 'zh' ? '切换浅色主题' : 'Use light theme'" @click="openDark($event)">
        <Icon icon="mingcute:sun-fill"/>
      </button>
      <button v-else class="dark-icon icon-item" type="button" :aria-label="settingStore.lang === 'zh' ? '切换深色主题' : 'Use dark theme'" @click="openDark($event)">
        <Icon icon="solar:moon-linear"/>
      </button>
      <button class="notice icon-item" type="button" :aria-label="settingStore.lang === 'zh' ? '系统通知' : 'Notifications'" @click="openNotice">
        <Icon icon="solar:megaphone-linear"/>
      </button>
      <el-dropdown ref="userinfoRef" @visible-change="e => userInfoShow = e" :teleported="false" popper-class="detail-dropdown">
        <div class="avatar" @click="userInfoHide" >
          <div class="avatar-text">
            <div>{{ formatName(userStore.user.email) }}</div>
          </div>
          <div class="avatar-identity">
            <strong>{{ userDisplayName }}</strong>
            <span>{{ roleName }}</span>
          </div>
          <Icon class="setting-icon" icon="mingcute:down-small-fill" width="24" height="24"/>
        </div>
        <template #dropdown>
          <div class="user-details">
            <div class="details-avatar">
              {{ formatName(userStore.user.email) }}
            </div>
            <div class="user-name">
              {{ userStore.user.name }}
            </div>
            <div class="detail-email" @click="copyEmail(userStore.user.email)">
              {{ userStore.user.email }}
            </div>
            <div class="detail-user-type">
              <el-tag>{{ userStore.user.role.name }}</el-tag>
            </div>
            <div class="action-info">
              <div>
                <span style="margin-right: 10px">{{ $t('sendCount') }}</span>
                <span style="margin-right: 10px">{{ $t('accountCount') }}</span>
              </div>
              <div>
                <div>
                  <span v-if="sendCount" style="margin-right: 5px">{{ sendCount }}</span>
                  <el-tag v-if="!hasPerm('email:send')">{{ sendType }}</el-tag>
                  <el-tag v-else>{{ sendType }}</el-tag>
                </div>
                <div>
                  <el-tag v-if="settingStore.settings.manyEmail || settingStore.settings.addEmail">
                    {{ $t('disabled') }}
                  </el-tag>
                  <span v-else-if="accountCount && hasPerm('account:add')"
                        style="margin-right: 5px">{{ $t('totalUserAccount', {msg: accountCount}) }}</span>
                  <el-tag v-else-if="!accountCount && hasPerm('account:add')">{{ $t('unlimited') }}</el-tag>
                  <el-tag v-else-if="!hasPerm('account:add')">{{ $t('unauthorized') }}</el-tag>
                </div>
              </div>
            </div>
            <div class="logout">
              <el-button type="primary" :loading="logoutLoading" @click="clickLogout">{{ $t('logOut') }}</el-button>
            </div>
          </div>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import router from "@/router";
import hanburger from '@/components/hamburger/index.vue'
import {logout} from "@/request/login.js";
import {Icon} from "@iconify/vue";
import {useUiStore} from "@/store/ui.js";
import {useUserStore} from "@/store/user.js";
import {useAccountStore} from "@/store/account.js";
import {useRoute} from "vue-router";
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from "vue";
import {useSettingStore} from "@/store/setting.js";
import {hasPerm} from "@/perm/perm.js"
import {useI18n} from "vue-i18n";
import {setExtend} from "@/utils/day.js"
import AccountSwitcher from '@/layout/account/index.vue'

const {t} = useI18n();
const route = useRoute();
const settingStore = useSettingStore();
const userStore = useUserStore();
const accountStore = useAccountStore();
const uiStore = useUiStore();
const logoutLoading = ref(false)
const userInfoShow = ref(false)
const userinfoRef = ref({})
const searchRef = ref(null)
const searchQuery = ref('')
const mobileSearchOpen = ref(false)
const mailboxSwitchRef = ref(null)
const canSwitch = computed(() => hasPerm('account:query') && settingStore.settings.manyEmail === 0)
const currentMailboxEmail = computed(() => accountStore.currentAccount?.email || userStore.user.email || '')
const userDisplayName = computed(() => userStore.user.name || userStore.user.email?.split('@')[0] || (settingStore.lang === 'zh' ? '企业成员' : 'Member'))
const roleName = computed(() => userStore.user.role?.name || (settingStore.lang === 'zh' ? '企业成员' : 'Member'))
const routeTitle = computed(() => {
  const zh = settingStore.lang === 'zh'
  const labels = {
    email: zh ? '收件箱' : 'Inbox',
    content: zh ? '邮件详情' : 'Message',
    star: zh ? '星标邮件' : 'Starred',
    send: zh ? '已发送' : 'Sent',
    draft: zh ? '草稿箱' : 'Drafts',
    contacts: zh ? '通讯录' : 'Contacts',
    quickPhrases: zh ? '快捷短语' : 'Quick phrases',
    signatures: zh ? '邮件签名' : 'Signatures',
    setting: zh ? '个人设置' : 'Settings',
    analysis: zh ? '数据分析' : 'Analytics',
    user: zh ? '成员管理' : 'Members',
    role: zh ? '权限管理' : 'Permissions',
    'all-email': zh ? '全部邮件' : 'All mail',
    'reg-key': zh ? '邀请码' : 'Invite codes',
    'sys-setting': zh ? '系统设置' : 'System settings',
  }
  return labels[route.meta.name] || (zh ? '企业邮箱' : 'Business mail')
})
const currentContext = computed(() => route.meta.name === 'email'
  ? (settingStore.lang === 'zh' ? '搜索与处理邮件' : 'Search and manage mail')
  : (settingStore.lang === 'zh' ? '轻触搜索全部邮件' : 'Tap to search all mail'))

watch(
  () => route.query.q,
  value => {
    searchQuery.value = typeof value === 'string' ? value : ''
  },
  {immediate: true}
)

watch(() => route.name, () => {
  mobileSearchOpen.value = false
  uiStore.accountShow = false
})

function toggleMailbox() {
  if (window.innerWidth < 768) uiStore.asideShow = false
  uiStore.accountShow = !uiStore.accountShow
}

function closeMailboxOnOutside(event) {
  if (uiStore.accountShow && !mailboxSwitchRef.value?.contains(event.target)) uiStore.accountShow = false
}

function closeMailboxOnEsc(event) {
  if (event.key === 'Escape') uiStore.accountShow = false
}

function handleGlobalShortcut(event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    mobileSearchOpen.value = true
    nextTick(() => searchRef.value?.focus())
    return
  }

  const target = event.target
  const isEditing = target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  if (!isEditing && !event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === 'c' && hasPerm('email:send')) {
    event.preventDefault()
    openSend()
  }
}

function submitGlobalSearch() {
  const query = searchQuery.value.trim()
  router.push({name: 'email', query: query ? {q: query} : {}})
  mobileSearchOpen.value = false
}

function clearGlobalSearch() {
  searchQuery.value = ''
  if (route.name === 'email' && route.query.q) router.replace({name: 'email'})
  searchRef.value?.blur()
  mobileSearchOpen.value = false
}

function openMobileSearch() {
  mobileSearchOpen.value = true
  nextTick(() => searchRef.value?.focus())
}

function closeMobileSearch() {
  mobileSearchOpen.value = false
  searchRef.value?.blur()
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalShortcut)
  window.addEventListener('keydown', closeMailboxOnEsc)
  document.addEventListener('click', closeMailboxOnOutside)
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalShortcut)
  window.removeEventListener('keydown', closeMailboxOnEsc)
  document.removeEventListener('click', closeMailboxOnOutside)
})

const accountCount = computed(() => {
  return userStore.user.role.accountCount
})

const sendType = computed(() => {

  if (settingStore.settings.send === 1) {
    return t('disabled')
  }

  if (!hasPerm('email:send')) {
    return t('unauthorized')
  }

  if (userStore.user.role.sendType === 'ban') {
    return t('sendBanned')
  }

  if (userStore.user.role.sendType === 'internal') {
    return t('sendInternal')
  }

  if (!userStore.user.role.sendCount) {
    return t('unlimited')
  }

  if (userStore.user.role.sendType === 'day') {
    return t('daily')
  }

  if (userStore.user.role.sendType === 'count') {
    return t('total')
  }
})

const sendCount = computed(() => {


  if (!hasPerm('email:send')) {
    return null
  }

  if (userStore.user.role.sendType === 'ban') {
    return null
  }

  if (userStore.user.role.sendType === 'internal') {
    return null
  }

  if (!userStore.user.role.sendCount) {
    return null
  }

  if (settingStore.settings.send === 1) {
    return null
  }

  return userStore.user.sendCount + '/' + userStore.user.role.sendCount
})

function userInfoHide(e) {
    if (userInfoShow.value) {
        userinfoRef.value.handleClose()
    } else {
        userinfoRef.value.handleOpen()
    }
}

async function copyEmail(email) {
  try {
    await navigator.clipboard.writeText(email);
    ElMessage({
      message: t('copySuccessMsg'),
      type: 'success',
      plain: true,
    })
  } catch (err) {
    console.error(`${t('copyFailMsg')}:`, err);
    ElMessage({
      message: t('copyFailMsg'),
      type: 'error',
      plain: true,
    })
  }
}

function changeLang(lang) {
  setExtend(lang === 'en' ? 'en' : 'zh-cn')
  settingStore.lang = lang
}

function openNotice() {
  uiStore.showNotice()
}

function openDark(e) {

  const nextIsDark = !uiStore.dark
  const root = document.documentElement

  if (!document.startViewTransition) {
    switchDark(nextIsDark, root);
    return
  }

  const x = e.clientX
  const y = e.clientY

  const maxX = Math.max(x, window.innerWidth - x)
  const maxY = Math.max(y, window.innerHeight - y)
  const endRadius = Math.hypot(maxX, maxY)

  // 标记切换目标，供 CSS 选择器使用
  root.setAttribute('data-theme-to', nextIsDark ? 'dark' : 'light')
  root.style.setProperty('--vt-x', `${x}px`)
  root.style.setProperty('--vt-y', `${y}px`)
  root.style.setProperty('--vt-end-radius', `${endRadius + 10}px`)

  const transition = document.startViewTransition(() => {
    switchDark(nextIsDark, root);
  })

  transition.finished.finally(() => {
    // 清理标记
    root.removeAttribute('data-theme-to')
  })
}

function switchDark(nextIsDark, root) {
  root.setAttribute('class', nextIsDark ? 'dark' : '')
  const metaTag = document.getElementById('theme-color-meta');
  const isMobile =  !window.matchMedia("(pointer: fine) and (hover: hover)").matches;
  metaTag.setAttribute('content', nextIsDark ? '#0E1114' : (isMobile ? '#F5F7FA' : '#FFFFFF'));
  uiStore.dark = nextIsDark
}

const composeOpen = computed(() => uiStore.composeOpen)

function openSend() {
  const writer = uiStore.writerRef
  if (!writer) return
  // 浮窗已打开时不再重复打开，改为拉回默认位置并聚焦正文
  if (uiStore.composeOpen) {
    writer.focusCompose?.()
    return
  }
  writer.open()
}

function changeAside() {
  uiStore.asideShow = !uiStore.asideShow
}

function clickLogout() {
  logoutLoading.value = true
  logout().then(() => {
    localStorage.removeItem("token")
    router.replace('/login')
  }).finally(() => {
    logoutLoading.value = false
  })
}

function formatName(email) {
  return email[0]?.toUpperCase() || ''
}

</script>
<style>
.detail-dropdown {
  color: var(--el-text-color-primary) !important;
}
</style>
<style lang="scss" scoped>

:deep(.el-popper.is-pure) {
  border-radius: 6px;
}

.user-details {
  width: 250px;
  font-size: 14px;
  display: grid;
  grid-template-columns: 1fr;
  justify-items: center;

  .user-name {
    font-weight: bold;
    margin-top: 10px;
    padding-left: 20px;
    padding-right: 20px;
    width: 250px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-align: center;
  }

  .detail-user-type {
    margin-top: 10px;
  }

  .action-info {
    width: 100%;
    display: grid;
    grid-template-columns: auto auto;
    margin-top: 10px;

    > div:first-child {
      display: grid;
      align-items: center;
      gap: 10px;
    }

    > div:last-child {
      display: grid;
      gap: 10px;
      text-align: center;

      > div {
        display: flex;
        align-items: center;
      }
    }
  }

  .detail-email {
    padding-left: 20px;
    padding-right: 20px;
    width: 250px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-align: center;
    color: var(--regular-text-color);
    cursor: pointer;
  }

  .logout {
    margin-top: 20px;
    width: 100%;
    padding-left: 10px;
    padding-right: 10px;
    padding-bottom: 10px;

    .el-button {
      border-radius: 6px;
      height: 28px;
      width: 100%;
    }
  }

  .details-avatar {
    margin-top: 20px;
    height: 40px;
    width: 40px;
    background: var(--el-bg-color);
    color: var(--el-text-color-primary);
    border: 1px solid var(--dark-border);
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--r-md);
  }
}



/* ── 顶部通栏 ───────────────────────────── */
.header {
  height: 100%;
  display: grid;
  grid-template-columns: auto minmax(200px, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 0 10px;
  font-size: 16px;
}
.header.has-switcher { grid-template-columns: auto minmax(160px, 1fr) minmax(280px, 380px) auto; }

.brand { display: flex; align-items: center; gap: 7px; min-width: 0; }
.brand-mark { width: 30px; height: 30px; flex: none; display: grid; place-items: center; color: var(--brand-600); border-radius: var(--r-md); background: #fff; }
.brand-title { max-width: 240px; overflow: hidden; color: var(--topbar-fg); font-size: 17px; font-weight: 600; white-space: nowrap; text-overflow: ellipsis; }

.header-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex: none;
  padding: 0;
  color: var(--topbar-fg);
  border-radius: var(--r-md);
  cursor: pointer;
  transition: background var(--dur) var(--ease);
}
.header-btn:hover { background: var(--topbar-hover); }

.global-search {
  width: 100%;
  max-width: 560px;
  height: 36px;
  justify-self: start;
  position: relative;
  display: flex;
  align-items: center;
  font-size: 13px;

  .search-icon { position: absolute; left: 10px; color: var(--topbar-fg-dim); pointer-events: none; transition: color var(--dur) var(--ease); }
  input {
    width: 100%;
    height: 36px;
    padding: 0 62px 0 32px;
    color: var(--topbar-fg);
    background: var(--topbar-field);
    border: 1px solid transparent;
    border-radius: var(--r-md);
    outline: none;
    transition: background var(--dur) var(--ease), color var(--dur) var(--ease);
  }
  input::placeholder { color: var(--topbar-fg-dim); }
  input:hover { background: var(--topbar-field-hover); }
  input:focus { color: var(--text); background: #fff; }
  input:focus::placeholder { color: var(--text-3); }
  &:focus-within .search-icon { color: var(--text-3); }
  kbd {
    position: absolute;
    right: 8px;
    padding: 1px 5px;
    color: var(--topbar-fg-dim);
    background: rgba(255, 255, 255, .14);
    border: 1px solid rgba(255, 255, 255, .22);
    border-radius: var(--r-sm);
    font: 11px/1.5 inherit;
  }
}

.mobile-context, .mobile-search-trigger, .mobile-search-close { display: none; }
.toolbar .mobile-search-trigger { display: none; }

.mailbox-switcher { position: relative; width: 100%; min-width: 0; justify-self: end; }
.mailbox-trigger {
  width: 100%;
  height: 38px;
  padding: 3px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--topbar-fg);
  border: 0;
  border-radius: var(--r-md);
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background var(--dur) var(--ease);
}
.mailbox-trigger:hover, .mailbox-trigger[aria-expanded="true"] { background: var(--topbar-hover); }
.mailbox-trigger:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
.mailbox-initial { width: 29px; height: 29px; flex: none; display: none; place-items: center; color: var(--brand-600); background: #fff; border-radius: var(--r-sm); font-size: 12px; font-weight: 700; }
.mailbox-label { min-width: 0; flex: 1; overflow: hidden; font-size: 16px; font-weight: 600; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; }
.mailbox-chevron { flex: none; color: var(--topbar-fg-dim); }
.mailbox-pop { position: absolute; top: calc(100% + 8px); right: 0; width: min(356px, calc(100vw - 20px)); color: var(--text); z-index: 110; }
.mailbox-pop-enter-active, .mailbox-pop-leave-active { transition: opacity var(--dur) var(--ease), transform var(--dur) var(--ease); }
.mailbox-pop-enter-from, .mailbox-pop-leave-to { opacity: 0; transform: translateY(-5px); }

.toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;

  .compose-btn {
    height: 38px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-right: 4px;
    padding: 0 12px;
    color: var(--brand-600);
    background: #fff;
    border: 0;
    border-radius: var(--r-md);
    font-size: 16px;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition: background var(--dur) var(--ease), color var(--dur) var(--ease);
  }
  .compose-btn:hover { color: var(--brand-700); background: var(--brand-50); }
  /* 浮窗已打开：按钮呈按下态 */
  .compose-btn.active,
  .compose-btn.active:hover {
    color: #fff;
    background: rgba(255, 255, 255, .18);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .55);
  }

  .icon-item {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--topbar-fg);
    border: 0;
    border-radius: var(--r-md);
    background: transparent;
    cursor: pointer;
    transition: background var(--dur) var(--ease);
  }
  .icon-item:hover { background: var(--topbar-hover); }

  .notice { font-size: 19px; }
  .dark-icon { font-size: 17px; }
  .sun-icon { font-size: 19px; }

  .avatar {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-left: 2px;
    padding: 3px 5px 3px 3px;
    border-radius: 999px;
    cursor: pointer;
    transition: background var(--dur) var(--ease);
  }
  .avatar:hover { background: var(--topbar-hover); }

  .avatar .avatar-text {
    height: 28px;
    width: 28px;
    flex: none;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--brand-600);
    background: #fff;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 600;
  }

  .avatar .setting-icon { color: var(--topbar-fg-dim); }

  .avatar .avatar-identity {
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    line-height: 1.2;
  }
  .avatar .avatar-identity strong { max-width: 120px; overflow: hidden; color: var(--topbar-fg); font-size: 16px; text-overflow: ellipsis; white-space: nowrap; }
  .avatar .avatar-identity span { max-width: 120px; margin-top: 1px; overflow: hidden; color: var(--topbar-fg-dim); font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
}

@media (max-width: 1024px) {
  .brand-title { display: none; }
}

@media (min-width: 768px) and (max-width: 900px) {
  .header.has-switcher { grid-template-columns: auto minmax(160px, 1fr) 38px auto; }
  .mailbox-switcher { width: 38px; }
  .mailbox-trigger { width: 38px; padding: 3px; justify-content: center; }
  .mailbox-initial { display: grid; }
  .mailbox-label, .mailbox-chevron { display: none; }
}

@media (max-width: 767px) {
  .header { grid-template-columns: auto minmax(0, 1fr) auto; gap: 6px; padding: 0 8px; }
  .header.has-switcher { grid-template-columns: auto minmax(0, 1fr) auto auto; }
  .header.has-switcher.mobile-search-open { grid-template-columns: auto minmax(0, 1fr) auto; }
  .header.mobile-search-open .mailbox-switcher { display: none; }
  .mailbox-switcher { width: 34px; }
  .mailbox-trigger { width: 34px; height: 32px; padding: 3px; justify-content: center; }
  .mailbox-initial { width: 24px; height: 24px; }
  .mailbox-initial { display: grid; }
  .mailbox-label, .mailbox-chevron { display: none; }
  .mailbox-pop { right: -48px; }
  .brand { gap: 0; }
  .brand-mark { display: none; }
  .header-btn { display: inline-flex; }
  .global-search { height: 34px; max-width: none; }
  .global-search:not(.open) .search-icon,
  .global-search:not(.open) input,
  .global-search:not(.open) kbd { display: none; }
  .mobile-context {
    width: 100%;
    min-width: 0;
    height: 34px;
    padding: 0 4px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    color: var(--topbar-fg);
    text-align: left;
    cursor: pointer;
  }
  .mobile-context span { max-width: 100%; overflow: hidden; font-size: 13.5px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
  .mobile-context small { max-width: 100%; overflow: hidden; color: var(--topbar-fg-dim); font-size: 9.5px; text-overflow: ellipsis; white-space: nowrap; }
  .global-search.open .mobile-context { display: none; }
  .global-search.open .search-icon { display: block; }
  .global-search.open input { display: block; padding-right: 34px; font-size: 12.5px; }
  .mobile-search-close { position: absolute; right: 5px; width: 28px; height: 28px; display: none; place-items: center; color: var(--topbar-fg-dim); border-radius: var(--r-md); cursor: pointer; }
  .global-search.open .mobile-search-close { display: grid; }
  .toolbar { gap: 2px; }
  .toolbar .compose-btn { width: 32px; padding: 0; justify-content: center; margin-right: 2px; }
  .toolbar .compose-btn span { display: none; }
  .toolbar .notice { display: none; }
  .toolbar .mobile-search-trigger { display: flex; }
  .header.mobile-search-open .toolbar .mobile-search-trigger { display: none; }
  .avatar { padding: 3px; }
  .avatar .setting-icon, .avatar .avatar-identity { display: none; }
  .avatar .avatar-text { width: 26px; height: 26px; }
}

.el-tooltip__trigger:first-child:focus-visible {
  outline: unset;
}
</style>
