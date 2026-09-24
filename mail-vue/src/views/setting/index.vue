<template>
  <div class="settings-page">
    <header class="settings-heading">
      <span class="heading-icon"><Icon icon="solar:settings-linear" width="24" height="24"/></span>
      <div>
        <h1>{{ settingStore.lang === 'zh' ? '个人设置' : 'Personal settings' }}</h1>
        <p>{{ settingStore.lang === 'zh' ? '管理账户资料、安全选项和界面语言' : 'Manage your profile, security and language preferences' }}</p>
      </div>
    </header>

    <div class="settings-grid">
      <section class="settings-card profile-card">
        <div class="card-title"><Icon icon="solar:user-circle-linear" width="20"/><div><strong>{{$t('profile')}}</strong><span>{{ settingStore.lang === 'zh' ? '企业邮箱身份信息' : 'Business mailbox identity' }}</span></div></div>
        <div class="profile-summary">
          <span class="profile-avatar">{{ userInitial }}</span>
          <div><strong>{{ userStore.user.name || userStore.user.email }}</strong><span>{{ userStore.user.email }}</span></div>
          <span class="status-badge">{{ settingStore.lang === 'zh' ? '正常' : 'Active' }}</span>
        </div>
        <div class="setting-row">
          <div class="row-copy"><strong>{{$t('username')}}</strong><span>{{ settingStore.lang === 'zh' ? '用于邮件发件人显示' : 'Shown as your sender name' }}</span></div>
          <div v-if="setNameShow" class="name-editor"><el-input v-model="accountName" @keyup.enter="setName"/><button type="button" @click="setName">{{$t('save')}}</button></div>
          <button v-else class="value-button" type="button" @click="showSetName"><span>{{ userStore.user.name }}</span><Icon icon="solar:pen-new-square-linear" width="16"/></button>
        </div>
        <div class="setting-row">
          <div class="row-copy"><strong>{{$t('emailAccount')}}</strong><span>{{ settingStore.lang === 'zh' ? '主登录邮箱，不可在此修改' : 'Primary sign-in email' }}</span></div>
          <span class="static-value">{{ userStore.user.email }}</span>
        </div>
      </section>

      <section class="settings-card">
        <div class="card-title"><Icon icon="solar:shield-keyhole-linear" width="20"/><div><strong>{{ settingStore.lang === 'zh' ? '安全与登录' : 'Security & sign-in' }}</strong><span>{{ settingStore.lang === 'zh' ? '保护你的邮箱账户' : 'Protect your mailbox account' }}</span></div></div>
        <div class="setting-row">
          <div class="row-copy"><strong>{{$t('password')}}</strong><span>••••••••</span></div>
          <button class="outline-button" type="button" @click="pwdShow = true"><Icon icon="solar:key-linear" width="17"/>{{$t('changePwdBtn')}}</button>
        </div>
        <div class="security-note"><Icon icon="solar:lock-password-linear" width="18"/><span>{{ settingStore.lang === 'zh' ? '密码更新后，其他设备上的登录会话可能需要重新验证。' : 'Other devices may need to sign in again after a password change.' }}</span></div>
      </section>

      <section class="settings-card">
        <div class="card-title"><Icon icon="solar:global-linear" width="20"/><div><strong>{{$t('language')}}</strong><span>{{ settingStore.lang === 'zh' ? '选择界面显示语言' : 'Choose the interface language' }}</span></div></div>
        <div class="language-options">
          <button type="button" :class="{active: langSelect === 'zh'}" @click="changeLang('zh')"><span>中</span><div><strong>简体中文</strong><small>Chinese</small></div><Icon v-if="langSelect === 'zh'" icon="solar:check-circle-bold" width="19"/></button>
          <button type="button" :class="{active: langSelect === 'en'}" @click="changeLang('en')"><span>EN</span><div><strong>English</strong><small>英语</small></div><Icon v-if="langSelect === 'en'" icon="solar:check-circle-bold" width="19"/></button>
        </div>
      </section>

      <section class="settings-card danger-card" v-perm="'my:delete'">
        <div class="card-title"><Icon icon="solar:danger-triangle-linear" width="20"/><div><strong>{{$t('deleteUser')}}</strong><span>{{ settingStore.lang === 'zh' ? '此操作无法撤销' : 'This action cannot be undone' }}</span></div></div>
        <p>{{$t('delAccountMsg')}}</p>
        <button class="danger-button" type="button" @click="deleteConfirm"><Icon icon="solar:trash-bin-trash-linear" width="17"/>{{$t('deleteUserBtn')}}</button>
      </section>
    </div>
    <el-dialog v-model="pwdShow" :title="$t('changePassword')" width="340">
      <div class="update-pwd">
        <el-input type="password" :placeholder="$t('newPassword')" v-model="form.password" autocomplete="off" @keyup.enter="submitPwd"/>
        <el-input type="password" :placeholder="$t('confirmPassword')" v-model="form.newPwd" autocomplete="off" @keyup.enter="submitPwd"/>
        <el-button type="primary" :loading="setPwdLoading" @click="submitPwd">{{$t('save')}}</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
