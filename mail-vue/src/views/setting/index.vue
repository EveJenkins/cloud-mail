<template>
  <el-dialog v-model="totpDialog" class="authenticator-dialog" align-center :close-on-click-modal="false"
             :close-on-press-escape="!totpBusy" :show-close="!totpBusy" @opened="totpInput?.focus()"
             @closed="totpSetup = null; totpQr = ''; totpCode = ''; totpError = ''; totpCopied = false">
    <template #header>
      <div class="authenticator-heading">
        <span class="authenticator-icon"><Icon icon="solar:shield-keyhole-linear" width="25"/></span>
        <div><span class="authenticator-eyebrow">{{ settingStore.lang === 'zh' ? '身份验证器' : 'Authenticator' }}</span><h2>{{ totpEnabled ? (settingStore.lang === 'zh' ? '关闭两步验证' : 'Disable two-step verification') : (settingStore.lang === 'zh' ? '保护你的账户' : 'Protect your account') }}</h2></div>
      </div>
    </template>
    <p class="authenticator-intro">{{ totpEnabled ? (settingStore.lang === 'zh' ? '输入当前动态验证码，确认解除验证器绑定。' : 'Enter your current code to unlink your authenticator.') : (settingStore.lang === 'zh' ? '只需两个步骤，为每次登录增加一层安全保护。' : 'Add an extra layer of security to every sign-in in two simple steps.') }}</p>
    <div v-if="totpSetup" class="authenticator-enrollment">
      <div class="authenticator-step"><span>1</span><div><strong>{{ settingStore.lang === 'zh' ? '添加到验证器' : 'Add to your authenticator' }}</strong><p>{{ settingStore.lang === 'zh' ? '打开应用，点击「＋」并扫描下方二维码' : 'Open the app, tap + and scan this QR code' }}</p></div></div>
      <div class="authenticator-qr"><img :src="totpQr" :alt="settingStore.lang === 'zh' ? '身份验证器二维码' : 'Authenticator QR code'" width="184" height="184"/><span><Icon icon="solar:scan-square-linear" width="14"/>{{ settingStore.lang === 'zh' ? '使用身份验证器扫描' : 'Scan with your authenticator' }}</span></div>
      <div class="authenticator-secret">
        <div class="authenticator-secret-label"><span>{{ settingStore.lang === 'zh' ? '无法扫码？手动输入密钥' : 'Unable to scan? Enter this setup key' }}</span><button type="button" @click="copyTotpSecret"><Icon :icon="totpCopied ? 'solar:check-circle-linear' : 'solar:copy-linear'" width="15"/>{{ totpCopied ? (settingStore.lang === 'zh' ? '已复制' : 'Copied') : (settingStore.lang === 'zh' ? '复制' : 'Copy') }}</button></div>
        <code>{{ totpSetup.secret.match(/.{1,4}/g)?.join(' ') }}</code>
      </div>
      <div class="authenticator-backup"><Icon icon="solar:info-circle-linear" width="16"/><span>{{ settingStore.lang === 'zh' ? '请安全备份密钥。手机丢失时，可用它恢复验证器。' : 'Keep this key somewhere safe to restore access if your phone is lost.' }}</span></div>
    </div>
    <form @submit.prevent="confirmTotp">
      <div class="authenticator-step"><span>{{ totpSetup ? '2' : '1' }}</span><div><label for="setup-totp-code">{{ settingStore.lang === 'zh' ? '输入动态验证码' : 'Enter your verification code' }}</label><p>{{ settingStore.lang === 'zh' ? '输入应用中显示的 6 位数字' : 'Enter the 6 digits shown in the app' }}</p></div></div>
      <el-input id="setup-totp-code" ref="totpInput" class="authenticator-code" :class="{ 'has-error': totpError }" v-model="totpCode" maxlength="6" inputmode="numeric" autocomplete="one-time-code" placeholder="000000" :disabled="totpBusy" :aria-invalid="!!totpError" aria-describedby="setup-totp-hint" @input="sanitizeTotpCode"/>
      <p id="setup-totp-hint" class="authenticator-code-hint" :class="{ 'has-error': totpError }" aria-live="polite">{{ totpError || (settingStore.lang === 'zh' ? '验证码每 30 秒更新一次' : 'A new code is generated every 30 seconds') }}</p>
      <div class="authenticator-actions"><el-button :disabled="totpBusy" @click="totpDialog = false">{{ settingStore.lang === 'zh' ? '取消' : 'Cancel' }}</el-button><el-button :type="totpEnabled ? 'danger' : 'primary'" native-type="submit" :loading="totpBusy" :disabled="totpCode.length !== 6"><Icon v-if="!totpBusy" :icon="totpEnabled ? 'solar:shield-cross-linear' : 'solar:shield-check-linear'" width="17"/>{{ totpEnabled ? (settingStore.lang === 'zh' ? '确认解绑' : 'Confirm disable') : (settingStore.lang === 'zh' ? '验证并启用' : 'Verify and enable') }}</el-button></div>
    </form>
  </el-dialog>
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
          <button v-else class="value-button" type="button" @click="showSetName"><span>{{ userStore.user.name || (settingStore.lang === 'zh' ? '设置显示名称' : 'Set display name') }}</span><Icon icon="solar:pen-new-square-linear" width="16"/></button>
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
        <div class="setting-row">
          <div class="row-copy"><strong>{{ settingStore.lang === 'zh' ? '身份验证器' : 'Authenticator' }}</strong><span>{{ totpEnabled ? (settingStore.lang === 'zh' ? '已启用两步验证' : 'Two-step verification enabled') : (settingStore.lang === 'zh' ? '未启用两步验证' : 'Two-step verification disabled') }}</span></div>
          <el-button :loading="totpBusy" @click="openTotp">{{ totpEnabled ? (settingStore.lang === 'zh' ? '解绑' : 'Disable') : (settingStore.lang === 'zh' ? '绑定' : 'Enable') }}</el-button>
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

      <section class="settings-card">
        <div class="card-title"><Icon icon="solar:chart-2-linear" width="20"/><div><strong>{{ settingStore.lang === 'zh' ? '外发配额' : 'Outbound quota' }}</strong><span>{{ settingStore.lang === 'zh' ? '本月邮件发送用量' : 'Messages sent this month' }}</span></div></div>
        <div class="quota-row">
          <div class="quota-head">
            <span>{{ settingStore.lang === 'zh' ? '本月外发配额' : 'Monthly outbound' }}</span>
            <span>{{ quotaText }}</span>
          </div>
          <div class="quota-track"><span :style="{ width: quotaPercent + '%' }" :class="{ warning: quotaPercent >= 80 }"></span></div>
          <p class="quota-foot" :class="{ warning: quotaPercent >= 80 }">
            <Icon :icon="quotaPercent >= 80 ? 'solar:danger-triangle-linear' : 'solar:check-circle-linear'" width="15" />
            <span>{{ quotaPercent >= 80 ? (settingStore.lang === 'zh' ? '即将达到上限，超出需联系管理员' : 'Near the limit, contact your administrator') : (settingStore.lang === 'zh' ? '运行正常' : 'Healthy') }}</span>
          </p>
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
import http from '@/axios/index.js';
const totpEnabled = ref(false);
const totpSetup = ref(null);
const totpDialog = ref(false);
const totpCode = ref('');
const totpBusy = ref(false);
const totpQr = ref('');
const totpInput = ref(null);
const totpCopied = ref(false);
const totpError = ref('');
function sanitizeTotpCode(value) {
 totpCode.value = value.replace(/\D/g, '').slice(0, 6);
 totpError.value = '';
}
async function copyTotpSecret() {
 try {
  await navigator.clipboard.writeText(totpSetup.value.secret);
  totpCopied.value = true;
 } catch {
  ElMessage.warning(settingStore.lang === 'zh' ? '无法访问剪贴板，请选择密钥手动复制' : 'Clipboard unavailable. Select the key and copy it manually.');
 }
}
http.get('/my/totp').then(data => { totpEnabled.value = data.enabled; });
async function openTotp() {
 if (totpBusy.value) return;
 totpBusy.value = true;
 try {
  totpCode.value = '';
  totpError.value = '';
  totpCopied.value = false;
  totpSetup.value = null;
  if (!totpEnabled.value) {
   totpSetup.value = await http.post('/my/totp/setup');
   const QRCode = await import('qrcode');
   totpQr.value = await QRCode.toDataURL(totpSetup.value.uri, {width: 220, margin: 4, errorCorrectionLevel: 'M'});
  }
  totpDialog.value = true;
 } finally { totpBusy.value = false; }
}
async function confirmTotp() {
 if (totpBusy.value || !/^\d{6}$/.test(totpCode.value)) return;
 totpBusy.value = true;
 try {
  await http.post(totpEnabled.value ? '/my/totp/disable' : '/my/totp/enable', {code:totpCode.value});
  totpEnabled.value = !totpEnabled.value;
  totpDialog.value = false;
  totpSetup.value = null;
  ElMessage.success(settingStore.lang === 'zh' ? (totpEnabled.value ? '两步验证已启用' : '两步验证已关闭') : (totpEnabled.value ? 'Two-step verification enabled' : 'Two-step verification disabled'));
 } catch (error) {
  totpError.value = error.message || (settingStore.lang === 'zh' ? '验证失败，请检查验证码后重试' : 'Verification failed. Check your code and try again.');
  totpCode.value = '';
 } finally { totpBusy.value = false; }
}

