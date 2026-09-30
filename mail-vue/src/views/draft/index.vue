<template>
  <div class="draft-workspace" :class="{ 'with-preview': isDesktop }">
    <section class="mail-list-pane">
      <emailScroll ref="scroll"
               :allow-star="false"
               :getEmailList="getEmailList"
               :emailDelete="emailDelete"
               :star-add="starAdd"
               :star-cancel="starCancel"
               @jump="jumpContent"
               actionLeft="6px"
               :show-account-icon="false"
               :show-first-loading="false"
               :showStar="false"
               @delete-draft="deleteDraft"
               :type="'draft'"
               :show-inbox-summary="true"
               :summary-title="settingStore.lang === 'zh' ? '草稿箱' : 'Drafts'"
               :empty-title="settingStore.lang === 'zh' ? '还没有草稿' : 'No drafts yet'"
               :empty-description="settingStore.lang === 'zh' ? '未完成的邮件会保存在这里' : 'Unfinished messages will be saved here'"
               empty-icon="solar:document-add-linear"
               :selected-id="selectedDraft?.draftId"
               :row-height="isDesktop ? 100 : (isPhone ? 100 : 0)"
  >
    <template #name="props">
      <span class="send-email">{{ props.email.receiveEmail?.join(',') || '(' + $t('noRecipient') + ')' }}</span>
    </template>
    <template #subject="props">
      {{ props.email.subject || '(' + $t('noSubject') + ')' }}
    </template>
    <template #row-actions="props">
      <button
          type="button"
          class="draft-row-delete"
          :title="settingStore.lang === 'zh' ? '删除草稿' : 'Delete draft'"
          @click.stop="confirmDeleteDraft([props.email.draftId])"
      >
        <Icon icon="solar:trash-bin-trash-linear" width="16" />
      </button>
    </template>
    <template #empty-actions>
      <button class="primary" type="button" @click="uiStore.writerRef?.open?.()"><Icon icon="solar:pen-new-square-linear" width="15" />{{ settingStore.lang === 'zh' ? '新建邮件' : 'New message' }}</button>
    </template>
      </emailScroll>
    </section>
    <section class="draft-preview-pane" v-if="isDesktop">
      <div class="draft-header-actions" v-if="selectedDraft">
        <button
            type="button"
            class="draft-detail-action icon-only"
            :title="settingStore.lang === 'zh' ? '删除草稿' : 'Delete draft'"
            @click="confirmDeleteDraft([selectedDraft.draftId])"
        >
          <Icon icon="uiw:delete" width="16" />
        </button>
        <button type="button" class="draft-detail-action" @click="editSelectedDraft">
          <Icon icon="solar:pen-new-square-linear" width="17" />
          {{ settingStore.lang === 'zh' ? '继续编辑' : 'Continue editing' }}
        </button>
      </div>
      <div class="draft-preview-scroll" v-if="selectedDraft">
        <div class="draft-preview">
          <span class="draft-badge">{{ settingStore.lang === 'zh' ? '草稿' : 'Draft' }}</span>
          <h1>{{ selectedDraft.subject || (settingStore.lang === 'zh' ? '（无主题）' : '(No subject)') }}</h1>
          <div class="draft-meta">
            <span>{{ settingStore.lang === 'zh' ? '收件人' : 'To' }}</span>
            <strong>{{ selectedDraft.receiveEmail?.join(', ') || (settingStore.lang === 'zh' ? '尚未添加收件人' : 'No recipients') }}</strong>
          </div>
          <div class="draft-body">
            <ShadowHtml v-if="selectedDraft.content" :html="selectedDraft.content" comfortable />
            <pre v-else>{{ selectedDraft.text || (settingStore.lang === 'zh' ? '尚未填写正文' : 'No content yet') }}</pre>
          </div>
          <div class="draft-attachments" v-if="selectedDraft.attachments?.length">
            <Icon icon="solar:paperclip-linear" width="17" />
            {{ selectedDraft.attachments.length }} {{ settingStore.lang === 'zh' ? '个附件' : 'attachments' }}
          </div>
        </div>
      </div>
      <MailPreviewEmpty
          v-else
          icon="solar:document-add-linear"
          :title="settingStore.lang === 'zh' ? '选择一封草稿' : 'Select a draft'"
          :description="settingStore.lang === 'zh' ? '预览未完成内容，或继续编辑后发送' : 'Preview unfinished content or continue editing before sending'"
      >
        <template #actions>
          <button class="primary" type="button" @click="uiStore.writerRef?.open?.()"><Icon icon="solar:pen-new-square-linear" width="16" />{{ settingStore.lang === 'zh' ? '新建邮件' : 'New message' }}</button>
        </template>
      </MailPreviewEmpty>
    </section>
  </div>
