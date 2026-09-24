<template>
  <div id="login-box" :style=" background ? 'background: var(--el-bg-color)' : ''" v-loading="oauthLoading" element-loading-text="登录中...">
    <div class="login-backdrop" :class="{ 'custom-backdrop': settingStore.settings.background }" :style="background"></div>
    <section class="brand-panel" aria-label="Product introduction">
      <div class="brand-lockup">
        <div class="brand-mark"><Icon icon="mdi:email-outline" width="21" height="21" /></div>
        <div class="brand-copy">
          <strong>{{ settingStore.settings.title || 'STAR MUSTANG' }}</strong>
          <span>企业邮箱系统 · Internal Mail</span>
        </div>
        <span class="platform-badge">全球商务邮箱</span>
      </div>
      <div class="brand-message">
        <h1>公司统一邮箱，<br/>一个入口处理全部业务往来</h1>
        <p>海外客户询盘、供应商报价、物流单据全部归集到企业邮箱；大附件走云存储、AI 自动识别验证码，对外发送按策略管控，用公司域名做全球商务往来。</p>
        <div class="brand-stats">
          <div><strong>46</strong><span>在职员工邮箱</span></div>
          <div><strong>4</strong><span>共享邮箱</span></div>
          <div><strong>99.9%</strong><span>海外送达率</span></div>
        </div>
        <div class="brand-features">
          <span><Icon icon="solar:check-circle-bold" /> 全球收发直达</span>
          <span><Icon icon="solar:check-circle-bold" /> 大附件云存储</span>
          <span><Icon icon="solar:check-circle-bold" /> AI 识别验证码</span>
        </div>
      </div>
      <div class="brand-footnote">STAR MUSTANG · CONSTRUCTION MACHINERY PARTS</div>
    </section>
    <div class="form-wrapper">
      <div class="container">
        <div class="form-mobile-brand">
          <div class="form-brand-mark"><Icon icon="mdi:email-outline" width="21" height="21" /></div>
          <div><strong>{{ settingStore.settings.title || 'STAR MUSTANG' }}</strong><span>企业邮箱系统</span></div>
        </div>
        <span class="form-title">{{ show === 'login' ? (settingStore.lang === 'zh' ? '登录企业邮箱' : 'Sign in to corporate mail') : $t('regTitle') }}</span>
        <span class="form-desc" v-if="show === 'login'">{{ settingStore.lang === 'zh' ? '使用公司分配的邮箱账号登录' : 'Use your company mailbox account' }}</span>
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
          <div class="enterprise-note" v-if="settingStore.lang === 'zh'">
            <Icon icon="solar:info-circle-linear" width="18" />
            <span>账号由企业管理员统一开通，首次登录后请及时修改初始密码。</span>
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
            <span style="font-size: 12px;color: #F56C6C" v-if="botJsError">{{ $t('verifyModuleFailed') }}</span>
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
        <template v-if="settingStore.settings.register === 0">
          <div class="switch" @click="show = 'register'" v-if="show === 'login'">{{ $t('noAccount') }}
            <span>{{ $t('regSwitch') }}</span></div>
          <div class="switch" @click="show = 'login'" v-else>{{ $t('hasAccount') }} <span>{{ $t('loginSwitch') }}</span>
          </div>
        </template>
        <div class="form-foot" v-if="show === 'login'">
          <strong>STAR MUSTANG</strong>
          <span>支持全球收发 · 附件云存储 · AI 验证码识别</span>
        </div>
      </div>
    </div>
    <el-dialog class="bind-dialog" v-model="showBindForm"  title="注册邮箱" >
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
      <Icon icon="mingcute:github-line" color="#1890ff" width="20" height="20" />
    </a>
  </div>
</template>

<script setup>
import router from "@/router";
import {useRoute} from "vue-router";
import {computed, nextTick, reactive, ref} from "vue";
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
  localStorage.setItem('token', token)
  refreshWebsiteConfig()
  const user = await loginUserInfo();
  accountStore.currentAccountId = user.account.accountId;
  accountStore.currentAccount = user.account;
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
  position: fixed;
  right: 0;
  width: 47.5vw;
  height: 100%;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  @media (max-width: 767px) {
    width: 100%;
  }
}

.container {
  background: v-bind(loginOpacity);
  padding: 28px 28px 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: min(400px, calc(100% - 48px));
  height: auto;
  min-height: 0;
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  box-shadow: var(--sh-3);
  backdrop-filter: blur(18px) saturate(130%);
  @media (max-width: 1024px) {
    padding: 36px 28px;
    width: calc(100% - 48px);
    margin: 0 24px;
  }
  @media (max-width: 767px) {
    border: 1px solid rgba(255, 255, 255, .66);
    padding: 32px 24px;
    border-radius: 20px;
    height: fit-content;
    width: 100%;
    margin-right: 18px;
    margin-left: 18px;
  }

  .btn {
    height: 44px;
    width: 100%;
    border-radius: 10px;
    font-weight: 600;
    letter-spacing: .2px;
  }

  .form-desc {
    margin-top: 6px;
    margin-bottom: 24px;
    color: var(--form-desc-color);
  }

  .form-title {
    font-weight: 700;
    font-size: 22px !important;
    letter-spacing: -.3px;
  }

  .form-brand-mark {
    display: none;
    width: 42px;
    height: 42px;
    border-radius: 12px;
    align-items: center;
    justify-content: center;
    color: white;
    background: linear-gradient(135deg, var(--brand-500), #25d366);
    @media (max-width: 767px) { display: flex; }
  }

  .switch {
    margin-top: 20px;
    text-align: center;

    span {
      color: var(--login-switch-color);
      cursor: pointer;
    }
  }

  :deep(.el-input__wrapper) {
    border-radius: var(--r-sm);
    background: var(--el-bg-color);
    box-shadow: 0 0 0 1px var(--el-border-color) inset;
  }

  .email-input :deep(.el-input__wrapper) {
    border-radius: 6px 0 0 6px;
    background: var(--el-bg-color);
  }

  .el-input {
    height: 44px;
    width: 100%;
    margin-bottom: 18px;

    :deep(.el-input__inner) {
      height: 42px;
    }
  }
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
  background: #eef3fb;
  font: 100% Inter, "PingFang SC", "Microsoft YaHei", sans-serif;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  display: grid;
  grid-template-columns: 1.05fr .95fr;
}

.login-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px),
    radial-gradient(1100px 600px at 14% 20%, rgba(37,211,102,.28), transparent 60%),
    radial-gradient(900px 520px at 86% 14%, rgba(14,165,233,.20), transparent 62%),
    radial-gradient(1000px 700px at 68% 92%, rgba(16,185,129,.22), transparent 60%),
    linear-gradient(160deg,#08111c 0%, #0d1a26 55%, #070f18 100%);
  background-size: 44px 44px, 44px 44px, auto, auto, auto, auto;
}

