<template>
  <el-dialog :model-value="!!totpChallenge" class="totp-login-dialog" :close-on-click-modal="false" :close-on-press-escape="!totpLoading" :show-close="!totpLoading" align-center @opened="totpInput?.focus()" @close="totpChallenge = ''">
    <template #header><span class="totp-eyebrow"><Icon icon="solar:shield-check-linear" width="15"/>{{ settingStore.lang === 'zh' ? '账户安全验证' : 'ACCOUNT VERIFICATION' }}</span></template>
    <div class="totp-panel">
      <div class="totp-emblem"><Icon icon="solar:shield-keyhole-linear" width="32"/></div>
      <h2>{{ settingStore.lang === 'zh' ? '两步验证' : 'Two-step verification' }}</h2>
      <p class="totp-description">{{ settingStore.lang === 'zh' ? '打开 Google Authenticator，输入当前的动态验证码，完成安全登录。' : 'Open Google Authenticator and enter your current code to securely sign in.' }}</p>
      <form @submit.prevent="submitTotp">
        <label class="totp-label" for="login-totp-code">{{ settingStore.lang === 'zh' ? '6 位动态验证码' : '6-digit verification code' }}</label>
        <el-input id="login-totp-code" ref="totpInput" v-model="totpCode" class="totp-code-input" :class="{ 'has-error': totpError }" maxlength="6" inputmode="numeric" autocomplete="one-time-code" placeholder="000000" :disabled="totpLoading" :aria-invalid="!!totpError" aria-describedby="totp-code-hint" @input="sanitizeTotpCode"/>
        <div id="totp-code-hint" class="totp-hint" :class="{ 'has-error': totpError }" aria-live="polite"><Icon :icon="totpError ? 'solar:info-circle-linear' : 'solar:clock-circle-linear'" width="15"/><span>{{ totpError || (settingStore.lang === 'zh' ? '验证码每 30 秒更新，请使用当前显示的验证码' : 'Codes refresh every 30 seconds. Use the current code.') }}</span></div>
        <el-button class="totp-submit" type="primary" native-type="submit" :loading="totpLoading" :disabled="totpCode.length !== 6">{{ settingStore.lang === 'zh' ? '验证并登录' : 'Verify and sign in' }}<Icon v-if="!totpLoading" icon="solar:arrow-right-linear" width="18"/></el-button>
      </form>
      <button class="totp-back" type="button" :disabled="totpLoading" @click="totpChallenge = ''"><Icon icon="solar:arrow-left-linear" width="16"/>{{ settingStore.lang === 'zh' ? '返回登录' : 'Back to sign in' }}</button>
      <div class="totp-footer"><Icon icon="solar:lock-keyhole-linear" width="14"/><span>{{ settingStore.lang === 'zh' ? '两步验证为你的账户多加一层保护' : 'An extra layer of protection for your account' }}</span></div>
    </div>
  </el-dialog>
  <div id="login-box" :style=" background ? 'background: var(--el-bg-color)' : ''" v-loading="oauthLoading" :element-loading-text="$t('loggingIn')">
    <div class="login-backdrop" :class="{ 'custom-backdrop': settingStore.settings.background }" :style="background"></div>
    <div class="form-wrapper">
      <div class="container">
        <div class="form-brand">
          <div class="brand-mark"><Icon icon="mdi:email-outline" width="22" height="22" /></div>
          <div class="brand-copy">
            <strong>{{ settingStore.settings.title || (settingStore.lang === 'zh' ? '企业邮箱' : 'Mail') }}</strong>
            <span>{{ $t('brandSlogan') }}</span>
          </div>
        </div>
        <div class="form-tabs" v-if="settingStore.settings.register === 0">
          <button type="button" :class="{ active: show === 'login' }" @click="show = 'login'">{{ $t('loginBtn') }}</button>
          <button type="button" :class="{ active: show !== 'login' }" @click="show = 'register'">{{ $t('regBtn') }}</button>
        </div>
        <span class="form-title">{{ show === 'login' ? $t('loginHeadline') : $t('regTitle') }}</span>
        <span class="form-desc" v-if="show === 'login'">{{ $t('loginSubtitle') }}</span>
        <span class="form-desc" v-else>{{ $t('regTitle') }}</span>
        <div v-show="show === 'login'">
          <label class="field-label">{{ settingStore.lang === 'zh' ? '企业邮箱' : 'Corporate email' }}</label>
          <el-input :class="!hideLoginDomain ? 'email-input' : ''" v-model="form.email"
                    type="text" :placeholder="$t('emailAccount')" autocomplete="off" @keyup.enter="submit">
            <template #append v-if="!hideLoginDomain">
              <div @click.stop="openSelect">
                <el-select
                    v-if="show === 'login'"
                    ref="mySelect"
                    v-model="suffix"
                    :placeholder="$t('select')"
                    class="select"
                >
                  <el-option
                      v-for="item in domainList"
                      :key="item"
                      :label="item"
                      :value="item"
                  />
                </el-select>
                <div style="color: var(--el-text-color-primary)">
                  <span>{{ suffix }}</span>
                  <Icon class="setting-icon" icon="mingcute:down-small-fill" width="20" height="20"/>
                </div>
              </div>
            </template>
          </el-input>
          <label class="field-label">{{ $t('password') }}</label>
          <el-input v-model="form.password" :placeholder="$t('password')" type="password" autocomplete="off" @keyup.enter="submit">
          </el-input>
          <el-button class="btn" type="primary" @click="submit" :loading="loginLoading"
          >{{ $t('loginBtn') }} <Icon icon="solar:arrow-right-linear" width="17" />
          </el-button>
          <el-button v-for="p in oauthProviders" :key="p.key" class="btn" style="margin-top: 10px" @click="oauthLogin(p.key)">
            <el-avatar v-if="p.iconType === 'image'" :src="p.icon" :size="18" style="margin-right: 10px" />
            <Icon v-else :icon="p.icon" width="18" height="18" style="margin-right: 10px" />
            {{ p.label }}
          </el-button>
          <div class="enterprise-note">
            <Icon icon="solar:info-circle-linear" width="16" />
            <span>{{ $t('adminNote') }}</span>
          </div>
        </div>
        <div v-show="show !== 'login'">
          <el-input :class="!hideLoginDomain ? 'email-input' : ''" v-model="registerForm.email" type="text" :placeholder="$t('emailAccount')"
                    autocomplete="off" @keyup.enter="submitRegister">
            <template #append v-if="!hideLoginDomain">
              <div @click.stop="openSelect">
                <el-select
                    v-if="show !== 'login'"
                    ref="mySelect"
                    v-model="suffix"
                    :placeholder="$t('select')"
                    class="select"
                >
                  <el-option
                      v-for="item in domainList"
                      :key="item"
                      :label="item"
                      :value="item"
                  />
                </el-select>
                <div>
                  <span>{{ suffix }}</span>
                  <Icon class="setting-icon" icon="mingcute:down-small-fill" width="20" height="20"/>
                </div>
              </div>
            </template>
          </el-input>
          <el-input v-model="registerForm.password" :placeholder="$t('password')" type="password" autocomplete="off" @keyup.enter="submitRegister"/>
          <el-input v-model="registerForm.confirmPassword" :placeholder="$t('confirmPwd')" type="password"
                    autocomplete="off" @keyup.enter="submitRegister"/>
          <el-input v-if="settingStore.settings.regKey === 0" v-model="registerForm.code" :placeholder="$t('regKey')"
                    type="text" autocomplete="off" @keyup.enter="submitRegister"/>
          <el-input v-if="settingStore.settings.regKey === 2" v-model="registerForm.code"
                    :placeholder="$t('regKeyOptional')" type="text" autocomplete="off" @keyup.enter="submitRegister"/>
          <div v-show="verifyShow"
               class="register-turnstile"
               :data-sitekey="settingStore.settings.siteKey"
               data-callback="onTurnstileSuccess"
               data-error-callback="onTurnstileError"
               data-after-interactive-callback="loadAfter"
               data-before-interactive-callback="loadBefore"
          >
            <span style="font-size: 12px;color: var(--danger)" v-if="botJsError">{{ $t('verifyModuleFailed') }}</span>
          </div>
          <el-button class="btn" style="margin: 0" type="primary" @click="submitRegister" :loading="registerLoading"
          >{{ $t('regBtn') }}
          </el-button>
          <el-button v-for="p in oauthProviders" :key="p.key" class="btn" style="margin-top: 10px" @click="oauthLogin(p.key)">
            <el-avatar v-if="p.iconType === 'image'" :src="p.icon" :size="18" style="margin-right: 10px" />
            <Icon v-else :icon="p.icon" width="18" height="18" style="margin-right: 10px" />
            {{ p.label }}
          </el-button>
        </div>
      </div>
    </div>
    <el-dialog class="bind-dialog" v-model="showBindForm"  :title="settingStore.lang === 'zh' ? '绑定邮箱' : 'Bind mailbox'" >
      <div class="bind-container">
        <el-input :class="!hideLoginDomain ? 'email-input' : ''" v-model="bindForm.email" type="text" :placeholder="$t('emailAccount')" autocomplete="off" @keyup.enter="bind">
          <template #append v-if="!hideLoginDomain">
            <div @click.stop="openSelect">
              <el-select
                  ref="mySelect"
                  v-model="suffix"
                  :placeholder="$t('select')"
                  class="select"
              >
                <el-option
                    v-for="item in domainList"
                    :key="item"
                    :label="item"
                    :value="item"
                />
              </el-select>
              <div>
                <span>{{ suffix }}</span>
                <Icon class="setting-icon" icon="mingcute:down-small-fill" width="20" height="20"/>
              </div>
            </div>
          </template>
        </el-input>
        <el-input v-if="settingStore.settings.regKey === 0" v-model="bindForm.code" :placeholder="$t('regKey')"
                  type="text" autocomplete="off" @keyup.enter="bind"/>
        <el-input v-if="settingStore.settings.regKey === 2" v-model="bindForm.code"
                  :placeholder="$t('regKeyOptional')" type="text" autocomplete="off" @keyup.enter="bind"/>
        <el-button class="btn" type="primary" @click="bind" :loading="bindLoading"
        >绑定
        </el-button>
      </div>
    </el-dialog>
    <a v-show="settingStore.settings.projectLink" class="github" href="https://github.com/maillab/cloud-mail">
      <Icon icon="mingcute:github-line" color="var(--text-3)" width="20" height="20" />
    </a>
  </div>
