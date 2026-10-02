<template>
  <div class="inbox-workspace" :class="{ 'with-preview': isDesktop }">
    <section class="mail-list-pane">
      <emailScroll ref="scroll"
               :cancel-success="cancelStar"
               :star-success="addStar"
               :getEmailList="getEmailList"
               :emailDelete="emailDelete"
               :star-add="starAdd"
               :star-cancel="starCancel"
               :time-sort="params.timeSort"
               :email-read="emailRead"
               :show-unread="true"
               :show-inbox-summary="true"
               :unread-badge="true"
               :search-query="typeof route.query.q === 'string' ? route.query.q : ''"
               :empty-title="settingStore.lang === 'zh' ? '收件箱是空的' : 'Your inbox is empty'"
               :empty-description="settingStore.lang === 'zh' ? '收到的邮件会显示在这里' : 'Incoming messages will appear here'"
               :selected-id="selectedEmailId"
               actionLeft="4px"
               @jump="jumpContent"
               @list-loaded="syncSelection"
               @filters-reset="clearRouteSearch"
  >
    <template #first>
      <Icon class="icon" @click="changeTimeSort" icon="material-symbols-light:timer-arrow-down-outline"
            v-if="params.timeSort === 0" width="28" height="28"/>
      <Icon class="icon" @click="changeTimeSort" icon="material-symbols-light:timer-arrow-up-outline" v-else
            width="28" height="28"/>
    </template>
      </emailScroll>
    </section>
    <MailPaneDivider v-if="isDesktop" />
    <section class="mail-preview-pane" v-if="isDesktop">
      <Content v-if="selectedEmailId && !switchingInbox" :key="`${accountStore.currentAccountId}:${selectedEmailId}`" embedded @close="selectedEmailId = null" />
      <div v-else-if="switchingInbox" class="preview-loading">
        <Icon icon="svg-spinners:ring-resize" width="28" height="28" />
        <strong>{{ settingStore.lang === 'zh' ? '正在切换邮箱…' : 'Switching mailbox…' }}</strong>
        <p>{{ settingStore.lang === 'zh' ? '正在加载当前账号的邮件' : 'Loading messages for this account' }}</p>
      </div>
      <MailPreviewEmpty
          v-else
          icon="solar:letter-opened-linear"
          :title="settingStore.lang === 'zh' ? '选择一封邮件开始阅读' : 'Select a message to start reading'"
          :description="settingStore.lang === 'zh' ? '正文、附件和会话记录将在这里显示' : 'The message, attachments and conversation history will appear here'"
      />
    </section>
  </div>
</template>

<script setup>
import {useAccountStore} from "@/store/account.js";
import {useEmailStore} from "@/store/email.js";
import {useSettingStore} from "@/store/setting.js";
import emailScroll from "@/components/email-scroll/index.vue"
import {emailList, emailDelete, emailLatest, emailRead} from "@/request/email.js";
import {starAdd, starCancel} from "@/request/star.js";
import {defineOptions, h, nextTick, onActivated, onBeforeUnmount, onMounted, reactive, ref, watch} from "vue";
import {sleep} from "@/utils/time-utils.js";
import router from "@/router/index.js";
import {Icon} from "@iconify/vue";
import { useRoute } from 'vue-router'
import Content from '@/views/content/index.vue'
import MailPreviewEmpty from '@/components/mail-preview-empty/index.vue'
import MailPaneDivider from '@/components/mail-pane-divider/index.vue'

defineOptions({
  name: 'email'
})

const route = useRoute();
const emailStore = useEmailStore();
const accountStore = useAccountStore();
const settingStore = useSettingStore();
const scroll = ref({})
const params = reactive({
  timeSort: 0,
})
const isDesktop = ref(window.innerWidth >= 1280)
const isPhone = ref(window.innerWidth < 768)
const selectedEmailId = ref(null)
const switchingInbox = ref(false)
let refreshLoopActive = true

const handleViewport = () => {
  isDesktop.value = window.innerWidth >= 1280
  isPhone.value = window.innerWidth < 768
}

onMounted(() => {
  emailStore.emailScroll = scroll;
  window.addEventListener('resize', handleViewport)
  latest()
})

onActivated(async () => {
  await nextTick()
  syncSelection()
})

function syncSelection() {
  if (route.name !== 'email' || !isDesktop.value || switchingInbox.value) return
  const list = scroll.value?.emailList || []
  const selected = list.find(item => Number(item.emailId) === Number(selectedEmailId.value))
    || list.find(item => emailStore.sameEmailIdentity(item, emailStore.contentData.email))
    || list[0]
  if (selected) openContent(selected)
  else {
    selectedEmailId.value = null
    emailStore.clearContent()
  }
}

onBeforeUnmount(() => {
  refreshLoopActive = false
  window.removeEventListener('resize', handleViewport)
})