</template>

<script setup>
import emailScroll from "@/components/email-scroll/index.vue"
import {emailDelete} from "@/request/email.js";
import {starAdd, starCancel} from "@/request/star.js";
import {defineOptions, onBeforeUnmount, onMounted, ref, watch, toRaw} from "vue";
import {useUiStore} from "@/store/ui.js";
import {userDraftStore} from "@/store/draft.js";
import db from "@/db/db.js"
import {useSettingStore} from "@/store/setting.js";
import {Icon} from "@iconify/vue";
import ShadowHtml from '@/components/shadow-html/index.vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import MailPreviewEmpty from '@/components/mail-preview-empty/index.vue'

defineOptions({
  name: 'draft'
})

const draftStore = userDraftStore();
const uiStore = useUiStore();
const settingStore = useSettingStore();
const scroll = ref({})
const isDesktop = ref(window.innerWidth >= 1280)
const isPhone = ref(window.innerWidth < 768)
const selectedDraft = ref(null)

function handleViewport() {
  isDesktop.value = window.innerWidth >= 1280
  isPhone.value = window.innerWidth < 768
}

onMounted(() => window.addEventListener('resize', handleViewport))
onBeforeUnmount(() => window.removeEventListener('resize', handleViewport))

watch(() => draftStore.setDraft, async () => {

  const draft = toRaw(draftStore.setDraft)
  const draftId = draft.draftId
  const attachments = toRaw(draftStore.setDraft.attachments)

  delete draft.draftId
  delete draft.attachments

  if (!draft.content && !draft.subject && !(draft.receiveEmail.length > 0)) {
    await db.value.draft.delete(draftId);
    await db.value.att.delete(draftId);
    draftStore.refreshList++
    return;
  }

  await db.value.draft.update(draftId, draft);
  await db.value.att.update(draftId, {attachments: attachments});
  draftStore.refreshList++
}, {
  deep: true
})

watch(() => draftStore.refreshList, async () => {
  const {list} = await getEmailList();
    scroll.value.emailList.length = 0
    scroll.value.handleList(list);
    scroll.value.emailList.push(...list)
    if (selectedDraft.value) {
      const refreshed = list.find(item => item.draftId === selectedDraft.value.draftId)
      if (refreshed) await selectDraft(refreshed)
    }
})

watch(() => scroll.value?.emailList?.[0]?.draftId, async () => {
  if (isDesktop.value && !selectedDraft.value && scroll.value?.emailList?.length) {
    await selectDraft(scroll.value.emailList[0])
  }
})

function getEmailList() {
  return new Promise((resolve, reject) => {
    db.value.draft.orderBy('createTime').reverse().toArray().then(list => {
      resolve({list, latestEmail: list[0] || null, total: list.length})
    })
  })
}

async function deleteDraft(draftIds) {
  if (!draftIds?.length) return
  await db.value.draft.bulkDelete(draftIds);
  await db.value.att.bulkDelete(draftIds);
  if (draftIds.includes(selectedDraft.value?.draftId)) selectedDraft.value = null
  draftStore.refreshList++
}

function confirmDeleteDraft(draftIds) {
  ElMessageBox.confirm(
      settingStore.lang === 'zh' ? '确认删除这封草稿吗？' : 'Delete this draft?',
      settingStore.lang === 'zh' ? '删除草稿' : 'Delete draft',
      {
        confirmButtonText: settingStore.lang === 'zh' ? '删除' : 'Delete',
        cancelButtonText: settingStore.lang === 'zh' ? '取消' : 'Cancel',
        type: 'warning',
      }
  ).then(async () => {
    await deleteDraft(draftIds)
    ElMessage({
      message: settingStore.lang === 'zh' ? '草稿已删除' : 'Draft deleted',
      type: 'success',
      plain: true,
    })
  }).catch(() => {})
}