</template>

<script setup>
import router from "@/router";
import {useRoute} from "vue-router";
import {computed, nextTick, reactive, ref} from "vue";
import {verifyLoginTotp} from "@/request/login.js";
import {login} from "@/request/login.js";
import {register} from "@/request/login.js";
import {websiteConfig} from "@/request/setting.js";
import {isEmail} from "@/utils/verify-utils.js";
import {useSettingStore} from "@/store/setting.js";
import {useAccountStore} from "@/store/account.js";
import {useUserStore} from "@/store/user.js";
import {useUiStore} from "@/store/ui.js";
import {Icon} from "@iconify/vue";
import {cvtR2Url} from "@/utils/convert.js";
import {loginUserInfo} from "@/request/my.js";
import {permsToRouter} from "@/perm/perm.js";
import {useI18n} from "vue-i18n";
import {oauthBindUser, oauthLinuxDoLogin, oauthGithubLogin, oauthGoogleLogin} from "@/request/ouath.js";

const {t} = useI18n();
const accountStore = useAccountStore();
const userStore = useUserStore();
const uiStore = useUiStore();
const settingStore = useSettingStore();
const route = useRoute();
const totpChallenge = ref('');
const totpCode = ref('');
const totpLoading = ref(false);
const totpInput = ref(null);
const totpError = ref('');
function sanitizeTotpCode(value) {
 totpCode.value = value.replace(/\D/g, '').slice(0, 6);
 totpError.value = '';
}
async function submitTotp() {
 if (totpLoading.value || !/^\d{6}$/.test(totpCode.value)) return;
 totpLoading.value = true;
 try {
  totpError.value = '';
  const data = await verifyLoginTotp(totpChallenge.value, totpCode.value);
  await saveToken(data.token);
 } catch (error) {
  totpError.value = error.message || (settingStore.lang === 'zh' ? '验证未完成，请检查验证码后重试' : 'Verification failed. Check your code and try again.');
  totpCode.value = '';
 }
 finally { totpLoading.value = false; }
}
const loginLoading = ref(false)
const bindLoading = ref(false)
const oauthLoading = ref(false);
const showBindForm = ref(false);
const show = ref('login')

