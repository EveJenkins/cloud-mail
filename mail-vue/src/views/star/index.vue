<template>
  <div class="star-workspace" :class="{ 'with-preview': isDesktop }">
    <section class="mail-list-pane">
      <emailScroll type="star" ref="scroll"
               :allow-star="false"
               :cancel-success="cancelStar"
               :getEmailList="getEmailList"
               :emailDelete="emailDelete"
               :star-add="starAdd"
               :star-cancel="starCancel"
               @jump="jumpContent"
               @list-loaded="syncSelection"
               actionLeft="6px"
               :show-account-icon="false"
               :show-inbox-summary="true"
               :summary-title="settingStore.lang === 'zh' ? '星标邮件' : 'Starred'"
               :empty-title="settingStore.lang === 'zh' ? '还没有星标邮件' : 'No starred messages yet'"
               :empty-description="settingStore.lang === 'zh' ? '加星的邮件会集中显示在这里' : 'Starred messages will appear here'"
               empty-icon="solar:star-fall-minimalistic-2-linear"
               :selected-id="selectedEmailId"
      >
        <template #empty-actions>
          <button class="primary" type="button" @click="router.push({name: 'email'})"><Icon icon="hugeicons:mailbox-01" width="15" />{{ settingStore.lang === 'zh' ? '返回收件箱' : 'Go to inbox' }}</button>
        </template>
      </emailScroll>
    </section>
    <section class="mail-preview-pane" v-if="isDesktop">
      <Content v-if="selectedEmailId" :key="`star:${selectedEmailId}`" embedded @close="selectedEmailId = null" />
      <MailPreviewEmpty
          v-else
          icon="solar:star-fall-minimalistic-2-linear"
          :title="settingStore.lang === 'zh' ? '选择一封星标邮件' : 'Select a starred message'"
          :description="settingStore.lang === 'zh' ? '重要邮件的正文、附件和会话会显示在这里' : 'Important message content, attachments and conversations appear here'"
      >
        <template #actions>
          <button class="primary" type="button" @click="router.push({name: 'email'})"><Icon icon="hugeicons:mailbox-01" width="16" />{{ settingStore.lang === 'zh' ? '返回收件箱' : 'Go to inbox' }}</button>
          <button type="button" @click="scroll.refreshList?.()"><Icon icon="solar:refresh-linear" width="16" />{{ settingStore.lang === 'zh' ? '刷新列表' : 'Refresh' }}</button>
        </template>
      </MailPreviewEmpty>
    </section>
  </div>
</template>

<script setup>
import emailScroll from "@/components/email-scroll/index.vue"
import {emailDelete} from "@/request/email.js";
import {starAdd, starCancel, starList} from "@/request/star.js";
import {useEmailStore} from "@/store/email.js";
import {useAccountStore} from "@/store/account.js";
import {useSettingStore} from "@/store/setting.js";
import {defineOptions, nextTick, onActivated, onBeforeMount, onBeforeUnmount, onMounted, ref, watch} from "vue";
import router from "@/router/index.js";
import {Icon} from "@iconify/vue";
import Content from '@/views/content/index.vue'
import MailPreviewEmpty from '@/components/mail-preview-empty/index.vue'

defineOptions({
  name: 'star'
})

const scroll = ref({})
const emailStore = useEmailStore();
const accountStore = useAccountStore();
const settingStore = useSettingStore();
const isDesktop = ref(window.innerWidth >= 1280)
const isPhone = ref(window.innerWidth < 768)
const selectedEmailId = ref(null)

function handleViewport() {
  isDesktop.value = window.innerWidth >= 1280
  isPhone.value = window.innerWidth < 768
}

function jumpContent(email) {
  openContent(email)
  if (isDesktop.value) return
  router.push('/mail')
}

function openContent(email) {
  emailStore.contentData.email = emailStore.toContentEmail(email)
  emailStore.contentData.delType = 'logic'
  emailStore.contentData.showStar = true
  emailStore.contentData.showReply = true
  selectedEmailId.value = email.emailId
}

// 切换邮箱身份：清空列表与详情，避免残留其他身份的星标邮件
watch(() => accountStore.currentAccountId, async (accountId, previousAccountId) => {
  if (Number(accountId) === Number(previousAccountId)) return
  selectedEmailId.value = null
  emailStore.clearIdentityCache()
  scroll.value.resetList?.()
  await nextTick()
  await scroll.value.refreshList?.()
}, {flush: 'sync'})

function getEmailList(emailId, size) {
  return emailStore.fetchList(full => starList(emailId, size, full, accountStore.currentAccountId))
}

function cancelStar(email) {
  emailStore.cancelStarEmailId = email.emailId
  scroll.value.deleteEmail([email.emailId])
  if (selectedEmailId.value === email.emailId) selectedEmailId.value = null
}

onMounted(() => {
  emailStore.starScroll = scroll
  window.addEventListener('resize', handleViewport)
})

onBeforeMount(() => {
  selectedEmailId.value = null
  emailStore.clearContent()
})

onBeforeUnmount(() => window.removeEventListener('resize', handleViewport))

onActivated(async () => {
  await nextTick()
  syncSelection()
})

function syncSelection() {
  const list = scroll.value?.emailList || []
  const selected = list.find(item => Number(item.emailId) === Number(selectedEmailId.value)) || list[0]
  if (selected) openContent(selected)
  else {
    selectedEmailId.value = null
    emailStore.clearContent()
  }
}

watch(() => scroll.value?.emailList?.[0]?.emailId, () => {
  if (isDesktop.value && !selectedEmailId.value && scroll.value?.emailList?.length) {
    syncSelection()
  }
})

watch(
  () => [selectedEmailId.value, emailStore.contentData.email],
  () => {
    if (!isDesktop.value || !selectedEmailId.value) return
    const selected = scroll.value?.emailList?.find(item => Number(item.emailId) === Number(selectedEmailId.value))
    if (!selected) return
    if (!emailStore.sameEmailIdentity(selected, emailStore.contentData.email)) openContent(selected)
  },
  {flush: 'sync'}
)

</script>

<style lang="scss" scoped>
.star-workspace { height: 100%; min-width: 0; background: var(--reading-surface); }
.star-workspace.with-preview { display: grid; grid-template-columns: var(--mail-list-w) minmax(0, 1fr); }
.mail-list-pane { min-width: 0; height: 100%; overflow: hidden; background: var(--mail-list-surface); border-right: 1px solid var(--border); }
.mail-preview-pane { min-width: 0; height: 100%; overflow: hidden; background: var(--reading-surface); }
@media (max-width: 767px) {
  .mail-list-pane :deep(.email-row) { padding-right: 12px; padding-left: 8px; }
}
</style>