watch(
  () => [
    selectedEmailId.value,
    emailStore.contentData.email?.emailId,
    emailStore.contentData.email?.accountId,
    emailStore.contentData.email?.messageId,
    emailStore.contentData.email?.subject,
  ],
  () => {
    if (route.name !== 'email' || !isDesktop.value || switchingInbox.value || !selectedEmailId.value) return
    const selected = scroll.value?.emailList?.find(item => Number(item.emailId) === Number(selectedEmailId.value))
    if (!selected) {
      selectedEmailId.value = null
      emailStore.clearContent()
      return
    }
    if (!emailStore.sameEmailIdentity(selected, emailStore.contentData.email)) {
      emailStore.contentData.email = emailStore.toContentEmail(selected)
    }
  },
  {flush: 'sync'}
)


watch(() => accountStore.currentAccountId, async (accountId, previousAccountId) => {
  if (Number(accountId) === Number(previousAccountId)) return
  switchingInbox.value = true
  selectedEmailId.value = null
  if (route.name === 'email') emailStore.clearIdentityCache()
  scroll.value.resetList?.()
  await nextTick()
  try {
    await scroll.value.refreshList?.()
    const firstEmail = scroll.value.emailList?.[0]
    if (route.name === 'email' && firstEmail && Number(accountStore.currentAccountId) === Number(accountId)) openContent(firstEmail)
  } finally {
    switchingInbox.value = false
  }
}, {flush: 'sync'})

function changeTimeSort() {
  params.timeSort = params.timeSort ? 0 : 1
  scroll.value.refreshList();
}

function clearRouteSearch() {
  if (route.query.q) router.replace({name: 'email'})
}

function jumpContent(email) {
  if (isDesktop.value) {
    openContent(email)
    return
  }
  openContent(email)
  router.push('/mail')
}

function openContent(email) {
  if (route.name !== 'email' || Number(email.type) !== 0) return
  emailStore.contentData.email = emailStore.toContentEmail(email)
  emailStore.contentData.delType = 'logic'
  emailStore.contentData.showUnread = true
  emailStore.contentData.showStar = true
  emailStore.contentData.showReply = true
  selectedEmailId.value = email.emailId
}

const existIds = new Set();

async function latest() {
  while (refreshLoopActive) {

    let autoRefresh = settingStore.settings.autoRefresh;
    await sleep(autoRefresh > 1 ? autoRefresh * 1000 : 3000);

    if (!refreshLoopActive) break

    if (route.name !== 'email') {
      continue;
    }

    const latestId = scroll.value.latestEmail?.emailId

    if (!scroll.value.firstLoad && autoRefresh > 1) {
      try {
        const accountId = accountStore.currentAccountId
        const curTimeSort = params.timeSort
        let list = []

        //确保发起请求时最后一个邮件是当前账号的,或者
        if (accountId === scroll.value.latestEmail?.reqAccountId) {
          list = await emailLatest(latestId, accountId);
        }

        //确保请求回来后，账号没有切换，时间排序没有改变，全部邮件类型没变
        if (accountId === accountStore.currentAccountId && params.timeSort === curTimeSort) {
          if (list.length > 0) {
            emailStore.applyFullList(list)

            for (let email of list) {

              email.reqAccountId = accountId;

              if (!existIds.has(email.emailId)) {

                existIds.add(email.emailId)
                scroll.value.addItem(email)

                await sleep(50)
              }

            }

          }

        }
      } catch (e) {
        if (e.code === 401 || e.code === 403) {
          settingStore.settings.autoRefresh = 0;
        }
        console.error(e)
      }
    }
  }
}

function addStar(email) {
  emailStore.starScroll?.addItem(email)
}

function cancelStar(email) {
  emailStore.starScroll?.deleteEmail([email.emailId])
}

function getEmailList(emailId, size) {
  const accountId =  accountStore.currentAccountId;
  return emailStore.fetchList(full =>
    emailList(accountId, emailId, params.timeSort, size, 0, full)
  ).then(data => {
    const normalized = data || { list: [], latestEmail: null, total: 0 }
    if (normalized.latestEmail) {
      normalized.latestEmail.reqAccountId = accountId;
    }
    return normalized;
  })
}

</script>
<style lang="scss" scoped>
.inbox-workspace { position: relative; height: 100%; min-width: 0; background: var(--reading-surface); }
.inbox-workspace.with-preview { display: grid; grid-template-columns: var(--mail-list-w) minmax(0, 1fr); }
.mail-list-pane { min-width: 0; height: 100%; overflow: hidden; background: var(--mail-list-surface); border-right: 1px solid var(--border); }
.mail-preview-pane { min-width: 0; height: 100%; overflow: hidden; background: var(--reading-surface); }
.preview-loading { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--brand-600); text-align: center; }
.preview-loading strong { margin-top: 13px; color: var(--text-2); font-size: 14px; font-weight: 600; }
.preview-loading p { margin-top: 5px; color: var(--text-3); font-size: 12px; }

@media (max-width: 767px) {
  .mail-list-pane :deep(.email-row) { padding-right: 12px; padding-left: 8px; }
}

.icon {
  cursor: pointer;
}
</style>