const oauthKeys = ['linuxdo', 'github', 'google']

const oauthProvider = computed(() => {
  const fromState = route.query.state
  if (oauthKeys.includes(fromState)) return fromState
  const fromStore = sessionStorage.getItem('oauthProvider')
  return oauthKeys.includes(fromStore) ? fromStore : null
})

const oauthProviders = computed(() => {
  const allProviders = [
    { key: 'google', label: 'Google', icon: 'devicon:google', iconType: 'iconify' },
    { key: 'github', label: 'GitHub', icon: 'codicon:github-inverted', iconType: 'iconify' },
    { key: 'linuxdo', label: 'LinuxDo', icon: '/image/linuxdo.webp', iconType: 'image' },
  ]
  return allProviders.filter(p => settingStore.settings[p.key + 'Switch'] === 0)
})

const bindForm = reactive({
  email: '',
  oauthUserId: '',
  code: ''
})

const form = reactive({
  email: '',
  password: '',

});
const mySelect = ref()
const suffix = ref('')
const registerForm = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  code: null
})
const domainList = settingStore.domainList;
const registerLoading = ref(false)
suffix.value = domainList[0]
const verifyShow = ref(false)
let verifyToken = ''
let turnstileId = null
let botJsError = ref(false)
let verifyErrorCount = 0

