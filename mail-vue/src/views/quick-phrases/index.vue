<template>
  <div class="phrases-page">
    <div class="phrases-shell">
      <header class="page-head">
        <div class="heading-copy">
          <span class="heading-icon"><Icon icon="solar:notes-minimalistic-linear" width="23" /></span>
          <div>
            <h1>{{ zh ? '快捷短语' : 'Quick phrases' }}</h1>
            <p>{{ zh ? '管理写邮件时常用的报价、交期和业务回复内容' : 'Manage reusable sales and service responses for the composer' }}</p>
          </div>
        </div>
        <div class="head-actions">
          <label class="search-box"><Icon icon="solar:magnifer-linear" width="16" /><input v-model.trim="keyword" :placeholder="zh ? '搜索短语或内容' : 'Search phrases'" /><button v-if="keyword" type="button" :aria-label="zh ? '清除搜索' : 'Clear search'" @click.prevent="keyword = ''"><Icon icon="solar:close-circle-linear" width="16" /></button></label>
          <button class="secondary-button" type="button" @click="resetDefaults"><Icon icon="solar:restart-linear" width="16" />{{ zh ? '恢复默认' : 'Restore defaults' }}</button>
          <button class="primary-button" type="button" @click="openCreate"><Icon icon="solar:add-circle-linear" width="17" />{{ zh ? '新建短语' : 'New phrase' }}</button>
        </div>
      </header>

      <section class="summary-row">
        <div><strong>{{ phrases.length }}</strong><span>{{ zh ? '全部短语' : 'Total phrases' }}</span></div>
        <div><strong>{{ customCount }}</strong><span>{{ zh ? '自定义短语' : 'Custom phrases' }}</span></div>
        <p><Icon icon="solar:info-circle-linear" width="16" />{{ zh ? '在写邮件页面点击短语即可插入正文，修改会自动保存。' : 'Select a phrase in the composer to insert it. Changes save automatically.' }}</p>
      </section>

      <section class="phrases-card">
        <div class="table-head"><span>{{ zh ? '名称' : 'Label' }}</span><span>{{ zh ? '插入内容' : 'Content' }}</span><span>{{ zh ? '类型' : 'Type' }}</span><span>{{ zh ? '操作' : 'Actions' }}</span></div>
        <div v-if="filteredPhrases.length" class="phrase-rows">
          <article v-for="phrase in filteredPhrases" :key="phrase.id" class="phrase-row">
            <div class="label-cell"><span class="phrase-icon"><Icon icon="solar:text-square-linear" width="18" /></span><strong>{{ phrase.label }}</strong></div>
            <p>{{ phrase.text }}</p>
            <span><em :class="['type-badge', {custom: !isDefault(phrase)}]">{{ isDefault(phrase) ? (zh ? '默认' : 'Default') : (zh ? '自定义' : 'Custom') }}</em></span>
            <div class="row-actions">
              <button type="button" @click="copyPhrase(phrase)"><Icon icon="solar:copy-linear" width="16" />{{ zh ? '复制' : 'Copy' }}</button>
              <button type="button" @click="openEdit(phrase)"><Icon icon="solar:pen-new-square-linear" width="16" />{{ zh ? '编辑' : 'Edit' }}</button>
              <button class="danger" type="button" :title="zh ? '删除' : 'Delete'" @click="removePhrase(phrase)"><Icon icon="solar:trash-bin-trash-linear" width="16" /></button>
            </div>
          </article>
        </div>
        <div v-else class="empty-state"><span class="empty-icon"><Icon :icon="keyword ? 'solar:magnifer-linear' : 'solar:notes-minimalistic-linear'" width="30" /></span><strong>{{ keyword ? (zh ? '没有匹配的快捷短语' : 'No matching phrases') : (zh ? '还没有快捷短语' : 'No quick phrases yet') }}</strong><span>{{ keyword ? (zh ? '换个关键词，或清除搜索条件' : 'Try another keyword or clear the search') : (zh ? '新建一条常用回复，写邮件时即可快速插入。' : 'Create a reusable response for the composer.') }}</span><button type="button" @click="keyword ? keyword = '' : openCreate()">{{ keyword ? (zh ? '清除搜索' : 'Clear search') : (zh ? '新建短语' : 'New phrase') }}</button></div>
      </section>
    </div>

    <el-dialog v-model="dialogOpen" :title="editingId ? (zh ? '编辑快捷短语' : 'Edit quick phrase') : (zh ? '新建快捷短语' : 'New quick phrase')" width="min(520px, calc(100vw - 28px))">
      <div class="phrase-form">
        <label><span>{{ zh ? '短语名称' : 'Label' }}</span><el-input v-model.trim="form.label" maxlength="20" show-word-limit :placeholder="zh ? '例如：报价有效期' : 'e.g. Quote validity'" /></label>
        <label><span>{{ zh ? '插入内容' : 'Content' }}</span><el-input v-model="form.text" type="textarea" :rows="6" maxlength="500" show-word-limit :placeholder="zh ? '输入插入邮件正文的完整内容' : 'Enter the full content to insert'" /></label>
      </div>
      <template #footer><el-button @click="dialogOpen = false">{{ zh ? '取消' : 'Cancel' }}</el-button><el-button type="primary" @click="savePhrase">{{ zh ? '保存' : 'Save' }}</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useWriterStore } from '@/store/writer.js'