import {reactive, ref, defineOptions, computed} from 'vue'
import {Icon} from '@iconify/vue'
import {resetPassword, userDelete} from "@/request/my.js";
import {useUserStore} from "@/store/user.js";
import router from "@/router/index.js";
import {accountSetName} from "@/request/account.js";
import {useAccountStore} from "@/store/account.js";
import {useI18n} from "vue-i18n";
import {useSettingStore} from "@/store/setting.js";
import i18n from '@/i18n/index.js'
import {setExtend} from '@/utils/day.js'

const { t } = useI18n()
const accountStore = useAccountStore()
const settingStore = useSettingStore()
const userStore = useUserStore();
const setPwdLoading = ref(false)
const setNameShow = ref(false)
const accountName = ref(null)
const langSelect = ref(settingStore.lang)
const userInitial = computed(() => (userStore.user.name || userStore.user.email || 'U').trim().charAt(0).toUpperCase())

const quotaMax = computed(() => Number(userStore.user.role?.sendCount) || 0)
const quotaUsed = computed(() => Number(userStore.user.sendCount) || 0)
const quotaPercent = computed(() => quotaMax.value ? Math.min(100, Math.round(quotaUsed.value / quotaMax.value * 100)) : 0)
const quotaText = computed(() => quotaMax.value
  ? `${quotaUsed.value} / ${quotaMax.value}`
  : (settingStore.lang === 'zh' ? '不限' : 'Unlimited'))

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
  const name = accountName.value.trim()
  const previousName = userStore.user.name

  if (name === userStore.user.name) {
    return
  }

  userStore.user.name = name

  accountSetName(userStore.user.account.accountId,name).then(() => {
    ElMessage({
      message: t('saveSuccessMsg'),
      type: 'success',
      plain: true,
    })

    accountStore.changeUserAccountName = name

  }).catch(() => {
    userStore.user.name = previousName
    setNameShow.value = true
  })
}