window.onTurnstileSuccess = (token) => {
  verifyToken = token;
};

window.onTurnstileError = (e) => {
  if (verifyErrorCount >= 4) {
    return
  }
  verifyErrorCount++
  console.warn('人机验加载失败', e)
  setTimeout(() => {
    nextTick(() => {
      if (!turnstileId) {
        turnstileId = window.turnstile.render('.register-turnstile')
      } else {
        window.turnstile.reset(turnstileId);
      }
    })
  }, 1500)
};

window.loadAfter = (e) => {
  console.log('loadAfter')
}

window.loadBefore = (e) => {
  console.log('loadBefore')
}

const loginOpacity = computed(() => {
  const opacity = settingStore.settings.loginOpacity
  return uiStore.dark ? `rgba(0, 0, 0, ${opacity})` : `rgba(255, 255, 255, ${opacity})`
})

const hideLoginDomain = computed(() => settingStore.settings.loginDomain === 1)

const background = computed(() => {

  return settingStore.settings.background ? {
    'background-image': `url(${cvtR2Url(settingStore.settings.background)})`,
    'background-repeat': 'no-repeat',
    'background-size': 'cover',
    'background-position': 'center'
  } : ''
})

const openSelect = () => {
  mySelect.value.toggleMenu()
}

const getFullEmail = (email) => {
  return hideLoginDomain.value ? email : email + suffix.value
}

const getEmailName = (email) => {
  return email.split('@')[0]
}

