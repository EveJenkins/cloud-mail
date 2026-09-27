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

      <section class="auto-note"><Icon icon="solar:global-linear" width="19" /><div><strong>{{ zh ? '自动语言规则' : 'Automatic language matching' }}</strong><p>{{ zh ? '系统按通讯录中的国家/地区选择签名；没有匹配语言时优先使用英语签名。' : 'The recipient country selects the signature. English is used when no matching language exists.' }}</p></div></section>

      <section v-if="signatures.length" class="signature-grid">
        <article v-for="signature in signatures" :key="signature.id" class="signature-card">
          <header><span class="language-badge">{{ languageName(signature.language) }}</span><span v-if="signature.language === 'en'" class="fallback-badge">{{ zh ? '缺省回退' : 'Fallback' }}</span><div class="card-actions"><button type="button" @click="openEdit(signature)"><Icon icon="solar:pen-new-square-linear" width="16" /></button><button class="danger" type="button" @click="removeSignature(signature)"><Icon icon="solar:trash-bin-trash-linear" width="16" /></button></div></header>
          <h2>{{ signature.name }}</h2>
          <div class="signature-preview"><pre>{{ signature.content }}</pre></div>
        </article>
      </section>
      <section v-else class="empty-state"><span><Icon icon="solar:pen-new-square-linear" width="32" /></span><strong>{{ zh ? '还没有邮件签名' : 'No signatures yet' }}</strong><p>{{ zh ? '建议先创建英语签名作为缺省签名，再添加常用客户语言。' : 'Start with an English fallback, then add your customers’ languages.' }}</p><button type="button" @click="openCreate">{{ zh ? '创建第一份签名' : 'Create first signature' }}</button></section>
    </div>

    <el-dialog v-model="dialogOpen" :title="editingId ? (zh ? '编辑签名' : 'Edit signature') : (zh ? '新建签名' : 'New signature')" width="min(560px, calc(100vw - 28px))">
      <div class="signature-form">
        <label><span>{{ zh ? '语言' : 'Language' }}</span><el-select v-model="form.language" filterable><el-option v-for="language in languages" :key="language.value" :label="language.label" :value="language.value" /></el-select></label>
        <label><span>{{ zh ? '签名名称' : 'Signature name' }}</span><el-input v-model.trim="form.name" maxlength="30" show-word-limit :placeholder="zh ? '例如：西班牙语销售签名' : 'e.g. Spanish sales signature'" /></label>
        <label><span>{{ zh ? '签名内容' : 'Signature content' }}</span><el-input v-model="form.content" type="textarea" :rows="8" maxlength="1000" show-word-limit :placeholder="signaturePlaceholder" /></label>
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

defineOptions({name: 'signatures'})
const writerStore = useWriterStore()
const settingStore = useSettingStore()
const zh = computed(() => settingStore.lang === 'zh')
const dialogOpen = ref(false)
const editingId = ref('')
const form = reactive({language: 'en', name: '', content: ''})
const languages = [
  {value:'en',label:'English'}, {value:'zh',label:'简体中文'}, {value:'zh-TW',label:'繁體中文'},
  {value:'de',label:'Deutsch'}, {value:'fr',label:'Français'}, {value:'es',label:'Español'},
  {value:'pt',label:'Português'}, {value:'it',label:'Italiano'}, {value:'nl',label:'Nederlands'},
  {value:'pl',label:'Polski'}, {value:'tr',label:'Türkçe'}, {value:'ru',label:'Русский'},
  {value:'ar',label:'العربية'}, {value:'hi',label:'हिन्दी'}, {value:'ja',label:'日本語'},
  {value:'ko',label:'한국어'}, {value:'th',label:'ไทย'}, {value:'vi',label:'Tiếng Việt'},
  {value:'id',label:'Bahasa Indonesia'}, {value:'ms',label:'Bahasa Melayu'},
]
const signatures = computed(() => Array.isArray(writerStore.signatures) ? writerStore.signatures : [])
const signaturePlaceholder = computed(() => zh.value ? '顺颂商祺\n姓名\n职位 · 公司名称\n电话 / 网站' : 'Best regards,\nName\nTitle · Company\nPhone / Website')
const languageName = code => languages.find(item => item.value === code)?.label || code
function resetForm() {editingId.value = ''; form.language = 'en'; form.name = ''; form.content = ''}
function openCreate() {resetForm(); dialogOpen.value = true}
function openEdit(signature) {editingId.value = signature.id; Object.assign(form, {language: signature.language, name: signature.name, content: signature.content}); dialogOpen.value = true}
function saveSignature() {
  const name = form.name.trim(); const content = form.content.trim()
  if (!name || !content) {ElMessage({message: zh.value ? '请填写签名名称和内容' : 'Enter a name and signature content', type:'warning', plain:true}); return}
  const duplicate = signatures.value.find(item => item.language === form.language && item.id !== editingId.value)
  if (duplicate) {ElMessage({message: zh.value ? `已存在 ${languageName(form.language)} 签名，请直接编辑` : `A ${languageName(form.language)} signature already exists`, type:'warning', plain:true}); return}
  const item = {id: editingId.value || `signature-${Date.now()}`, language: form.language, name, content}
  const index = signatures.value.findIndex(row => row.id === editingId.value)
  if (index >= 0) writerStore.signatures.splice(index, 1, item); else writerStore.signatures.push(item)
  dialogOpen.value = false
  ElMessage({message: zh.value ? '签名已保存' : 'Signature saved', type:'success', plain:true})
}
function removeSignature(signature) {
  ElMessageBox.confirm(zh.value ? `删除“${signature.name}”？` : `Delete “${signature.name}”?`, zh.value ? '删除签名' : 'Delete signature', {type:'warning'}).then(() => {
    writerStore.signatures = signatures.value.filter(item => item.id !== signature.id)
  }).catch(() => {})
}
</script>

