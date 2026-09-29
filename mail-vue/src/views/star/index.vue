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
               actionLeft="6px"
               :show-account-icon="false"
               :show-inbox-summary="true"
               :summary-title="settingStore.lang === 'zh' ? '星标邮件' : 'Starred'"
               :empty-title="settingStore.lang === 'zh' ? '还没有星标邮件' : 'No starred messages yet'"
               :empty-description="settingStore.lang === 'zh' ? '加星的邮件会集中显示在这里' : 'Starred messages will appear here'"
               :selected-id="selectedEmailId"
               :row-height="isDesktop ? 118 : (isPhone ? 118 : 0)"
      />
    </section>
    <section class="mail-preview-pane" v-if="isDesktop">
      <Content v-if="selectedEmailId" :key="`star:${selectedEmailId}`" embedded @close="selectedEmailId = null" />
      <div v-else class="preview-empty">
        <span class="preview-icon"><Icon icon="solar:star-fall-minimalistic-2-linear" width="34" height="34" /></span>
        <strong>{{ settingStore.lang === 'zh' ? '选择一封星标邮件' : 'Select a starred message' }}</strong>
        <p>{{ settingStore.lang === 'zh' ? '邮件内容和附件将在这里显示' : 'Message content and attachments appear here' }}</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import emailScroll from "@/components/email-scroll/index.vue"
import {emailDelete} from "@/request/email.js";
import {starAdd, starCancel, starList} from "@/request/star.js";
import {useEmailStore} from "@/store/email.js";
import {useSettingStore} from "@/store/setting.js";
import {defineOptions, nextTick, onActivated, onBeforeUnmount, onMounted, ref, watch} from "vue";
import router from "@/router/index.js";
import {Icon} from "@iconify/vue";
import Content from '@/views/content/index.vue'

defineOptions({
  name: 'star'
})

const scroll = ref({})
const emailStore = useEmailStore();
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

function getEmailList(emailId, size) {
  return emailStore.fetchList(full => starList(emailId, size, full))
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

onBeforeUnmount(() => window.removeEventListener('resize', handleViewport))

onActivated(async () => {
  await nextTick()
  const list = scroll.value?.emailList || []
  const selected = list.find(item => Number(item.emailId) === Number(selectedEmailId.value)) || list[0]
  if (selected) openContent(selected)
  else {
    selectedEmailId.value = null
    emailStore.clearContent()
  }
})

watch(() => scroll.value?.emailList?.[0]?.emailId, () => {
  if (isDesktop.value && !selectedEmailId.value && scroll.value?.emailList?.length) {
    openContent(scroll.value.emailList[0])
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
.preview-empty { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-3); text-align: center; }
.preview-empty strong { margin-top: 14px; color: var(--text-2); font-size: 15px; }
.preview-empty p { margin-top: 5px; font-size: 12.5px; }
.preview-icon { width: 64px; height: 64px; display: grid; place-items: center; border-radius: 20px; color: var(--brand-600); background: var(--brand-soft); }
@media (max-width: 767px) {
  .mail-list-pane :deep(.email-row) { padding-right: 12px; padding-left: 8px; }
}
</style>
