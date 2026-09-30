<template>
  <div class="signatures-page">
    <div class="page-shell">
      <header class="page-head">
        <div class="heading-copy">
          <span class="heading-icon"><Icon icon="solar:pen-new-square-linear" width="23" /></span>
          <div><h1>{{ zh ? '多语言邮件签名' : 'Multilingual signatures' }}</h1><p>{{ zh ? '为不同国家的客户配置对应语言签名，写信时自动匹配' : 'Configure localized signatures that match each recipient automatically' }}</p></div>
        </div>
        <button class="primary-button" type="button" @click="openCreate"><Icon icon="solar:add-circle-linear" width="17" />{{ zh ? '新建签名' : 'New signature' }}</button>
      </header>

      <section class="auto-note"><Icon icon="solar:global-linear" width="19" /><div><strong>{{ zh ? '自动语言规则' : 'Automatic language matching' }}</strong><p>{{ zh ? '系统按通讯录中的国家/地区选择同一签名内的语言版本；没有匹配语言时优先使用英语版本。' : 'The recipient country selects a language version within the same signature. English is used when no matching version exists.' }}</p></div></section>

      <section v-if="signatures.length" class="signature-grid">
        <article v-for="(signature, index) in signatures" :key="signature.id" class="signature-card">
          <header><div class="language-list"><button v-for="code in Object.keys(signature.translations)" :key="code" type="button" class="language-badge" :class="{active: previewLanguage(signature) === code}" @click="setPreviewLanguage(signature, code)">{{ languageName(code) }}</button><span v-if="index === 0" class="default-badge">{{ zh ? '默认' : 'Default' }}</span><span v-if="signature.translations.en" class="fallback-badge">{{ zh ? '含英语回退' : 'English fallback' }}</span></div><div class="card-actions"><button v-if="index > 0" type="button" :title="zh ? '设为默认签名' : 'Make default'" @click="makeDefault(signature)"><Icon icon="solar:star-line-duotone" width="16" /></button><button type="button" :title="zh ? '编辑签名' : 'Edit signature'" @click="openEdit(signature)"><Icon icon="solar:pen-new-square-linear" width="16" /></button><button class="danger" type="button" :title="zh ? '删除签名' : 'Delete signature'" @click="removeSignature(signature)"><Icon icon="solar:trash-bin-trash-linear" width="16" /></button></div></header>
          <h2>{{ signature.name }}</h2>
          <div class="signature-preview" v-html="signatureContentHtml(previewContent(signature))"></div>
        </article>
      </section>
      <section v-else class="empty-state"><span><Icon icon="solar:pen-new-square-linear" width="32" /></span><strong>{{ zh ? '还没有邮件签名' : 'No signatures yet' }}</strong><p>{{ zh ? '建议先创建一份签名，并在其中添加英语及常用客户语言版本。' : 'Create one signature, then add English and your customers’ language versions to it.' }}</p><button type="button" @click="openCreate">{{ zh ? '创建第一份签名' : 'Create first signature' }}</button></section>
    </div>

    <el-dialog v-model="dialogOpen" :title="editingId ? (zh ? '编辑签名' : 'Edit signature') : (zh ? '新建签名' : 'New signature')" width="min(560px, calc(100vw - 28px))">
      <div class="signature-form">
        <label><span>{{ zh ? '签名名称' : 'Signature name' }}</span><el-input v-model.trim="form.name" maxlength="30" show-word-limit :placeholder="zh ? '例如：销售经理签名' : 'e.g. Sales manager signature'" /></label>
        <div class="translation-editor">
          <div class="translation-head"><span>{{ zh ? '语言版本' : 'Language versions' }}</span><button type="button" @click="addTranslation"><Icon icon="solar:add-circle-linear" width="15" />{{ zh ? '添加语言' : 'Add language' }}</button></div>
          <div v-for="(translation, index) in form.translations" :key="translation.key" class="translation-row">
            <div class="translation-row-head"><el-select v-model="translation.language" filterable><el-option v-for="language in availableLanguages(index)" :key="language.value" :label="language.label" :value="language.value" /></el-select><button v-if="form.translations.length > 1" type="button" @click="form.translations.splice(index, 1)"><Icon icon="solar:trash-bin-trash-linear" width="16" /></button></div>
            <el-input v-model="translation.content" type="textarea" :rows="7" maxlength="12000" show-word-limit :placeholder="signaturePlaceholder" />
          </div>
        </div>
      </div>
      <template #footer><el-button @click="dialogOpen = false">{{ zh ? '取消' : 'Cancel' }}</el-button><el-button type="primary" @click="saveSignature">{{ zh ? '保存签名' : 'Save signature' }}</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import {computed, reactive, ref} from 'vue'
import {Icon} from '@iconify/vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import {useWriterStore} from '@/store/writer.js'
import {useSettingStore} from '@/store/setting.js'
import {signatureContentHtml} from '@/utils/signature.js'