<style lang="scss" scoped>
.signatures-page { height: 100%; overflow-y: auto; background: var(--bg); }
.page-shell { width: min(1100px, 100%); margin: 0 auto; padding: 24px; }
.page-head, .heading-copy, .auto-note, .signature-card header, .card-actions { display: flex; align-items: center; }
.page-head { gap: 16px; margin-bottom: 16px; }
.heading-copy { min-width: 0; gap: 12px; }
.heading-icon { width: 42px; height: 42px; flex: 0 0 42px; display: grid; place-items: center; color: #fff; border-radius: 11px; background: linear-gradient(135deg, var(--brand-600), #0ea5e9); box-shadow: 0 8px 18px color-mix(in srgb, var(--brand-600) 20%, transparent); }
.page-head h1 { margin: 0; color: var(--text); font-size: 19px; }
.page-head p { margin: 3px 0 0; color: var(--text-3); font-size: 12.5px; }
.primary-button { height: 38px; margin-left: auto; padding: 0 13px; display: inline-flex; align-items: center; gap: 6px; color: #fff; border: 0; border-radius: var(--r-sm); background: var(--brand-600); font-weight: 700; cursor: pointer; }
.auto-note { gap: 11px; margin-bottom: 16px; padding: 14px 16px; color: var(--brand-600); border: 1px solid color-mix(in srgb, var(--brand-500) 25%, var(--border)); border-radius: var(--r-lg); background: var(--brand-soft); }
.auto-note strong { color: var(--text); font-size: 13px; }.auto-note p { margin: 3px 0 0; color: var(--text-3); font-size: 11.5px; }
.signature-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.signature-card { min-width: 0; padding: 16px; border: 1px solid var(--border); border-radius: var(--r-lg); background: var(--surface); box-shadow: var(--sh-1); }
.signature-card header { gap: 6px; }.signature-card h2 { margin: 13px 0 9px; color: var(--text); font-size: 14px; }
.language-badge, .fallback-badge { padding: 4px 7px; border-radius: 6px; font-size: 10.5px; font-weight: 700; }.language-badge { color: var(--brand-700); background: var(--brand-soft); }.fallback-badge { color: var(--text-3); background: var(--surface-3); }
.card-actions { margin-left: auto; gap: 5px; }.card-actions button { width: 30px; height: 30px; display: grid; place-items: center; color: var(--text-2); border: 1px solid var(--border); border-radius: 8px; background: var(--surface); cursor: pointer; }.card-actions button:hover { color: var(--brand-600); background: var(--brand-soft); }.card-actions .danger:hover { color: var(--danger); }
.signature-preview { min-height: 118px; padding: 14px; border: 1px solid var(--border); border-radius: 9px; background: var(--surface-2); }.signature-preview pre { margin: 0; color: var(--text-2); font: inherit; font-size: 12px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; }
.empty-state { min-height: 340px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-3); border: 1px dashed var(--border); border-radius: var(--r-lg); background: var(--surface); }.empty-state > span { width: 56px; height: 56px; display: grid; place-items: center; color: var(--brand-600); border-radius: 16px; background: var(--brand-soft); }.empty-state strong { margin-top: 14px; color: var(--text); }.empty-state p { margin: 5px 0 0; font-size: 12px; }.empty-state button { margin-top: 14px; padding: 8px 12px; color: #fff; border: 0; border-radius: 8px; background: var(--brand-600); cursor: pointer; }
.signature-form { display: grid; gap: 15px; }.signature-form label > span { display: block; margin-bottom: 6px; color: var(--text-2); font-size: 12px; font-weight: 700; }.signature-form .el-select { width: 100%; }
@media (max-width: 760px) { .page-shell { padding: 14px; } .page-head { align-items: flex-start; flex-direction: column; } .primary-button { width: 100%; margin-left: 0; justify-content: center; } .signature-grid { grid-template-columns: 1fr; } }
</style>