import {reactive, ref, defineOptions, computed} from 'vue'
import {Icon} from '@iconify/vue'
import {resetPassword, userDelete} from "@/request/my.js";
import {useUserStore} from "@/store/user.js";
import router from "@/router/index.js";
import {accountSetName} from "@/request/account.js";
import {useAccountStore} from "@/store/account.js";
import {useI18n} from "vue-i18n";
import {useSettingStore} from "@/store/setting.js";

const { t } = useI18n()
const accountStore = useAccountStore()
const settingStore = useSettingStore()
const userStore = useUserStore();
const setPwdLoading = ref(false)
const setNameShow = ref(false)
const accountName = ref(null)
const langSelect = ref(settingStore.lang)
const userInitial = computed(() => (userStore.user.name || userStore.user.email || 'U').trim().charAt(0).toUpperCase())

defineOptions({
  name: 'setting'
})

function showSetName() {
  accountName.value = userStore.user.name
  setNameShow.value = true
}

function setName() {

  if (!accountName.value) {
    ElMessage({
      message: t('emptyUserNameMsg'),
      type: 'error',
      plain: true,
    })
    return;
  }

  setNameShow.value = false
  let name = accountName.value

  if (name === userStore.user.name) {
    return
  }

  userStore.user.name = accountName.value

  accountSetName(userStore.user.account.accountId,name).then(() => {
    ElMessage({
      message: t('saveSuccessMsg'),
      type: 'success',
      plain: true,
    })

    accountStore.changeUserAccountName = name

  }).catch(() => {
    userStore.user.name = name
  })
}

function changeLang(lang) {
  let setting = {}
  try {
    setting = JSON.parse(localStorage.getItem('setting') || '{}')
  } catch (e) {
    setting = {}
  }
  localStorage.setItem('setting', JSON.stringify({...setting, lang}))
  window.location.reload()
}

const pwdShow = ref(false)
const form = reactive({
  password: '',
  newPwd: '',
})

const deleteConfirm = () => {
  ElMessageBox.confirm(t('delAccountConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    userDelete().then(() => {
      localStorage.removeItem('token');
      router.replace('/login');
      ElMessage({
        message: t('delSuccessMsg'),
        type: 'success',
        plain: true,
      })
    })
  })
}