import { useSettingStore } from '@/store/setting.js'

defineOptions({name: 'quickPhrases'})

const writerStore = useWriterStore()
const settingStore = useSettingStore()
const zh = computed(() => settingStore.lang === 'zh')
const keyword = ref('')
const dialogOpen = ref(false)
const editingId = ref('')
const form = reactive({label: '', text: ''})

const defaults = computed(() => (zh.value ? [
  {id:'default-quote', label:'报价有效期', text:'本报价自发出之日起 30 天内有效。'},
  {id:'default-lead', label:'交期说明', text:'具体交付时间将在订单确认后另行通知。'},
  {id:'default-payment', label:'付款条款', text:'付款条款请以双方最终确认的订单为准。'},
  {id:'default-warranty', label:'质保条款', text:'产品质保范围与期限以正式合同约定为准。'},
  {id:'default-drawing', label:'索要图纸', text:'烦请提供对应型号、OE 号或技术图纸，以便进一步确认。'},
] : [
  {id:'default-quote', label:'Quote validity', text:'This quotation is valid for 30 days from the date of issue.'},
  {id:'default-lead', label:'Lead time', text:'The final lead time will be confirmed after the order is placed.'},
  {id:'default-payment', label:'Payment terms', text:'Payment terms are subject to the final confirmed order.'},
  {id:'default-warranty', label:'Warranty', text:'Warranty coverage and duration are subject to the final contract.'},
  {id:'default-drawing', label:'Request drawing', text:'Please provide the model, OE number, or technical drawing for further confirmation.'},
]))

const phrases = computed(() => Array.isArray(writerStore.quickPhrases) ? writerStore.quickPhrases : defaults.value)
const filteredPhrases = computed(() => {
  const query = keyword.value.toLowerCase()
  return query ? phrases.value.filter(item => `${item.label} ${item.text}`.toLowerCase().includes(query)) : phrases.value
})
const customCount = computed(() => phrases.value.filter(item => !isDefault(item)).length)
const isDefault = phrase => String(phrase.id || '').startsWith('default-')