function changeLang(lang) {
  if (lang === settingStore.lang) return
  settingStore.lang = lang
  langSelect.value = lang
  i18n.global.locale.value = lang
  setExtend(lang === 'en' ? 'en' : 'zh-cn')
  ElMessage({
    message: lang === 'zh' ? '界面语言已切换' : 'Interface language updated',
    type: 'success',
    plain: true,
  })
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
.settings-heading { max-width: 1180px; margin: 0 auto 20px; display: flex; align-items: center; gap: 13px; }
.heading-icon { width: 36px; height: 36px; flex: 0 0 36px; display: grid; place-items: center; color: #fff; background: var(--brand-600); border-radius: var(--r-md); }
.settings-heading h1 { margin: 0; font-size: 24px; line-height: 1.35; letter-spacing: -.3px; }
.settings-heading p { margin: 3px 0 0; color: var(--text-3); font-size: 12.5px; }
.settings-grid { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.settings-card { min-width: 0; overflow: hidden; padding: 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); box-shadow: var(--sh-1); }
.profile-card { grid-column: 1 / -1; }
.card-title { display: flex; align-items: center; gap: 9px; margin-bottom: 16px; color: var(--brand-700); }
.card-title > div { display: grid; gap: 2px; }
.card-title strong { color: var(--text); font-size: 14px; }
.card-title span { color: var(--text-3); font-size: 11.5px; font-weight: 400; }
.profile-summary { min-width: 0; margin-bottom: 4px; padding: 14px; display: flex; align-items: center; gap: 11px; background: linear-gradient(135deg, var(--brand-soft), var(--surface-2)); border: 1px solid color-mix(in srgb, var(--brand-500) 17%, var(--border)); border-radius: var(--r-md); }
.profile-avatar { width: 38px; height: 38px; flex: 0 0 38px; display: grid; place-items: center; color: #fff; background: var(--brand-600); border-radius: var(--r-md); font-size: 15px; font-weight: 600; }
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
.security-note { margin-top: 14px; padding: 11px; display: flex; gap: 8px; color: var(--text-2); background: var(--surface-2); border-radius: var(--r-md); font-size: 11.5px; line-height: 1.55; }
.security-note svg { flex: 0 0 auto; color: var(--brand-600); }
.language-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
.language-options button { min-width: 0; height: 52px; display: grid; grid-template-columns: 34px minmax(0, 1fr) 20px; align-items: center; gap: 8px; padding: 8px; color: var(--text-2); background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--r-md); cursor: pointer; text-align: left; }
.language-options button.active { color: var(--brand-700); background: var(--brand-soft); border-color: color-mix(in srgb, var(--brand-500) 42%, var(--border)); }
.language-options button > span { width: 34px; height: 34px; display: grid; place-items: center; color: var(--brand-700); background: var(--surface); border-radius: var(--r-md); font-size: 10.5px; font-weight: 800; }
.language-options button > div { min-width: 0; display: grid; gap: 2px; }
.language-options strong, .language-options small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.language-options strong { font-size: 12px; }
.language-options small { color: var(--text-3); font-size: 10.5px; }
.danger-card { border-color: color-mix(in srgb, var(--danger) 28%, var(--border)); }
.quota-row { display: grid; gap: 8px; }
.quota-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: var(--text-2); font-size: 12px; }
.quota-head span:last-child { color: var(--text-3); font-variant-numeric: tabular-nums; }
.quota-track { height: 6px; overflow: hidden; border-radius: 99px; background: var(--surface-3); }
.quota-track span { display: block; height: 100%; min-width: 4px; border-radius: inherit; background: var(--brand-600); transition: width var(--dur) var(--ease); }
.quota-track span.warning { background: var(--warning); }
.quota-foot { margin: 0; display: flex; align-items: center; gap: 6px; color: var(--success); font-size: 11.5px; }
.quota-foot.warning { color: var(--warning); }

.danger-card .card-title { color: var(--danger-text); }
.danger-card p { min-height: 38px; margin: 0 0 12px; color: var(--text-3); font-size: 11.5px; line-height: 1.6; }
.danger-button { height: 32px; display: inline-flex; align-items: center; gap: 6px; padding: 0 11px; color: var(--danger-text); background: color-mix(in srgb, var(--danger) 8%, var(--surface)); border: 1px solid color-mix(in srgb, var(--danger) 30%, var(--border)); border-radius: var(--r-md); font-size: 12px; font-weight: 500; }
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

<style>
.authenticator-dialog.el-dialog { width: min(460px, calc(100vw - 32px)); padding: 28px; border-radius: 22px; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 24px 80px rgba(15,23,42,.2); }
.authenticator-dialog .el-dialog__header { padding: 0 22px 0 0; }
.authenticator-dialog .el-dialog__headerbtn { top: 13px; right: 12px; }
.authenticator-dialog .el-dialog__body { padding: 0; }
.authenticator-dialog .authenticator-heading { display: flex; align-items: center; gap: 13px; }
.authenticator-dialog .authenticator-icon { display: grid; place-items: center; width: 50px; height: 50px; flex-shrink: 0; border-radius: 16px; color: var(--el-color-primary); background: var(--el-color-primary-light-9); border: 1px solid var(--el-color-primary-light-8); }
.authenticator-dialog .authenticator-eyebrow { font-size: 11px; color: var(--el-text-color-secondary); letter-spacing: .3px; }
.authenticator-dialog h2 { margin: 5px 0 0; font-size: 21px; line-height: 1.35; font-weight: 650; color: var(--el-text-color-primary); letter-spacing: -.4px; }
.authenticator-dialog .authenticator-intro { margin: 17px 0 24px; font-size: 12px; line-height: 1.7; color: var(--el-text-color-secondary); }
.authenticator-dialog .authenticator-step { display: flex; gap: 11px; align-items: flex-start; }
.authenticator-dialog .authenticator-step > span { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 8px; background: var(--el-color-primary-light-9); color: var(--el-color-primary); font-size: 12px; font-weight: 600; flex-shrink: 0; }
.authenticator-dialog .authenticator-step strong, .authenticator-dialog .authenticator-step label { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); line-height: 24px; }
.authenticator-dialog .authenticator-step p { margin: 3px 0 0; font-size: 11px; line-height: 1.6; color: var(--el-text-color-secondary); }
.authenticator-dialog .authenticator-qr { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 16px 0 18px; }
.authenticator-dialog .authenticator-qr img { display: block; width: 184px; height: 184px; padding: 4px; background: white; border-radius: 12px; border: 1px solid #e8edf3; box-sizing: content-box; }
.authenticator-dialog .authenticator-qr > span { display: flex; align-items: center; gap: 6px; font-size: 10px; color: var(--el-text-color-secondary); }
.authenticator-dialog .authenticator-secret { padding: 12px 14px; border: 1px solid var(--el-border-color-lighter); border-radius: 10px; background: var(--el-fill-color-light); }
.authenticator-dialog .authenticator-secret-label { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 10px; color: var(--el-text-color-secondary); }
.authenticator-dialog .authenticator-secret button { display: inline-flex; align-items: center; gap: 4px; border: 0; background: transparent; padding: 2px; color: var(--el-color-primary); font: inherit; cursor: pointer; flex-shrink: 0; }
.authenticator-dialog .authenticator-secret code { display: block; margin-top: 9px; font-family: ui-monospace, Consolas, monospace; font-size: 12px; line-height: 1.8; letter-spacing: .6px; color: var(--el-text-color-primary); overflow-wrap: anywhere; user-select: all; }
.authenticator-dialog .authenticator-backup { display: flex; gap: 7px; align-items: flex-start; margin: 12px 0 23px; font-size: 10px; line-height: 1.7; color: var(--el-text-color-secondary); }
.authenticator-dialog .authenticator-backup svg { flex-shrink: 0; margin-top: 1px; color: var(--el-color-primary); }
.authenticator-dialog .authenticator-code { margin-top: 14px; }
.authenticator-dialog .authenticator-code .el-input__wrapper { height: 54px; border-radius: 11px; background: var(--el-fill-color-blank); }
.authenticator-dialog .authenticator-code .el-input__inner { text-align: center; font-family: ui-monospace, Consolas, monospace; font-size: 26px; font-weight: 600; letter-spacing: 14px; padding-left: 14px; }
.authenticator-dialog .authenticator-code .el-input__inner::placeholder { color: var(--el-text-color-placeholder); opacity: .5; }
.authenticator-dialog .authenticator-code.has-error .el-input__wrapper { box-shadow: 0 0 0 1px var(--el-color-danger) inset; }
.authenticator-dialog .authenticator-code-hint { margin: 9px 0 21px; font-size: 10px; line-height: 1.6; color: var(--el-text-color-secondary); }
.authenticator-dialog .authenticator-code-hint.has-error { color: var(--el-color-danger); }
.authenticator-dialog .authenticator-actions { display: flex; gap: 10px; padding-top: 18px; border-top: 1px solid var(--el-border-color-lighter); }
.authenticator-dialog .authenticator-actions .el-button { height: 42px; border-radius: 10px; margin: 0; }
.authenticator-dialog .authenticator-actions .el-button:first-child { flex: 1; }
.authenticator-dialog .authenticator-actions .el-button:last-child { flex: 2; }
.authenticator-dialog .authenticator-actions .el-button span { gap: 7px; }
.authenticator-dialog button:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 3px; }
@media (max-width: 480px) { .authenticator-dialog.el-dialog { padding: 22px; } .authenticator-dialog h2 { font-size: 19px; } }
</style>