function oauthLogin(provider) {
  const clientId = settingStore.settings[provider + 'ClientId']
  const redirectUri = encodeURIComponent(window.location.origin + '/login')
  sessionStorage.setItem('oauthProvider', provider)
  const authorizeUrls = {
    linuxdo: `https://connect.linux.do/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid+profile+email&state=${provider}`,
    github: `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email&state=${provider}`,
    google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid+profile+email&state=${provider}`,
  }
  window.location.href = authorizeUrls[provider]
}

const loginFns = {
  linuxdo: oauthLinuxDoLogin,
  github: oauthGithubLogin,
  google: oauthGoogleLogin,
}

oauthGetUser();

async function oauthGetUser() {

  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  if (!code || !oauthProvider.value) return

  const provider = oauthProvider.value
  oauthLoading.value = true
  sessionStorage.removeItem('oauthProvider')
  window.history.replaceState({}, '', window.location.origin + window.location.pathname)

  loginFns[provider](code, window.location.origin + '/login').then(data => {

    bindForm.oauthUserId = data.userInfo.oauthUserId;

    if (!data.token) {
      showBindForm.value = true
      oauthLoading.value = false
      ElMessage({
        message: '请注册绑定一个邮箱',
        type: 'warning',
        duration: 4000,
        plain: true,
      })
      return;
    }

    saveToken(data.token);
  }).catch(() => {
    oauthLoading.value = false
  })
}

function bind() {

  if (bindLoading.value) return

  if (!bindForm.email) {
    ElMessage({
      message: t('emptyEmailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }


  if (getEmailName(bindForm.email).length < settingStore.settings.minEmailPrefix) {
    ElMessage({
      message: t('minEmailPrefix', {msg: settingStore.settings.minEmailPrefix}),
      type: 'error',
      plain: true,
    })
    return
  }

  let email = getFullEmail(bindForm.email);


  if (!isEmail(email)) {
    ElMessage({
      message: t('notEmailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (settingStore.settings.regKey === 0) {

    if (!bindForm.code) {

      ElMessage({
        message: t('emptyRegKeyMsg'),
        type: 'error',
        plain: true,
      })
      return
    }

  }

  const form = {email, oauthUserId: bindForm.oauthUserId, code: bindForm.code}

  bindLoading.value = true
  oauthBindUser(form).then(data => {
    saveToken(data.token)
  }).catch(() => {
    bindLoading.value = false
  })
}

const submit = () => {

  if (loginLoading.value) return

  if (!form.email) {
    ElMessage({
      message: t('emptyEmailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  let email = getFullEmail(form.email);

  if (!isEmail(email)) {
    ElMessage({
      message: t('notEmailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (!form.password) {
    ElMessage({
      message: t('emptyPwdMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  loginLoading.value = true
  login(email, form.password).then(async data => {
    await saveToken(data.token)
  }).finally(() => {
    loginLoading.value = false
  })
}

async function saveToken(token) {
  if (token?.requiresTotp) {
    totpChallenge.value = token.challenge;
    totpCode.value = '';
    totpError.value = '';
    oauthLoading.value = false;
    bindLoading.value = false;
    return;
  }
  localStorage.setItem('token', token)
  refreshWebsiteConfig()
  const user = await loginUserInfo(accountStore.preferredAccountId);
  accountStore.selectAccount(user.selectedAccount || user.account);
  userStore.user = user;
  const routers = permsToRouter(user.permKeys);
  routers.forEach(routerData => {
    router.addRoute('layout', routerData);
  });
  await router.replace({name: 'layout'})
  uiStore.showNotice()
  oauthLoading.value = false;
  bindLoading.value = false;
}

function refreshWebsiteConfig() {
  websiteConfig().then(setting => {
    settingStore.settings = setting
    settingStore.domainList = setting.domainList
    if (!suffix.value && setting.domainList.length > 0) {
      suffix.value = setting.domainList[0]
    }
    document.title = setting.title
  }).catch(e => {
    console.error(e)
  })
}


function submitRegister() {

  if (registerLoading.value) return

  if (!registerForm.email) {
    ElMessage({
      message: t('emptyEmailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  console.log(registerForm.email)

  if (getEmailName(registerForm.email).length < settingStore.settings.minEmailPrefix) {
    ElMessage({
      message: t('minEmailPrefix', {msg: settingStore.settings.minEmailPrefix}),
      type: 'error',
      plain: true,
    })
    return
  }

  const email = getFullEmail(registerForm.email);

  if (!isEmail(email)) {
    ElMessage({
      message: t('notEmailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (!registerForm.password) {
    ElMessage({
      message: t('emptyPwdMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (registerForm.password.length < 6) {
    ElMessage({
      message: t('pwdLengthMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (registerForm.password !== registerForm.confirmPassword) {

    ElMessage({
      message: t('confirmPwdFailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (settingStore.settings.regKey === 0) {

    if (!registerForm.code) {

      ElMessage({
        message: t('emptyRegKeyMsg'),
        type: 'error',
        plain: true,
      })
      return
    }

  }

  if (!verifyToken && (settingStore.settings.registerVerify === 0 || (settingStore.settings.registerVerify === 2 && settingStore.settings.regVerifyOpen))) {
    if (!verifyShow.value) {
      verifyShow.value = true
      nextTick(() => {
        if (!turnstileId) {
          try {
            turnstileId = window.turnstile.render('.register-turnstile')
          } catch (e) {
            botJsError.value = true
            console.log('人机验证js加载失败')
          }
        } else {
          window.turnstile.reset('.register-turnstile')
        }
      })
    } else if (!botJsError.value) {
      ElMessage({
        message: t('botVerifyMsg'),
        type: "error",
        plain: true
      })
    }
    return;
  }

  registerLoading.value = true

  const form = {
    email,
    password: registerForm.password,
    token: verifyToken,
    code: registerForm.code
  }

  register(form).then(({regVerifyOpen}) => {
    show.value = 'login'
    registerForm.email = ''
    registerForm.password = ''
    registerForm.confirmPassword = ''
    registerForm.code = ''
    registerLoading.value = false
    verifyToken = ''
    settingStore.settings.regVerifyOpen = regVerifyOpen
    verifyShow.value = false
    ElMessage({
      message: t('regSuccessMsg'),
      type: 'success',
      plain: true,
    })
  }).catch(res => {

    registerLoading.value = false

    if (res.code === 400) {
      verifyToken = ''
      settingStore.settings.regVerifyOpen = true
      if (turnstileId) {
        window.turnstile.reset(turnstileId)
      } else {
        nextTick(() => {
          turnstileId = window.turnstile.render('.register-turnstile')
        })
      }
      verifyShow.value = true

    }
  });
}

</script>


<style>

.totp-login-dialog.el-dialog { width: min(420px, calc(100vw - 32px)); padding: 24px 28px 0; border: 1px solid var(--el-border-color-lighter); border-radius: 24px; box-shadow: 0 24px 80px rgba(15,23,42,.2); overflow: hidden; }
.totp-login-dialog .el-dialog__header { padding: 0 24px 0 0; margin: 0; }
.totp-login-dialog .el-dialog__headerbtn { top: 12px; right: 12px; }
.totp-login-dialog .el-dialog__body { padding: 0; }
.totp-login-dialog .totp-eyebrow { display: inline-flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 600; letter-spacing: 1px; color: var(--el-text-color-secondary); }
.totp-login-dialog .totp-panel { text-align: center; padding-top: 26px; }
.totp-login-dialog .totp-emblem { display: grid; place-items: center; width: 68px; height: 68px; margin: 0 auto 18px; border-radius: 22px; color: var(--el-color-primary); background: var(--el-color-primary-light-9); border: 1px solid var(--el-color-primary-light-7); }
.totp-login-dialog h2 { margin: 0 0 10px; font-size: 25px; font-weight: 650; letter-spacing: -.5px; color: var(--el-text-color-primary); }
.totp-login-dialog .totp-description { margin: 0 auto 26px; max-width: 310px; color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.8; }
.totp-login-dialog .totp-label { display: block; margin-bottom: 10px; text-align: left; color: var(--el-text-color-primary); font-weight: 500; font-size: 12px; }
.totp-login-dialog .totp-code-input .el-input__wrapper { height: 62px; border-radius: 12px; padding: 0 12px; background: var(--el-fill-color-blank); }
.totp-login-dialog .totp-code-input .el-input__inner { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 28px; font-weight: 600; letter-spacing: 12px; padding-left: 12px; text-align: center; font-variant-numeric: tabular-nums; }
.totp-login-dialog .totp-code-input .el-input__inner::placeholder { color: var(--el-text-color-placeholder); opacity: .5; }
.totp-login-dialog .totp-code-input.has-error .el-input__wrapper { box-shadow: 0 0 0 1px var(--el-color-danger) inset; }
.totp-login-dialog .totp-hint { display: flex; align-items: flex-start; gap: 6px; text-align: left; margin: 12px 0 24px; min-height: 34px; font-size: 11px; line-height: 1.6; color: var(--el-text-color-secondary); }
.totp-login-dialog .totp-hint svg { flex-shrink: 0; margin-top: 1px; }
.totp-login-dialog .totp-hint.has-error { color: var(--el-color-danger); }
.totp-login-dialog .totp-submit { width: 100%; height: 46px; border-radius: 12px; font-size: 14px; font-weight: 600; }
.totp-login-dialog .totp-submit span { gap: 10px; }
.totp-login-dialog .totp-back { display: inline-flex; align-items: center; gap: 6px; background: none; border: 0; padding: 0; margin: 18px 0 24px; font: inherit; font-size: 12px; color: var(--el-text-color-secondary); cursor: pointer; }
.totp-login-dialog .totp-back:hover { color: var(--el-color-primary); }
.totp-login-dialog .totp-back:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 4px; border-radius: 3px; }
.totp-login-dialog .totp-back:disabled { cursor: wait; opacity: .5; }
.totp-login-dialog .totp-footer { display: flex; justify-content: center; align-items: center; gap: 6px; margin: 0 -28px; padding: 16px 20px; border-top: 1px solid var(--el-border-color-lighter); background: var(--el-fill-color-light); color: var(--el-text-color-secondary); font-size: 10px; }
@media (max-width: 400px) {
 .totp-login-dialog.el-dialog { padding: 20px 20px 0; }
 .totp-login-dialog .totp-footer { margin: 0 -20px; }
 .totp-login-dialog .totp-code-input .el-input__inner { letter-spacing: 9px; padding-left: 9px; }
}

.el-select-dropdown__item {
  padding: 0 15px;
}

.no-autofill-pwd {
  .el-input__inner {
    -webkit-text-security: disc !important;
  }
}
</style>

<style lang="scss" scoped>

.form-wrapper {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow-y: auto;
}

.container {
  background: v-bind(loginOpacity);
  padding: 32px 32px 28px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: min(400px, 100%);
  height: auto;
  min-height: 0;
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  box-shadow: var(--sh-3);
  backdrop-filter: blur(18px) saturate(130%);
  @media (max-width: 767px) {
    padding: 24px 20px 20px;
    width: 100%;
  }

  .btn {
    height: 40px;
    width: 100%;
    border-radius: var(--r-md);
    font-weight: 500;
  }

  .form-desc {
    margin-top: 6px;
    margin-bottom: 22px;
    color: var(--form-desc-color);
    font-size: 12.5px;
  }

  .form-title {
    font-weight: 600;
    font-size: 19px !important;
    letter-spacing: -.2px;
  }

  :deep(.el-input__wrapper) {
    border-radius: var(--r-md);
    background: var(--el-bg-color);
    box-shadow: 0 0 0 1px var(--el-border-color) inset;
  }

  .email-input :deep(.el-input__wrapper) {
    border-radius: var(--r-md) 0 0 var(--r-md);
    background: var(--el-bg-color);
  }

  .el-input {
    height: 40px;
    width: 100%;
    margin-bottom: 14px;

    :deep(.el-input__inner) {
      height: 38px;
    }
  }
}

.form-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 22px; }
.form-brand .brand-mark { width: 38px; height: 38px; flex: none; display: grid; place-items: center; color: #fff; border-radius: var(--r-md); background: var(--brand-600); }
.form-brand .brand-copy { min-width: 0; display: flex; flex-direction: column; }
.form-brand .brand-copy strong { overflow: hidden; color: var(--text); font-size: 15px; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; }
.form-brand .brand-copy span { margin-top: 2px; color: var(--text-3); font-size: 11.5px; }

.form-tabs {
  margin-bottom: 20px;
  padding: 3px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px;
  border-radius: var(--r-md);
  background: var(--surface-3);

  button {
    height: 30px;
    color: var(--text-2);
    border-radius: calc(var(--r-md) - 2px);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: color var(--dur) var(--ease), background var(--dur) var(--ease);
  }

  button:hover { color: var(--text); }
  button.active { color: var(--brand-600); background: var(--surface); font-weight: 600; }
}

:deep(.el-select-dropdown__item) {
  padding: 0 10px;
}

:deep(.bind-dialog) {
  width: 400px !important;
  @media (max-width: 440px) {
    width: calc(100% - 40px) !important;
    margin-right: 20px !important;
    margin-left: 20px !important;
  }
}

.bind-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
}

.setting-icon {
  position: relative;
  top: 6px;
}

.github {
  position: fixed;
  width: 35px;
  height: 35px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  background: var(--el-bg-color);
  bottom: 10px;
  right: 10px;
  z-index: 1000;
  border: 1px solid var(--el-border-color-light);
  box-shadow: var(--el-box-shadow-light);
  cursor: pointer;
}

:deep(.el-input-group__append) {
  padding: 0 !important;
  padding-left: 8px !important;
  padding-right: 4px !important;
  background: var(--el-bg-color);
  border-radius: 0 8px 8px 0;
}

:deep(.el-button+.el-button) {
  margin: 0;
}

.register-turnstile {
  margin-bottom: 18px;
}

.select {
  position: absolute;
  right: 30px;
  width: 100px;
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
}

.custom-style {
  margin-bottom: 10px;
}

.custom-style .el-segmented {
  --el-border-radius-base: 6px;
  width: 180px;
}


#login-box {
  position: relative;
  background: var(--bg);
  height: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  display: block;
}

.login-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-color: var(--bg);
  background-image:
    radial-gradient(880px 460px at 50% -12%, color-mix(in srgb, var(--brand-500) 16%, transparent), transparent 62%),
    radial-gradient(680px 420px at 92% 104%, color-mix(in srgb, var(--info) 9%, transparent), transparent 60%);
}

.custom-backdrop::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(720px 620px at 50% 50%, rgba(4, 16, 37, .52), rgba(4, 16, 37, .28));
}

.field-label { display: block; margin: 0 0 6px; color: var(--text-2); font-size: 12.5px; font-weight: 500; }
.enterprise-note { margin-top: 14px; padding: 10px 12px; display: flex; align-items: flex-start; gap: 8px; color: var(--text-3); border: 1px solid var(--border); border-radius: var(--r-md); background: var(--surface-2); font-size: 11.5px; line-height: 1.6; }
.enterprise-note svg { flex: none; margin-top: 1px; }

@media (max-width: 767px) {
  .form-wrapper { padding: 20px 16px; }
  .container { min-height: auto; }
}

</style>