function materialize() {
  if (!Array.isArray(writerStore.quickPhrases)) writerStore.quickPhrases = defaults.value.map(item => ({...item}))
}
function openCreate() { editingId.value = ''; form.label = ''; form.text = ''; dialogOpen.value = true }
function openEdit(phrase) { materialize(); editingId.value = phrase.id; form.label = phrase.label; form.text = phrase.text; dialogOpen.value = true }
function savePhrase() {
  const label = form.label.trim(); const text = form.text.trim()
  if (!label || !text) { ElMessage({message: zh.value ? '请填写短语名称和插入内容' : 'Enter a label and content', type: 'warning', plain: true}); return }
  materialize()
  const item = {id: editingId.value || `custom-${Date.now()}`, label, text}
  const index = writerStore.quickPhrases.findIndex(row => row.id === editingId.value)
  if (index >= 0) writerStore.quickPhrases.splice(index, 1, item); else writerStore.quickPhrases.unshift(item)
  dialogOpen.value = false
  ElMessage({message: zh.value ? '快捷短语已保存' : 'Quick phrase saved', type: 'success', plain: true})
}
function removePhrase(phrase) {
  ElMessageBox.confirm(zh.value ? `删除“${phrase.label}”？` : `Delete “${phrase.label}”?`, zh.value ? '删除快捷短语' : 'Delete phrase', {type: 'warning'}).then(() => {
    materialize(); writerStore.quickPhrases = writerStore.quickPhrases.filter(item => item.id !== phrase.id)
    ElMessage({message: zh.value ? '快捷短语已删除' : 'Quick phrase deleted', type: 'success', plain: true})
  }).catch(() => {})
}
function resetDefaults() {
  ElMessageBox.confirm(zh.value ? '这会替换当前全部短语，是否继续？' : 'This replaces all current phrases. Continue?', zh.value ? '恢复默认短语' : 'Restore defaults', {type: 'warning'}).then(() => {
    writerStore.quickPhrases = defaults.value.map(item => ({...item}))
    keyword.value = ''
    ElMessage({message: zh.value ? '已恢复默认短语' : 'Default phrases restored', type: 'success', plain: true})
  }).catch(() => {})
}
async function copyPhrase(phrase) {
  try {
    await navigator.clipboard.writeText(phrase.text)
    ElMessage({message: zh.value ? '已复制到剪贴板' : 'Copied to clipboard', type: 'success', plain: true})
  } catch {
    ElMessage({message: zh.value ? '复制失败，请手动复制' : 'Copy failed. Please copy manually.', type: 'warning', plain: true})
  }
}
</script>