function submitPwd() {

  if (setPwdLoading.value) return

  if (!form.password) {
    ElMessage({
      message: t('emptyPwdMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (form.password.length < 6) {
    ElMessage({
      message: t('pwdLengthMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (form.password !== form.newPwd) {
    ElMessage({
      message: t('confirmPwdFailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  setPwdLoading.value = true
  resetPassword(form.password).then(() => {
    ElMessage({
      message: t('saveSuccessMsg'),
      type: 'success',
      plain: true,
    })
    pwdShow.value = false
    setPwdLoading.value = false
    form.password = ''
    form.newPwd = ''
  }).catch(() => {
    setPwdLoading.value = false
  })

}

</script>
<style scoped lang="scss">
.settings-page { height: 100%; overflow: auto; padding: 30px; color: var(--text); background: var(--surface-2); }
.settings-heading { max-width: 980px; margin: 0 auto 20px; display: flex; align-items: center; gap: 13px; }
.heading-icon { width: 44px; height: 44px; flex: 0 0 44px; display: grid; place-items: center; color: #fff; background: linear-gradient(145deg, var(--brand-500), var(--brand-700)); border-radius: 13px; box-shadow: 0 8px 18px color-mix(in srgb, var(--brand-600) 24%, transparent); }
.settings-heading h1 { margin: 0; font-size: 22px; line-height: 1.35; letter-spacing: -.3px; }
.settings-heading p { margin: 3px 0 0; color: var(--text-3); font-size: 12.5px; }
.settings-grid { max-width: 980px; margin: 0 auto; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.settings-card { min-width: 0; overflow: hidden; padding: 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); box-shadow: var(--sh-1); }
.profile-card { grid-column: 1 / -1; }
.card-title { display: flex; align-items: center; gap: 9px; margin-bottom: 16px; color: var(--brand-700); }
.card-title > div { display: grid; gap: 2px; }
.card-title strong { color: var(--text); font-size: 14px; }
.card-title span { color: var(--text-3); font-size: 11.5px; font-weight: 400; }
.profile-summary { min-width: 0; margin-bottom: 4px; padding: 14px; display: flex; align-items: center; gap: 11px; background: linear-gradient(135deg, var(--brand-soft), var(--surface-2)); border: 1px solid color-mix(in srgb, var(--brand-500) 17%, var(--border)); border-radius: var(--r-md); }
.profile-avatar { width: 40px; height: 40px; flex: 0 0 40px; display: grid; place-items: center; color: #fff; background: linear-gradient(135deg, #12a861, #0ea5e9); border-radius: 12px; font-size: 15px; font-weight: 800; }
.profile-summary > div { min-width: 0; display: grid; gap: 3px; }
.profile-summary strong, .profile-summary div span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.profile-summary strong { font-size: 13.5px; }
.profile-summary div span { color: var(--text-3); font-size: 11.5px; }
.status-badge { margin-left: auto; padding: 4px 8px; color: var(--success); background: color-mix(in srgb, var(--success) 10%, var(--surface)); border: 1px solid color-mix(in srgb, var(--success) 25%, var(--border)); border-radius: 999px; font-size: 10.5px; font-weight: 700; }
.setting-row { min-height: 68px; display: flex; align-items: center; justify-content: space-between; gap: 18px; border-bottom: 1px solid var(--border); }
.setting-row:last-child { border-bottom: 0; }
.row-copy { min-width: 0; display: grid; gap: 3px; }
.row-copy strong { font-size: 12.5px; }
.row-copy span { color: var(--text-3); font-size: 11.5px; }
.static-value { max-width: 55%; overflow: hidden; color: var(--text-2); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
button { font: inherit; }
.value-button, .outline-button, .danger-button, .name-editor button { border: 0; cursor: pointer; }
.value-button { max-width: 55%; display: flex; align-items: center; gap: 7px; padding: 7px 9px; color: var(--brand-700); background: var(--brand-soft); border-radius: 8px; }
.value-button span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.outline-button { min-height: 34px; display: inline-flex; align-items: center; gap: 7px; padding: 0 11px; color: var(--brand-700); background: var(--surface); border: 1px solid color-mix(in srgb, var(--brand-500) 35%, var(--border)); border-radius: 8px; font-size: 12px; font-weight: 650; }
.name-editor { width: min(280px, 55%); display: flex; align-items: center; gap: 7px; }
.name-editor button { height: 32px; padding: 0 10px; color: #fff; background: var(--brand-600); border-radius: 7px; }
.security-note { margin-top: 14px; padding: 11px; display: flex; gap: 8px; color: var(--text-2); background: var(--surface-2); border-radius: 9px; font-size: 11.5px; line-height: 1.55; }
.security-note svg { flex: 0 0 auto; color: var(--brand-600); }
.language-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
.language-options button { min-width: 0; height: 60px; display: grid; grid-template-columns: 34px minmax(0, 1fr) 20px; align-items: center; gap: 8px; padding: 8px; color: var(--text-2); background: var(--surface-2); border: 1px solid var(--border); border-radius: 10px; cursor: pointer; text-align: left; }
.language-options button.active { color: var(--brand-700); background: var(--brand-soft); border-color: color-mix(in srgb, var(--brand-500) 42%, var(--border)); }
.language-options button > span { width: 34px; height: 34px; display: grid; place-items: center; color: var(--brand-700); background: var(--surface); border-radius: 9px; font-size: 10.5px; font-weight: 800; }
.language-options button > div { min-width: 0; display: grid; gap: 2px; }
.language-options strong, .language-options small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.language-options strong { font-size: 12px; }
.language-options small { color: var(--text-3); font-size: 10.5px; }
.danger-card { border-color: color-mix(in srgb, #d14343 25%, var(--border)); }
.danger-card .card-title { color: #d14343; }
.danger-card p { min-height: 38px; margin: 0 0 12px; color: var(--text-3); font-size: 11.5px; line-height: 1.6; }
.danger-button { height: 34px; display: inline-flex; align-items: center; gap: 7px; padding: 0 11px; color: #c43737; background: color-mix(in srgb, #d14343 8%, var(--surface)); border: 1px solid color-mix(in srgb, #d14343 30%, var(--border)); border-radius: 8px; font-size: 12px; font-weight: 650; }
.update-pwd { display: flex; flex-direction: column; gap: 15px; }

@media (max-width: 767px) {
  .settings-page { padding: 18px 12px 86px; }
  .settings-heading { margin-bottom: 14px; }
  .settings-heading h1 { font-size: 19px; }
  .settings-grid { grid-template-columns: minmax(0, 1fr); gap: 12px; }
  .profile-card { grid-column: auto; }
  .settings-card { padding: 14px; border-radius: var(--r-md); }
  .setting-row { align-items: flex-start; flex-direction: column; gap: 8px; padding: 12px 0; }
  .value-button, .static-value, .name-editor { width: 100%; max-width: 100%; }
  .language-options { grid-template-columns: minmax(0, 1fr); }
}
</style>