defineOptions({name: 'signatures'})
const writerStore = useWriterStore()
const settingStore = useSettingStore()
const zh = computed(() => settingStore.lang === 'zh')
const dialogOpen = ref(false)
const editingId = ref('')
const form = reactive({name: '', translations: []})
const previewLanguages = reactive({})
const languages = [
  {value:'en',label:'English'}, {value:'zh',label:'简体中文'}, {value:'zh-TW',label:'繁體中文'},
  {value:'de',label:'Deutsch'}, {value:'fr',label:'Français'}, {value:'es',label:'Español'},
  {value:'pt',label:'Português'}, {value:'it',label:'Italiano'}, {value:'nl',label:'Nederlands'},
  {value:'pl',label:'Polski'}, {value:'tr',label:'Türkçe'}, {value:'ru',label:'Русский'},
  {value:'ar',label:'العربية'}, {value:'hi',label:'हिन्दी'}, {value:'ja',label:'日本語'},
  {value:'ko',label:'한국어'}, {value:'th',label:'ไทย'}, {value:'vi',label:'Tiếng Việt'},
  {value:'id',label:'Bahasa Indonesia'}, {value:'ms',label:'Bahasa Melayu'},
]
const signatures = computed(() => (Array.isArray(writerStore.signatures) ? writerStore.signatures : []).map(signature => signature.translations
    ? signature
    : {...signature, translations: {[signature.language || 'en']: signature.content || ''}}))
const signaturePlaceholder = computed(() => zh.value ? '可输入普通文本，也可粘贴完整 HTML 签名代码' : 'Enter plain text or paste complete HTML signature code')
const languageName = code => languages.find(item => item.value === code)?.label || code
const newTranslation = (language = 'en', content = '') => ({key: `${Date.now()}-${Math.random()}`, language, content})
function resetForm() {editingId.value = ''; form.name = ''; form.translations = [newTranslation()]}
function openCreate() {resetForm(); dialogOpen.value = true}
function openEdit(signature) {editingId.value = signature.id; form.name = signature.name; form.translations = Object.entries(signature.translations).map(([language, content]) => newTranslation(language, content)); dialogOpen.value = true}
function addTranslation() {const language = languages.find(item => !form.translations.some(row => row.language === item.value))?.value; if (language) form.translations.push(newTranslation(language))}
function availableLanguages(index) {const used = new Set(form.translations.filter((_, rowIndex) => rowIndex !== index).map(row => row.language)); return languages.filter(item => !used.has(item.value))}
function previewLanguage(signature) {
  const selected = previewLanguages[signature.id]
  if (selected && signature.translations[selected]) return selected
  return signature.translations.en ? 'en' : Object.keys(signature.translations)[0]
}
function setPreviewLanguage(signature, language) { previewLanguages[signature.id] = language }
function previewContent(signature) {return signature.translations[previewLanguage(signature)] || ''}
function makeDefault(signature) {
  const rows = Array.isArray(writerStore.signatures) ? [...writerStore.signatures] : []
  const index = rows.findIndex(item => item.id === signature.id)
  if (index <= 0) return
  const [item] = rows.splice(index, 1)
  rows.unshift(item)
  writerStore.signatures = rows
  ElMessage({message: zh.value ? '已设为默认签名' : 'Default signature updated', type:'success', plain:true})
}
function saveSignature() {
  const name = form.name.trim()
  const rows = form.translations.map(row => ({language: row.language, content: row.content.trim()})).filter(row => row.content)
  if (!name || !rows.length) {ElMessage({message: zh.value ? '请填写签名名称和至少一个语言版本' : 'Enter a name and at least one language version', type:'warning', plain:true}); return}
  const item = {id: editingId.value || `signature-${Date.now()}`, name, translations: Object.fromEntries(rows.map(row => [row.language, row.content]))}
  const index = signatures.value.findIndex(row => row.id === editingId.value)
  if (index >= 0) writerStore.signatures.splice(index, 1, item); else writerStore.signatures.push(item)
  dialogOpen.value = false
  ElMessage({message: zh.value ? '签名已保存' : 'Signature saved', type:'success', plain:true})
}
function removeSignature(signature) {
  ElMessageBox.confirm(zh.value ? `删除“${signature.name}”？` : `Delete “${signature.name}”?`, zh.value ? '删除签名' : 'Delete signature', {type:'warning'}).then(() => {
    writerStore.signatures = signatures.value.filter(item => item.id !== signature.id)
    ElMessage({message: zh.value ? '签名已删除' : 'Signature deleted', type:'success', plain:true})
  }).catch(() => {})
}
</script>

