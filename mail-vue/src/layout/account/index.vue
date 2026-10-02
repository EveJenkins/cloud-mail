<template>
  <div class="account-box">
    <div class="head-opt">
      <span class="head-copy">
        <strong>{{ settingStore.lang === 'zh' ? '切换邮箱' : 'Switch mailbox' }}</strong>
        <small>{{ settingStore.lang === 'zh' ? '选择要查看的邮箱身份' : 'Choose a mailbox to view' }}</small>
      </span>
      <span class="head-actions">
        <button v-perm="'account:add'" class="head-btn" type="button" :title="settingStore.lang === 'zh' ? '添加邮箱' : 'Add mailbox'" :aria-label="settingStore.lang === 'zh' ? '添加邮箱' : 'Add mailbox'" @click="add">
          <Icon icon="solar:add-circle-linear" width="18"/>
        </button>
        <button class="head-btn" type="button" :title="settingStore.lang === 'zh' ? '刷新邮箱列表' : 'Refresh mailboxes'" :aria-label="settingStore.lang === 'zh' ? '刷新邮箱列表' : 'Refresh mailboxes'" @click="refresh">
          <Icon icon="solar:refresh-linear" width="17"/>
        </button>
      </span>
    </div>
    <el-scrollbar class="scrollbar" ref="scrollbarRef">
      <div v-infinite-scroll="getAccountList" :infinite-scroll-distance="600" :infinite-scroll-immediate="false">
        <div class="item" :class="itemBg(item.accountId)" v-for="(item, index) in accounts" :key="item.accountId">
          <button class="item-main" type="button" :aria-current="accountStore.currentAccountId === item.accountId ? 'true' : undefined" @click="changeAccount(item)">
            <span class="item-avatar">{{ (item.email || 'M').charAt(0).toUpperCase() }}</span>
            <span class="item-copy">
              <strong>{{ item.name || item.email?.split('@')[0] }}</strong>
              <small>{{ item.email }}</small>
            </span>
            <Icon v-if="accountStore.currentAccountId === item.accountId" class="selected-check" icon="solar:check-circle-bold" width="18" />
          </button>
          <el-dropdown class="item-menu" trigger="click">
              <button class="more-btn" type="button" :title="settingStore.lang === 'zh' ? '邮箱操作' : 'Mailbox actions'" :aria-label="settingStore.lang === 'zh' ? `操作 ${item.email}` : `Actions for ${item.email}`">
                <Icon icon="solar:menu-dots-bold" width="18"/>
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="copyAccount(item.email)">{{ settingStore.lang === 'zh' ? '复制邮箱地址' : 'Copy address' }}</el-dropdown-item>
                  <el-dropdown-item v-if="hasPerm('email:send')" @click="openSetName(item)">{{ $t('rename') }}</el-dropdown-item>
                  <el-dropdown-item v-if="item.accountId !== userStore.user.account.accountId" @click="setAsTop(item, index)">{{ $t('pin') }}</el-dropdown-item>
                  <el-dropdown-item v-if="item.accountId !== userStore.user.account.accountId && hasPerm('account:delete')"
                                    @click="remove(item)">{{ $t('delete') }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
        </div>

        <!-- Initial Loading Skeleton -->
        <template v-if="loading">
          <el-skeleton v-for="i in skeletonRows" :key="i" animated>
            <template #template>
              <div class="item skeleton-row">
                <el-skeleton-item variant="circle" style="width: 26px; height: 26px"/>
                <el-skeleton-item variant="text" style="width: 60%; height: 14px"/>
              </div>
            </template>
          </el-skeleton>
        </template>

        <!-- Follow Loading Skeleton -->
        <template v-if="accounts.length > 0 && !noLoading">
          <el-skeleton animated>
            <template #template>
              <div class="item skeleton-row">
                <el-skeleton-item variant="circle" style="width: 26px; height: 26px"/>
                <el-skeleton-item variant="text" style="width: 60%; height: 14px"/>
              </div>
            </template>
          </el-skeleton>
        </template>

        <div class="empty" v-if="noLoading && accounts.length === 0">
          <el-empty :description="$t('noMessagesFound')"/>
        </div>
      </div>

    </el-scrollbar>
    <div class="account-footer" v-if="accounts.length">
      <Icon icon="solar:shield-check-linear" width="15" />
      {{ settingStore.lang === 'zh' ? '邮件按当前邮箱身份显示' : 'Mail is shown for the selected mailbox' }}
    </div>
    <el-dialog v-model="showAdd" :title="$t('addAccount')">
      <div class="container">
        <el-input v-model="addForm.email" ref="addRef" type="text" :placeholder="$t('emailAccount')" autocomplete="off" @keyup.enter="submit">
          <template #append>
            <div @click.stop="openSelect">
              <el-select
                  ref="mySelect"
                  v-model="addForm.suffix"
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
                <span>{{ addForm.suffix }}</span>
                <Icon class="setting-icon" icon="mingcute:down-small-fill" width="20" height="20"/>
              </div>
            </div>
          </template>
        </el-input>
        <el-button class="btn" type="primary" @click="submit" :loading="addLoading"
        >{{ $t('add') }}
        </el-button>
      </div>
      <div
          class="add-email-turnstile"
          :class="verifyShow ? 'turnstile-show' : 'turnstile-hide'"
          :data-sitekey="settingStore.settings.siteKey"
          data-callback="onTurnstileSuccess"
          data-error-callback="onTurnstileError"
      >
        <span style="font-size: 12px;color: var(--danger)" v-if="botJsError">{{ $t('verifyModuleFailed') }}</span>
      </div>
    </el-dialog>
    <el-dialog v-model="setNameShow" :title="$t('changeUserName')">
      <div class="container">
        <el-input v-model="accountName" type="text" :placeholder="$t('username')" autocomplete="off" @keyup.enter="setName">
        </el-input>
        <el-button class="btn" type="primary" @click="setName" :loading="setNameLoading"
        >{{ $t('save') }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
import {Icon} from "@iconify/vue";
import {computed, nextTick, reactive, ref, watch} from "vue";
import {
  accountList,
  accountAdd,
  accountDelete,
  accountSetName,
  accountSetAsTop
} from "@/request/account.js";
import {sleep} from "@/utils/time-utils.js"
import {isEmail} from "@/utils/verify-utils.js";
import {useSettingStore} from "@/store/setting.js";
import {useAccountStore} from "@/store/account.js";
import {useUiStore} from "@/store/ui.js";
import {useUserStore} from "@/store/user.js";
import {hasPerm} from "@/perm/perm.js"
import {useI18n} from "vue-i18n";

const {t} = useI18n();
const userStore = useUserStore();
const accountStore = useAccountStore();
const uiStore = useUiStore();
const settingStore = useSettingStore();
const showAdd = ref(false)
const addLoading = ref(false);
const domainList = computed(() => settingStore.domainList)
const accounts = reactive([])
const noLoading = ref(false)
const loading = ref(false)
const followLoading = ref(false);
const verifyShow = ref(false)
const setNameShow = ref(false)
const setNameLoading = ref(false)
const accountName = ref(null)
const addRef = ref({})
const scrollbarRef = ref({})
let account = null
let turnstileId = null
const botJsError = ref(false)
let verifyToken = ''
let verifyErrorCount = 0
const addForm = reactive({
  email: '',
  suffix: settingStore.domainList[0]
})
let skeletonRows = 10
const queryParams = {
  size: 30
}

const mySelect = ref()

if (hasPerm('account:query')) {
  getAccountList()
}

watch(() => accountStore.changeUserAccountName, () => {
  if (accounts[0]) accounts[0].name = accountStore.changeUserAccountName
})

watch(() => settingStore.domainList, (list) => {
  if (!addForm.suffix && list.length > 0) {
    addForm.suffix = list[0]
  }
}, {immediate: true})


const openSelect = () => {
  mySelect.value.toggleMenu()
}

window.onTurnstileError = (e) => {
  if (verifyErrorCount >= 4) {
    return
  }
  verifyErrorCount++
  console.warn('人机验加载失败', e)
  setTimeout(() => {
    nextTick(() => {
      if (!turnstileId) {
        turnstileId = window.turnstile.render('.add-email-turnstile')
      } else {
        window.turnstile.reset(turnstileId);
      }
    })
  }, 1500)
};

window.onTurnstileSuccess = (token) => {
  verifyToken = token;
};

function getSkeletonRows() {
  if (accounts.length > 20) return skeletonRows = 20
  if (accounts.length === 0) return skeletonRows = 1
  skeletonRows = accounts.length
}

function setName() {

  if (setNameLoading.value) return

  let name = accountName.value

  if (name === account.name) {
    setNameShow.value = false
    return
  }

  if (!name) {
    ElMessage({
      message: t('emptyUserNameMsg'),
      type: 'error',
      plain: true,
    })
    return;
  }

  setNameLoading.value = true
  accountSetName(account.accountId, name).then(() => {
    account.name = name
    setNameShow.value = false

    if (account.accountId === userStore.user.account.accountId) {
      userStore.user.name = name
    }

    ElMessage({
      message: t('saveSuccessMsg'),
      type: "success",
      plain: true
    })
  }).finally(() => {
    setNameLoading.value = false
  })
}

function openSetName(accountItem) {
  accountName.value = accountItem.name
  account = accountItem
  setNameShow.value = true
}

function itemBg(accountId) {
  return accountStore.currentAccountId === accountId ? 'item-choose' : ''
}



function remove(account) {
  ElMessageBox.confirm(t('delConfirm', {msg: account.email}), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    accountDelete(account.accountId).then(() => {
      const index = accounts.findIndex(item => item.accountId === account.accountId);
      accounts.splice(index, 1);
      if (accountStore.currentAccountId === account.accountId) accountStore.selectAccount(userStore.user.account);
      if (accounts.length < queryParams.size) {
        getAccountList()
      }
      ElMessage({
        message: t('delSuccessMsg'),
        type: 'success',
        plain: true,
      })
    })
  });
}

function refresh() {
  if (loading.value) {
    return
  }
  loading.value = false
  followLoading.value = false
  noLoading.value = false
  queryParams.accountId = 0
  queryParams.lastSort = null
  getSkeletonRows();
  scrollbarRef.value.setScrollTop(0)
  accounts.splice(0, accounts.length)
  getAccountList()
}

function changeAccount(account) {
  accountStore.selectAccount(account)
  // 选中后收起下拉
  uiStore.accountShow = false
}

function add() {
  addForm.suffix = addForm.suffix || settingStore.domainList[0]
  showAdd.value = true
  setTimeout(() => {
    addRef.value.focus()
  }, 100)
}

function setAsTop(account, index) {
  accountSetAsTop(account.accountId).then(() => {
    ElMessage({
      message: t('setSuccess'),
      type: 'success',
      plain: true,
    })

    const [item] = accounts.splice(index, 1);
    accounts.splice(1, 0, item);

  });
}

async function copyAccount(account) {
  try {
    await navigator.clipboard.writeText(account);
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

function getAccountList() {

  if (loading.value || followLoading.value || noLoading.value) return;

  if (accounts.length === 0) {
    loading.value = true
  } else {
    followLoading.value = true
  }

  let start = Date.now();

  const accountId = accounts.length > 0 ? accounts.at(-1).accountId : 0;
  const lastSort = accounts.length > 0 ? accounts.at(-1).sort : null;

  accountList(accountId, queryParams.size, lastSort).then(async list => {

    let end = Date.now();
    let duration = end - start;
    if (duration < 300) {
      await sleep(300 - duration)
    }

    if (list.length < queryParams.size) {
      noLoading.value = true
    }
    const selected = list.find(item => item.accountId === accountStore.currentAccountId)
    if (selected) accountStore.currentAccount = selected

    accounts.push(...list)

    loading.value = false
    followLoading.value = false
  }).catch(() => {
    loading.value = false
    followLoading.value = false
  })
}


function submit() {

  if (addLoading.value) return

  if (!addForm.email) {
    ElMessage({
      message: t('emptyEmailMsg'),
      type: "error",
      plain: true
    })
    return
  }

  if (addForm.email.length < settingStore.settings.minEmailPrefix) {
    ElMessage({
      message: t('minEmailPrefix', {msg: settingStore.settings.minEmailPrefix}),
      type: 'error',
      plain: true,
    })
    return
  }

  if (!isEmail(addForm.email + addForm.suffix)) {
    ElMessage({
      message: t('notEmailMsg'),
      type: "error",
      plain: true
    })
    return
  }

  if (!verifyToken && (settingStore.settings.addEmailVerify === 0 || (settingStore.settings.addEmailVerify === 2 && settingStore.settings.addVerifyOpen))) {
    if (!verifyShow.value) {
      verifyShow.value = true
      nextTick(() => {
        if (!turnstileId) {
          try {
            turnstileId = window.turnstile.render('.add-email-turnstile')
          } catch (e) {
            botJsError.value = true
            console.log('人机验证js加载失败')
          }
        } else {
          window.turnstile.reset('.add-email-turnstile')
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

  addLoading.value = true
  accountAdd(addForm.email + addForm.suffix, verifyToken).then(account => {
    addLoading.value = false
    addForm.email = ''
    accounts.push(account)
    verifyToken = ''
    settingStore.settings.addVerifyOpen = account.addVerifyOpen
    ElMessage({
      message: t('addSuccessMsg'),
      type: "success",
      plain: true
    })
    verifyShow.value = false
    showAdd.value = false
    userStore.refreshUserInfo()
  }).catch(res => {
    if (res.code === 400) {
      verifyToken = ''
      if (turnstileId) {
        window.turnstile.reset(turnstileId)
      } else {
        nextTick(() => {
          turnstileId = window.turnstile.render('.add-email-turnstile')
        })
      }
      verifyShow.value = true
    }
    addLoading.value = false
  })
}
</script>
<style>
path[fill="#ffdda1"] {
  fill: #ffdd7d;
}
</style>
<style scoped lang="scss">
.account-box {
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  box-shadow: var(--sh-3);
  overflow: hidden;

  .head-opt {
    display: flex;
    align-items: center;
    min-height: 68px;
    padding: 11px 12px 10px 16px;
    border-bottom: 1px solid var(--border);
    background: var(--surface-2);
  }
  .head-copy { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 2px; }
  .head-copy strong { color: var(--text); font-size: 14px; font-weight: 700; }
  .head-copy small { color: var(--text-3); font-size: 11px; }
  .head-actions { display: flex; align-items: center; gap: 4px; }
  .head-btn {
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-2);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    background: var(--surface);
    cursor: pointer;
    transition: color var(--dur) var(--ease), background var(--dur) var(--ease);
  }
  .head-btn:hover { color: var(--brand-600); background: var(--brand-soft); }
  .head-btn:focus-visible, .item-main:focus-visible, .more-btn:focus-visible { outline: 2px solid var(--brand-500); outline-offset: 2px; }

  .scrollbar {
    width: 100%;
    max-height: min(342px, 45vh);
    padding: 6px 0;
    overflow: auto;

    .empty {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }

    .noLoading {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 10px 0;
      color: var(--secondary-text-color);
    }
  }

  .btn {
    width: 100%;
    margin-top: 15px;
  }

  .item {
    min-width: 0;
    margin: 3px 8px;
    display: flex;
    align-items: center;
    border: 1px solid transparent;
    border-radius: var(--r-md);
    background: transparent;
    transition: border-color var(--dur) var(--ease), background var(--dur) var(--ease);
  }
  .item:hover { background: var(--surface-2); }

  .item-main {
    min-width: 0;
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 6px 10px 10px;
    border: 0;
    background: transparent;
    text-align: left;
    cursor: pointer;
  }

  .skeleton-row { pointer-events: none; }

  .item-avatar {
    width: 36px;
    height: 36px;
    flex: 0 0 36px;
    display: grid;
    place-items: center;
    color: #fff;
    background: var(--brand-600);
    border-radius: var(--r-sm);
    font-size: 13px;
    font-weight: 600;
  }
  .item-copy {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .item-copy strong, .item-copy small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .item-copy strong { color: var(--text); font-size: 13px; font-weight: 600; }
  .item-copy small { color: var(--text-3); font-size: 11px; }
  .selected-check { flex: none; color: var(--brand-600); }
  .item-menu { flex: none; margin-right: 7px; }
  .more-btn {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-3);
    border: 0;
    border-radius: var(--r-sm);
    background: transparent;
    cursor: pointer;
    transition: color var(--dur) var(--ease), background var(--dur) var(--ease);
  }
  .more-btn:hover { color: var(--brand-600); background: var(--brand-soft); }

  .item-choose,
  .item-choose:hover {
    background: var(--brand-soft);
    border-color: color-mix(in srgb, var(--brand-500) 38%, var(--border));
  }
  .item-choose .item-copy strong { color: var(--brand-700); }
  .account-footer { display: flex; align-items: center; gap: 6px; padding: 10px 16px; color: var(--text-3); border-top: 1px solid var(--border); font-size: 11px; }
}


.setting-icon {
  position: relative;
  top: 6px;
}

:deep(.el-input-group__append) {
  padding: 0 !important;
  padding-left: 8px !important;
  background: var(--el-bg-color);
}

:deep(.el-dialog) {
  width: 400px !important;
  @media (max-width: 440px) {
    width: calc(100% - 40px) !important;
    margin-right: 20px !important;
    margin-left: 20px !important;
  }
}

.select {
  position: absolute;
  right: 30px;
  width: 100px;
  opacity: 0;
  pointer-events: none;
}

:deep(.el-pagination .el-select) {
  width: 100px;
  background: var(--el-bg-color);
}

.add-email-turnstile {
  margin-top: 15px;
}

.turnstile-show {
  opacity: 1;
}

.turnstile-hide {
  opacity: 0;
  pointer-events: none;
  position: fixed;
}

</style>