<style lang="scss" scoped>
.phrases-page { height: 100%; overflow-y: auto; background: var(--bg); }
.phrases-shell { width: min(1180px, 100%); margin: 0 auto; padding: 24px; }
.page-head, .heading-copy, .head-actions, .summary-row, .label-cell, .row-actions { display: flex; align-items: center; }
.page-head { gap: 18px; margin-bottom: 16px; }
.heading-copy { min-width: 0; gap: 12px; }
.heading-icon { width: 36px; height: 36px; flex: 0 0 36px; display: grid; place-items: center; color: #fff; border-radius: var(--r-md); background: var(--brand-600); }
.page-head h1 { margin: 0; color: var(--text); font-size: 19px; }
.page-head p { margin: 3px 0 0; color: var(--text-3); font-size: 12.5px; }
.head-actions { margin-left: auto; gap: 8px; }
.search-box { width: 220px; height: 38px; padding: 0 11px; display: flex; align-items: center; gap: 7px; color: var(--text-3); border: 1px solid var(--border); border-radius: var(--r-sm); background: var(--surface); }
.search-box input { min-width: 0; flex: 1; color: var(--text); font-size: 12px; }
.search-box > button { width: 24px; height: 24px; flex: 0 0 24px; display: grid; place-items: center; color: var(--text-3); border-radius: 6px; cursor: pointer; }
.search-box > button:hover { color: var(--brand-600); background: var(--brand-soft); }
.primary-button, .secondary-button { height: 38px; padding: 0 12px; display: inline-flex; align-items: center; gap: 6px; border-radius: var(--r-sm); font-size: 12px; font-weight: 700; cursor: pointer; }
.primary-button { color: #fff; background: var(--brand-600); }
.secondary-button { color: var(--text-2); border: 1px solid var(--border); background: var(--surface); }
.summary-row { min-height: 70px; gap: 28px; margin-bottom: 16px; padding: 12px 16px; border: 1px solid var(--border); border-radius: var(--r-lg); background: var(--surface); box-shadow: var(--sh-1); }
.summary-row > div { min-width: 90px; }
.summary-row strong, .summary-row span { display: block; }
.summary-row strong { color: var(--text); font-size: 19px; }
.summary-row span { margin-top: 2px; color: var(--text-3); font-size: 11px; }
.summary-row p { margin: 0 0 0 auto; display: flex; align-items: center; gap: 6px; color: var(--text-3); font-size: 11.5px; }
.phrases-card { overflow: hidden; border: 1px solid var(--border); border-radius: var(--r-lg); background: var(--surface); box-shadow: var(--sh-1); }
.table-head, .phrase-row { display: grid; grid-template-columns: 190px minmax(260px, 1fr) 90px 230px; align-items: center; gap: 16px; }
.table-head { min-height: 42px; padding: 0 16px; color: var(--text-3); border-bottom: 1px solid var(--border); background: var(--surface-2); font-size: 11.5px; font-weight: 700; }
.phrase-row { min-height: 76px; padding: 12px 16px; }
.phrase-row + .phrase-row { border-top: 1px solid var(--border); }
.phrase-row:hover { background: var(--surface-2); }
.label-cell { min-width: 0; gap: 9px; }
.label-cell strong { overflow: hidden; color: var(--text); font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.phrase-icon { width: 32px; height: 32px; flex: 0 0 32px; display: grid; place-items: center; color: var(--brand-600); border-radius: 8px; background: var(--brand-soft); }
.phrase-row p { margin: 0; overflow: hidden; color: var(--text-2); font-size: 12.5px; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.type-badge { padding: 4px 8px; color: var(--text-3); border-radius: 6px; background: var(--surface-3); font-size: 10.5px; font-style: normal; font-weight: 700; }
.type-badge.custom { color: var(--brand-700); background: var(--brand-soft); }
.row-actions { justify-content: flex-end; gap: 5px; }
.row-actions button { height: 32px; padding: 0 9px; display: inline-flex; align-items: center; gap: 4px; color: var(--text-2); border: 1px solid var(--border); border-radius: 8px; background: var(--surface); font-size: 11.5px; cursor: pointer; }
.row-actions button:hover { color: var(--brand-600); background: var(--brand-soft); }
.row-actions .danger { width: 32px; padding: 0; justify-content: center; }
.row-actions .danger:hover { color: var(--danger); }
.empty-state { min-height: 320px; padding: 28px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-3); text-align: center; }
.empty-state .empty-icon { width: 52px; height: 52px; display: grid; place-items: center; color: var(--brand-600); border-radius: var(--r-lg); background: var(--brand-soft); }
.empty-state strong { margin-top: 12px; color: var(--text-2); }
.empty-state > span:not(.empty-icon) { margin-top: 4px; font-size: 12px; }
.empty-state button { margin-top: 14px; padding: 8px 12px; color: #fff; border: 0; border-radius: 8px; background: var(--brand-600); cursor: pointer; }
.phrase-form { display: grid; gap: 16px; }
.phrase-form label > span { display: block; margin-bottom: 6px; color: var(--text-2); font-size: 12px; font-weight: 700; }
@media (max-width: 900px) { .phrases-shell { padding: 16px; } .page-head { align-items: flex-start; flex-direction: column; } .head-actions { width: 100%; margin-left: 0; } .search-box { flex: 1; width: auto; } .summary-row p { display: none; } .table-head { display: none; } .phrase-row { grid-template-columns: minmax(0, 1fr) auto; gap: 8px 12px; } .phrase-row p { grid-column: 1 / -1; } .row-actions { grid-column: 1 / -1; justify-content: flex-start; } }
@media (max-width: 560px) { .phrases-shell { padding: 12px; } .head-actions { align-items: stretch; flex-direction: column; } .search-box { width: 100%; flex: none; } .primary-button, .secondary-button { justify-content: center; } .summary-row { gap: 18px; } }
</style>
