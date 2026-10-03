<template>
  <div class="sent-workspace" :class="{ 'with-preview': isDesktop }">
    <section class="mail-list-pane">
      <emailScroll ref="sendScroll"
               :cancel-success="cancelStar"
               :star-success="addStar"
               :getEmailList="getEmailList"
               :emailDelete="emailDelete"
               :star-add="starAdd"
               show-status
               actionLeft="4px"
               :star-cancel="starCancel"
               @jump="jumpContent"
               @list-loaded="syncSelection"
               :time-sort="params.timeSort"
               :type="'send'"
               :show-inbox-summary="true"
               :summary-title="settingStore.lang === 'zh' ? '已发送' : 'Sent'"
               :empty-title="settingStore.lang === 'zh' ? '还没有已发送邮件' : 'No sent messages yet'"
               :empty-description="settingStore.lang === 'zh' ? '发送成功的邮件会出现在这里' : 'Successfully sent messages will appear here'"
               empty-icon="solar:plain-2-linear"
               :selected-id="selectedEmailId"
  >
    <template #first>
      <Icon class="icon" @click="changeTimeSort" icon="material-symbols-light:timer-arrow-down-outline"
            v-if="params.timeSort === 0" width="28" height="28"/>
      <Icon class="icon" @click="changeTimeSort" icon="material-symbols-light:timer-arrow-up-outline" v-else
            width="28" height="28"/>
    </template>
    <template v-if="!isDesktop" #empty-actions>
      <button class="primary" type="button" @click="uiStore.writerRef?.open?.()"><Icon icon="solar:pen-new-square-linear" width="15" />{{ settingStore.lang === 'zh' ? '写新邮件' : 'Compose' }}</button>
    </template>
      </emailScroll>
    </section>
    <MailPaneDivider v-if="isDesktop" />
    <section class="mail-preview-pane" v-if="isDesktop">
      <Content v-if="selectedEmailId" :key="`sent:${accountStore.currentAccountId}:${selectedEmailId}`" embedded @close="selectedEmailId = null" />
      <MailPreviewEmpty
          v-else
          icon="solar:plain-2-linear"
          :title="settingStore.lang === 'zh' ? '选择一封已发送邮件' : 'Select a sent message'"
          :description="settingStore.lang === 'zh' ? '查看投递内容、附件与发送状态' : 'Review delivery content, attachments and sending status'"
      >
        <template #actions>
          <button class="primary" type="button" @click="uiStore.writerRef?.open?.()"><Icon icon="solar:pen-new-square-linear" width="16" />{{ settingStore.lang === 'zh' ? '写新邮件' : 'Compose' }}</button>
          <button type="button" @click="sendScroll.refreshList?.()"><Icon icon="solar:refresh-linear" width="16" />{{ settingStore.lang === 'zh' ? '刷新列表' : 'Refresh' }}</button>
        </template>
      </MailPreviewEmpty>
    </section>
  </div>
</template>

<script setup>
import {useAccountStore} from "@/store/account.js";
import {useEmailStore} from "@/store/email.js";
import {useSettingStore} from "@/store/setting.js";
import emailScroll from "@/components/email-scroll/index.vue"
import {emailList, emailDelete} from "@/request/email.js";
import {starAdd, starCancel} from "@/request/star.js";
import {defineOptions, nextTick, onActivated, onBeforeMount, onBeforeUnmount, onMounted, reactive, ref, watch} from "vue";
import router from "@/router/index.js";
import {Icon} from "@iconify/vue";
import Content from '@/views/content/index.vue'
import MailPreviewEmpty from '@/components/mail-preview-empty/index.vue'
import MailPaneDivider from '@/components/mail-pane-divider/index.vue'
import {useUiStore} from '@/store/ui.js'

defineOptions({
  name: 'send'
})

const emailStore = useEmailStore();
const accountStore = useAccountStore();
const settingStore = useSettingStore();
const uiStore = useUiStore();
const sendScroll = ref({})
const params = reactive({
  timeSort: 0,
})
const isDesktop = ref(window.innerWidth >= 1280)
const isPhone = ref(window.innerWidth < 768)
const selectedEmailId = ref(null)

function handleViewport() {
  isDesktop.value = window.innerWidth >= 1280
  isPhone.value = window.innerWidth < 768
}

onMounted(() => {
  emailStore.sendScroll = sendScroll;
  window.addEventListener('resize', handleViewport)
})

onBeforeMount(() => {
  selectedEmailId.value = null
  emailStore.clearContent()
})

onBeforeUnmount(() => window.removeEventListener('resize', handleViewport))

// The route is kept alive. Restore this folder's selected message whenever the
// user returns, otherwise the shared detail pane can still show the message
// selected in Inbox or Starred (email ids are not globally unique by folder).
onActivated(async () => {
  await nextTick()
  syncSelection()
})

function syncSelection() {
  if (router.currentRoute.value.name !== 'send') return
  const list = (sendScroll.value?.emailList || []).filter(item =>
    Number(item.accountId) === Number(accountStore.currentAccountId))
  const selected = list.find(item => Number(item.emailId) === Number(selectedEmailId.value)) || list[0]
  if (selected) openContent(selected)
  else {
    selectedEmailId.value = null
    emailStore.clearContent()
  }
}

watch(() => sendScroll.value?.emailList?.[0]?.emailId, () => {
  if (router.currentRoute.value.name === 'send' && isDesktop.value && !selectedEmailId.value && sendScroll.value?.emailList?.length) {
    syncSelection()
  }
})

watch(
  () => [selectedEmailId.value, emailStore.contentData.email],
  () => {
    if (router.currentRoute.value.name !== 'send' || !isDesktop.value || !selectedEmailId.value) return
    const selected = sendScroll.value?.emailList?.find(item => Number(item.emailId) === Number(selectedEmailId.value))
    if (!selected) return
    if (!emailStore.sameEmailIdentity(selected, emailStore.contentData.email)) openContent(selected)
  },
  {flush: 'sync'}
)

watch(() => accountStore.currentAccountId, () => {
  selectedEmailId.value = null
  if (router.currentRoute.value.name === 'send') emailStore.clearIdentityCache()
  sendScroll.value.resetList?.()
  sendScroll.value.refreshList();
})

function changeTimeSort() {
  params.timeSort = params.timeSort ? 0 : 1
  sendScroll.value.refreshList();
}

function jumpContent(email) {
  openContent(email)
  if (isDesktop.value) return
  router.push('/mail')
}

function openContent(email) {
  if (router.currentRoute.value.name !== 'send' || Number(email.type) !== 1) return
  if (Number(email.accountId) !== Number(accountStore.currentAccountId)) return
  emailStore.contentData.email = emailStore.toContentEmail(email)
  emailStore.contentData.delType = 'logic'
  emailStore.contentData.showStar = true
  emailStore.contentData.showReply = true
  selectedEmailId.value = email.emailId
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
    emailList(accountId, emailId, params.timeSort, size, 1, full)
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
.sent-workspace { position: relative; height: 100%; min-width: 0; background: var(--reading-surface); }
.sent-workspace.with-preview { display: grid; grid-template-columns: var(--mail-list-w) minmax(0, 1fr); }
.mail-list-pane { min-width: 0; height: 100%; overflow: hidden; background: var(--mail-list-surface); border-right: 1px solid var(--border); }
.mail-preview-pane { min-width: 0; height: 100%; overflow: hidden; background: var(--reading-surface); }
@media (max-width: 767px) {
  .mail-list-pane :deep(.email-row) { padding-right: 12px; padding-left: 8px; }
}

.icon {
  cursor: pointer;
}
</style>
