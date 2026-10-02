<template>
  <div class="deleted-workspace" :class="{ 'with-preview': isDesktop }">
    <section class="mail-list-pane">
      <EmailScroll
        ref="scroll"
        type="trash"
        :get-email-list="getEmailList"
        :show-star="false"
        :show-account-icon="false"
        :show-inbox-summary="true"
        :selected-id="selectedEmailId"
        :empty-title="zh ? '没有已删除邮件' : 'No deleted messages'"
        :empty-description="zh ? '删除的邮件会显示在这里' : 'Deleted messages will appear here'"
        empty-icon="solar:trash-bin-trash-linear"
        @jump="openContent"
        @list-loaded="syncSelection"
      />
    </section>
    <MailPaneDivider v-if="isDesktop" />
    <section v-if="isDesktop" class="mail-preview-pane">
      <Content
        v-if="selectedEmailId"
        :key="`deleted:${accountStore.currentAccountId}:${selectedEmailId}`"
        embedded
        @close="selectedEmailId = null"
        @restored="handleRestored"
      />
      <MailPreviewEmpty
        v-else
        icon="solar:trash-bin-trash-linear"
        :title="zh ? '选择一封已删除邮件' : 'Select a deleted message'"
        :description="zh ? '可以查看邮件并将其恢复到原文件夹' : 'View the message and restore it to its original folder'"
      />
    </section>
  </div>
</template>

<script setup>
import { computed, defineOptions, nextTick, onActivated, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import router from '@/router/index.js'
import EmailScroll from '@/components/email-scroll/index.vue'
import MailPaneDivider from '@/components/mail-pane-divider/index.vue'
import MailPreviewEmpty from '@/components/mail-preview-empty/index.vue'
import Content from '@/views/content/index.vue'
import { emailList } from '@/request/email.js'
import { useAccountStore } from '@/store/account.js'
import { useEmailStore } from '@/store/email.js'
import { useSettingStore } from '@/store/setting.js'

defineOptions({ name: 'deleted' })

const accountStore = useAccountStore()
const emailStore = useEmailStore()
const settingStore = useSettingStore()
const zh = computed(() => settingStore.lang === 'zh')
const scroll = ref(null)
const selectedEmailId = ref(null)
const isDesktop = ref(window.innerWidth >= 1280)

function handleViewport() {
  isDesktop.value = window.innerWidth >= 1280
}

function getEmailList(emailId, size) {
  const accountId = accountStore.currentAccountId
  return emailStore.fetchList(full => emailList(accountId, emailId, 0, size, 2, full, 1))
}

function openContent(item) {
  if (router.currentRoute.value.name !== 'deleted') return
  if (Number(item.accountId) !== Number(accountStore.currentAccountId) || Number(item.isDel) !== 1) return
  emailStore.contentData.email = emailStore.toContentEmail(item)
  emailStore.contentData.delType = 'trash'
  emailStore.contentData.showStar = false
  emailStore.contentData.showReply = false
  emailStore.contentData.showUnread = false
  selectedEmailId.value = item.emailId
  if (!isDesktop.value) router.push('/mail')
}

function syncSelection() {
  if (router.currentRoute.value.name !== 'deleted' || !isDesktop.value) return
  const list = scroll.value?.emailList || []
  const selected = list.find(item => Number(item.emailId) === Number(selectedEmailId.value)) || list[0]
  if (selected) openContent(selected)
  else {
    selectedEmailId.value = null
    emailStore.clearContent()
  }
}

async function handleRestored() {
  selectedEmailId.value = null
  await scroll.value?.refreshList?.()
  syncSelection()
}

watch(() => accountStore.currentAccountId, async (accountId, previousAccountId) => {
  if (Number(accountId) === Number(previousAccountId)) return
  selectedEmailId.value = null
  if (router.currentRoute.value.name === 'deleted') emailStore.clearIdentityCache()
  scroll.value?.resetList?.()
  await nextTick()
  await scroll.value?.refreshList?.()
}, { flush: 'sync' })

onMounted(() => window.addEventListener('resize', handleViewport))
onBeforeUnmount(() => window.removeEventListener('resize', handleViewport))
onActivated(async () => {
  if (router.currentRoute.value.name !== 'deleted') return
  await nextTick()
  await scroll.value?.refreshList?.()
  syncSelection()
})
</script>

<style scoped>
.deleted-workspace { position: relative; height: 100%; min-width: 0; background: var(--reading-surface); }
.deleted-workspace.with-preview { display: grid; grid-template-columns: var(--mail-list-w) minmax(0, 1fr); }
.mail-list-pane { min-width: 0; height: 100%; overflow: hidden; background: var(--mail-list-surface); border-right: 1px solid var(--border); }
.mail-preview-pane { min-width: 0; height: 100%; overflow: hidden; background: var(--reading-surface); }
</style>