async function jumpContent(email) {
  await selectDraft(email)
  if (isDesktop.value) return
  editSelectedDraft()
}

async function selectDraft(email) {
  const att = await db.value.att.get(email.draftId)
  selectedDraft.value = { ...email, attachments: att?.attachments || [] }
}

function editSelectedDraft() {
  if (selectedDraft.value) uiStore.writerRef.openDraft({ ...selectedDraft.value });
}

</script>
<style lang="scss" scoped>
.draft-workspace { height: 100%; min-width: 0; background: var(--reading-surface); }
.draft-workspace.with-preview { display: grid; grid-template-columns: var(--mail-list-w) minmax(0, 1fr); }
.mail-list-pane { min-width: 0; height: 100%; overflow: hidden; background: var(--mail-list-surface); border-right: 1px solid var(--border); }
.draft-preview-pane { min-width: 0; height: 100%; overflow: hidden; background: var(--reading-surface); }
.draft-header-actions { min-height: 50px; padding: 6px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; background: var(--surface); border-bottom: 1px solid var(--border); }
.draft-detail-action { height: 36px; padding: 0 11px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; color: var(--text-2); border: 1px solid var(--border); border-radius: var(--r-md); background: var(--surface); font-size: 12.5px; font-weight: 600; cursor: pointer; transition: color var(--dur) var(--ease), border-color var(--dur) var(--ease), background var(--dur) var(--ease); }
.draft-detail-action:hover { color: var(--brand-700); border-color: color-mix(in srgb, var(--brand-500) 42%, var(--border)); background: var(--brand-soft); }
.draft-detail-action.icon-only { width: 36px; padding: 0; }
.draft-preview-scroll { height: calc(100% - 50px); overflow-y: auto; }
.draft-preview { max-width: 860px; margin: 0 auto; padding: 24px; }
.draft-badge { height: 24px; padding: 0 9px; display: inline-flex; align-items: center; color: var(--brand-600); background: var(--brand-soft); border-radius: 6px; font-size: 12px; font-weight: 700; }
.draft-row-delete { width: 32px; height: 32px; margin-left: auto; display: grid; flex: 0 0 auto; place-items: center; color: var(--text-3); border: 1px solid transparent; border-radius: 8px; background: transparent; cursor: pointer; opacity: 0; transition: opacity var(--dur) var(--ease), color var(--dur) var(--ease), border-color var(--dur) var(--ease), background var(--dur) var(--ease); }
:deep(.email-row:hover) .draft-row-delete, .draft-row-delete:focus-visible { opacity: 1; }
.draft-row-delete:hover { color: var(--danger); border-color: color-mix(in srgb, var(--danger) 30%, var(--border)); background: color-mix(in srgb, var(--danger) 8%, transparent); }
.draft-preview h1 { margin: 16px 0 14px; color: var(--text); font-size: 21px; line-height: 1.35; }
.draft-meta { padding: 13px 16px; display: flex; align-items: flex-start; gap: 12px; color: var(--text-3); border: 1px solid var(--border); border-radius: var(--r-md) var(--r-md) 0 0; background: var(--surface-2); font-size: 12.5px; }
.draft-meta strong { min-width: 0; color: var(--text-2); overflow-wrap: anywhere; }
.draft-body { min-height: 220px; padding: 20px; color: var(--text); border: 1px solid var(--border); border-top: 0; border-radius: 0 0 var(--r-lg) var(--r-lg); background: var(--surface); box-shadow: var(--sh-1); }
.draft-body pre { margin: 0; color: var(--text-3); font: inherit; white-space: pre-wrap; }
.draft-attachments { margin-top: 16px; padding: 13px 16px; display: flex; align-items: center; gap: 8px; color: var(--text-2); border: 1px solid var(--border); border-radius: var(--r-md); background: var(--surface); font-size: 12.5px; }
.send-email {
  font-weight: normal;
}
@media (max-width: 767px) {
  .mail-list-pane :deep(.email-row) { padding-right: 12px; padding-left: 8px; }
  .draft-row-delete { opacity: 1; }
}
</style>