.custom-backdrop::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(4, 16, 37, .76), rgba(4, 16, 37, .28) 58%, rgba(244, 247, 252, .2));
}

.brand-panel {
  position: relative;
  z-index: 2;
  min-width: 0;
  height: 100%;
  padding: 48px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
}

.brand-lockup { display: flex; align-items: center; gap: 11px; }
.brand-mark { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 15px; color: #04121f; background: linear-gradient(135deg, #25d366, #0ea5e9); }
.brand-copy { display: flex; flex-direction: column; }
.brand-copy strong { font-size: 18px; line-height: 1.15; }
.brand-copy span { margin-top: 3px; color: rgba(255,255,255,.55); font-size: 12.5px; font-weight: 400; }
.platform-badge { margin-left: 7px; padding: 4px 8px; border-radius: 6px; background: rgba(255,255,255,.12); color: #a7f3d0; font-size: 10.5px; font-weight: 650; }
.brand-message { max-width: 540px; }
.brand-message h1 { font-size: clamp(36px, 3.3vw, 48px); line-height: 1.14; letter-spacing: -1.5px; font-weight: 800; }
.brand-message p { max-width: 530px; margin-top: 20px; color: rgba(255,255,255,.7); font-size: 15px; line-height: 1.85; }
.brand-stats { max-width: 520px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 32px; }
.brand-stats > div { padding: 16px; border: 1px solid rgba(255,255,255,.12); border-radius: var(--r-lg); background: rgba(255,255,255,.07); }
.brand-stats strong { display: block; font-size: 24px; line-height: 1.1; }
.brand-stats span { display: block; margin-top: 6px; color: rgba(255,255,255,.6); font-size: 13px; }
.brand-features { display: flex; flex-wrap: wrap; gap: 10px 22px; margin-top: 30px; color: rgba(255,255,255,.58); }
.brand-features span { display: flex; align-items: center; gap: 6px; font-size: 12.5px; }
.brand-features svg { color: #25d366; font-size: 14px; }
.brand-footnote { color: rgba(255,255,255,.4); font-size: 10px; letter-spacing: 1.7px; }

.form-mobile-brand { display: none; align-items: center; gap: 11px; margin-bottom: 24px; }
.form-mobile-brand > div:last-child { display: flex; flex-direction: column; }
.form-mobile-brand strong { color: var(--text); font-size: 16px; line-height: 1.2; }
.form-mobile-brand span { margin-top: 2px; color: var(--text-3); font-size: 12px; }
.field-label { display: block; margin: 0 0 7px; color: var(--text-2); font-size: 13px; font-weight: 650; }
.enterprise-note { margin-top: 16px; padding: 13px; display: flex; align-items: flex-start; gap: 9px; color: var(--text-2); border: 1px solid var(--border); border-radius: var(--r-md); background: var(--surface-2); font-size: 12.5px; line-height: 1.65; }
.enterprise-note svg { flex: none; margin-top: 1px; }
.form-foot { margin: 24px -28px 0; padding: 14px 28px 16px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 5px 12px; color: var(--text-3); border-top: 1px solid var(--border); border-radius: 0 0 var(--r-xl) var(--r-xl); background: var(--surface-2); font-size: 11.5px; }
.form-foot strong { font-size: 11px; letter-spacing: .04em; }

@media (max-width: 767px) {
  #login-box { grid-template-columns: 1fr; background: #071610; }
  .login-backdrop { background: radial-gradient(circle at 18% 6%, rgba(37,211,102,.28), transparent 34%), radial-gradient(circle at 92% 88%, rgba(14,165,233,.18), transparent 38%), linear-gradient(160deg, #071610, #0b2b22); }
  .brand-panel { display: none; }
  .form-wrapper { width: 100%; padding: 24px 0; overflow-y: auto; }
  .container { min-height: auto; background: rgba(255,255,255,.96); }
  .form-mobile-brand { display: flex; }
  :global(.dark) .container { background: rgba(18,25,38,.94); border-color: rgba(255,255,255,.1); }
}

@media (min-width: 768px) and (max-width: 1023px) {
  #login-box { grid-template-columns: 1fr; }
  .brand-panel { display: none; }
  .form-wrapper { width: 100%; }
}

</style>
