<template>
  <div class="header" :class="[{ 'not-send': !hasPerm('email:send'), 'mobile-search-open': mobileSearchOpen }]">
    <div class="header-btn">
      <hanburger @click="changeAside"></hanburger>
    </div>
    <div class="global-search" :class="{ open: mobileSearchOpen }">
      <button class="mobile-context" type="button" @click="openMobileSearch">
        <span>{{ routeTitle }}</span>
        <small>{{ currentContext }}</small>
      </button>
      <Icon class="search-icon" icon="solar:magnifer-linear" width="18" height="18"/>
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
    <div class="toolbar">
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
        <Icon icon="streamline-plump:announcement-megaphone"/>
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
import {useRoute} from "vue-router";
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from "vue";
import {useSettingStore} from "@/store/setting.js";
import {hasPerm} from "@/perm/perm.js"
import {useI18n} from "vue-i18n";
import {setExtend} from "@/utils/day.js"

const {t} = useI18n();
const route = useRoute();
const settingStore = useSettingStore();
const userStore = useUserStore();
const uiStore = useUiStore();
const logoutLoading = ref(false)
const userInfoShow = ref(false)
const userinfoRef = ref({})
const searchRef = ref(null)
const searchQuery = ref('')
const mobileSearchOpen = ref(false)
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

watch(() => route.name, () => { mobileSearchOpen.value = false })

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

onMounted(() => window.addEventListener('keydown', handleGlobalShortcut))
onUnmounted(() => window.removeEventListener('keydown', handleGlobalShortcut))

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
  metaTag.setAttribute('content', nextIsDark ? '#0E1114' : (isMobile ? '#F6F8FB' : '#FFFFFF'));
  uiStore.dark = nextIsDark
}

function openSend() {
  uiStore.writerRef.open()
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
    border-radius: 10px;
  }
}


.header {
  text-align: right;
  font-size: 12px;
  display: grid;
  height: 100%;
  gap: 12px;
  grid-template-columns: minmax(240px, 560px) 1fr;
  padding: 0 16px;
}

.header.not-send {
  grid-template-columns: minmax(240px, 560px) 1fr;
}

.global-search {
  width: 100%;
  height: 38px;
  position: relative;
  display: flex;
  align-items: center;

  .search-icon { position: absolute; left: 11px; color: var(--text-3); pointer-events: none; }
  input {
    width: 100%;
    height: 38px;
    padding: 0 64px 0 36px;
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    outline: none;
    color: var(--text);
    background: var(--surface-2);
    transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease), background var(--dur) var(--ease);
  }
  input:focus { border-color: var(--brand-500); background: var(--surface); box-shadow: 0 0 0 3px var(--brand-soft); }
  input::placeholder { color: var(--text-3); }
  kbd {
    position: absolute;
    right: 8px;
    padding: 2px 6px;
    border: 1px solid var(--border);
    border-radius: 5px;
    color: var(--text-3);
    background: var(--surface-3);
    font: 11px/1.35 inherit;
  }
}

.mobile-context, .mobile-search-trigger, .mobile-search-close { display: none; }

.writer-box {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 5px;

  .writer {
    width: 36px;
    height: 36px;
    border-radius: 11px;
    color: #ffffff;
    background: var(--enterprise-gradient);
    box-shadow: none;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    .writer-text {
      margin-left: 15px;
      font-size: 14px;
      font-weight: bold;;
    }
  }
}

.header-btn {
  display: none;
  align-items: center;
  height: 100%;
  min-width: 0;
}

@media (max-width: 767px) {
  .header { grid-template-columns: 38px minmax(0, 1fr) auto; gap: 6px; padding: 0 8px; }
  .header.not-send { grid-template-columns: 38px minmax(0, 1fr) auto; }
  .header.mobile-search-open, .header.not-send.mobile-search-open { grid-template-columns: 38px minmax(0, 1fr); }
  .header-btn { display: inline-flex; }
  .global-search { height: 38px; }
  .global-search:not(.open) .search-icon,
  .global-search:not(.open) input,
  .global-search kbd { display: none; }
  .mobile-context {
    width: 100%;
    min-width: 0;
    height: 38px;
    padding: 0 4px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    color: var(--text);
    text-align: left;
    cursor: pointer;
  }
  .mobile-context span { max-width: 100%; overflow: hidden; font-size: 13px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
  .mobile-context small { max-width: 100%; margin-top: 1px; overflow: hidden; color: var(--text-3); font-size: 9.5px; text-overflow: ellipsis; white-space: nowrap; }
  .global-search.open .mobile-context { display: none; }
  .global-search.open .search-icon { display: block; }
  .global-search.open input { display: block; padding-right: 34px; font-size: 12.5px; }
  .mobile-search-close { position: absolute; right: 7px; width: 28px; height: 28px; display: none; place-items: center; color: var(--text-3); border-radius: 7px; cursor: pointer; }
  .global-search.open .mobile-search-close { display: grid; }
  .header.mobile-search-open .toolbar { display: none; }
}

.breadcrumb-item {
  font-weight: 650;
  font-size: 15px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

@media (min-width: 768px) and (max-width: 1024px) {
  .header,
  .header.not-send { grid-template-columns: 38px minmax(240px, 560px) 1fr; }
  .header-btn { display: inline-flex; }
}

.toolbar {
  display: flex;
  justify-content: end;
  gap: 6px;
  @media (max-width: 767px) {
    gap: 2px;
  }

  .icon-item {
    align-self: center;
    width: 38px;
    height: 38px;
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    background: var(--surface);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .mobile-search-trigger { display: none; }

  .icon-item:hover {
    background: var(--surface-3);
  }

  .notice {
    font-size: 22px;
    margin-right: 4px;
  }

  .dark-icon {
    font-size: 20px;
  }

  .sun-icon {
    font-size: 24px;
  }

  .avatar {
    display: flex;
    align-items: center;
    cursor: pointer;

    .avatar-text {
      background: var(--el-bg-color);
      color: var(--el-text-color-primary);
      height: 30px;
      width: 30px;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 9px;
      border: 1px solid var(--el-border-color);
      font-weight: 650;
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
    }

    .setting-icon {
      position: relative;
      top: 0;
      margin-right: 10px;
      bottom: 10px;
    }

    .avatar-identity {
      min-width: 0;
      margin-left: 8px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      line-height: 1.2;
    }

    .avatar-identity strong { max-width: 110px; overflow: hidden; color: var(--text); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
    .avatar-identity span { margin-top: 2px; color: var(--text-3); font-size: 10.5px; }
  }

  @media (max-width: 767px) {
    .notice { margin-right: 0; }
    .mobile-search-trigger { display: flex; }
    .notice { display: none; }
    .avatar .setting-icon, .avatar .avatar-identity { display: none; }
    .icon-item { width: 34px; height: 34px; }
  }

}

.el-tooltip__trigger:first-child:focus-visible {
  outline: unset;
}
</style>