<style lang="scss" scoped>
.signatures-page { height: 100%; overflow-y: auto; background: var(--bg); }
.page-shell { width: min(1100px, 100%); margin: 0 auto; padding: 24px; }
.page-head, .heading-copy, .auto-note, .signature-card header, .card-actions { display: flex; align-items: center; }
.page-head { gap: 16px; margin-bottom: 16px; }
.heading-copy { min-width: 0; gap: 12px; }
.heading-icon { width: 36px; height: 36px; flex: 0 0 36px; display: grid; place-items: center; color: #fff; border-radius: var(--r-md); background: var(--brand-600); }
.page-head h1 { margin: 0; color: var(--text); font-size: 19px; }
.page-head p { margin: 3px 0 0; color: var(--text-3); font-size: 12.5px; }
.primary-button { height: 38px; margin-left: auto; padding: 0 13px; display: inline-flex; align-items: center; gap: 6px; color: #fff; border: 0; border-radius: var(--r-sm); background: var(--brand-600); font-weight: 700; cursor: pointer; }
.auto-note { gap: 11px; margin-bottom: 16px; padding: 14px 16px; color: var(--brand-600); border: 1px solid color-mix(in srgb, var(--brand-500) 25%, var(--border)); border-radius: var(--r-lg); background: var(--brand-soft); }
.auto-note strong { color: var(--text); font-size: 13px; }.auto-note p { margin: 3px 0 0; color: var(--text-3); font-size: 11.5px; }
.signature-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.signature-card { min-width: 0; padding: 16px; border: 1px solid var(--border); border-radius: var(--r-lg); background: var(--surface); box-shadow: var(--sh-1); }
.signature-card header { gap: 6px; }.signature-card h2 { margin: 13px 0 9px; color: var(--text); font-size: 14px; }.language-list { min-width: 0; display: flex; flex-wrap: wrap; gap: 5px; }
.language-badge, .fallback-badge, .default-badge { padding: 4px 7px; border: 0; border-radius: 6px; font-size: 10.5px; font-weight: 700; }.language-badge { color: var(--text-3); background: var(--surface-3); cursor: pointer; }.language-badge.active { color: var(--brand-700); background: var(--brand-soft); box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand-500) 28%, transparent) inset; }.default-badge { color: #fff; background: var(--brand-600); }.fallback-badge { color: var(--text-3); background: var(--surface-3); }
.card-actions { margin-left: auto; gap: 5px; }.card-actions button { width: 30px; height: 30px; display: grid; place-items: center; color: var(--text-2); border: 1px solid var(--border); border-radius: 8px; background: var(--surface); cursor: pointer; }.card-actions button:hover { color: var(--brand-600); background: var(--brand-soft); }.card-actions .danger:hover { color: var(--danger); }
.signature-preview { min-height: 118px; padding: 14px; overflow: auto; color: var(--text-2); border: 1px solid var(--border); border-radius: var(--r-md); background: var(--surface-2); font-size: 12px; line-height: 1.7; word-break: break-word; }.signature-preview :deep(img) { max-width: 100%; height: auto; }.signature-preview :deep(table) { max-width: 100%; }
.empty-state { min-height: 340px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-3); border: 1px dashed var(--border); border-radius: var(--r-lg); background: var(--surface); }.empty-state > span { width: 52px; height: 52px; display: grid; place-items: center; color: var(--brand-600); border-radius: var(--r-lg); background: var(--brand-soft); }.empty-state strong { margin-top: 14px; color: var(--text); }.empty-state p { margin: 5px 0 0; font-size: 12px; }.empty-state button { margin-top: 14px; padding: 8px 12px; color: #fff; border: 0; border-radius: 8px; background: var(--brand-600); cursor: pointer; }
.signature-form { display: grid; gap: 15px; }.signature-form label > span { display: block; margin-bottom: 6px; color: var(--text-2); font-size: 12px; font-weight: 700; }.signature-form .el-select { width: 100%; }
.translation-editor { display: grid; gap: 10px; }.translation-head, .translation-row-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }.translation-head > span { color: var(--text-2); font-size: 12px; font-weight: 700; }.translation-head button { padding: 5px 8px; display: inline-flex; align-items: center; gap: 4px; color: var(--brand-700); border: 0; border-radius: 7px; background: var(--brand-soft); font-size: 11px; cursor: pointer; }.translation-row { padding: 11px; display: grid; gap: 9px; border: 1px solid var(--border); border-radius: var(--r-md); background: var(--surface-2); }.translation-row-head .el-select { flex: 1; }.translation-row-head > button { width: 32px; height: 32px; display: grid; place-items: center; color: var(--danger); border: 1px solid var(--border); border-radius: 8px; background: var(--surface); cursor: pointer; }
@media (max-width: 760px) { .page-shell { padding: 14px; } .page-head { align-items: flex-start; flex-direction: column; } .primary-button { width: 100%; margin-left: 0; justify-content: center; } .signature-grid { grid-template-columns: 1fr; } }
</style>
