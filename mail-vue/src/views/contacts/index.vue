<template>
  <div class="contacts-page">
    <div class="contacts-shell">
      <header class="page-head">
        <div>
          <h1>{{ zh ? '通讯录' : 'Contacts' }}</h1>
          <p>{{ activeTab === 'team' ? (zh ? `团队 ${teamContacts.length} 人` : `${teamContacts.length} team members`) : (zh ? `外部联系人 ${externalContacts.length} 位` : `${externalContacts.length} external contacts`) }}</p>
        </div>
        <div class="head-actions">
          <label class="contact-search">
            <Icon icon="solar:magnifer-linear" width="16" />
            <input v-model.trim="keyword" :placeholder="zh ? '搜索姓名 / 邮箱 / 公司' : 'Search name, email or company'" />
          </label>
          <button v-if="activeTab === 'external'" class="primary-button" type="button" @click="openCreate">
            <Icon icon="solar:user-plus-linear" width="17" />{{ zh ? '新建联系人' : 'New contact' }}
          </button>
        </div>
      </header>

      <div class="contact-tabs">
        <button :class="{ active: activeTab === 'team' }" @click="activeTab = 'team'; keyword = ''">{{ zh ? `团队 ${teamContacts.length}` : `Team ${teamContacts.length}` }}</button>
        <button :class="{ active: activeTab === 'external' }" @click="activeTab = 'external'; keyword = ''">{{ zh ? `客户 · 供应商 ${externalContacts.length}` : `Customers & suppliers ${externalContacts.length}` }}</button>
      </div>

      <section class="contact-card">
        <div class="table-head" :class="{ external: activeTab === 'external' }">
          <span>{{ zh ? '联系人' : 'Contact' }}</span>
          <span v-if="activeTab === 'external'">{{ zh ? '公司' : 'Company' }}</span>
          <span>{{ zh ? '邮箱' : 'Email' }}</span>
          <span>{{ zh ? (activeTab === 'team' ? '身份' : '类型') : 'Type' }}</span>
          <span></span>
        </div>

        <div v-if="filteredContacts.length" class="contact-list">
          <article v-for="contact in filteredContacts" :key="contact.id || contact.email" class="contact-row" :class="{ external: activeTab === 'external' }">
            <div class="person-cell">
              <span class="contact-avatar" :style="{ background: avatarColor(contact.email) }">{{ initials(contact) }}</span>
              <div><strong>{{ contact.name || emailName(contact.email) }}</strong><small>{{ activeTab === 'team' ? (contact.note || (zh ? '企业成员' : 'Team member')) : (contact.country || (contact.saved ? (zh ? '已保存联系人' : 'Saved contact') : (zh ? '最近联系' : 'Recent'))) }}</small></div>
            </div>
            <span v-if="activeTab === 'external'" class="truncate-cell">{{ contact.company || '—' }}</span>
            <span class="email-cell" :title="contact.email">{{ contact.email }}</span>
            <span><em class="type-badge" :class="typeClass(contact)">{{ contact.type || (activeTab === 'team' ? (zh ? '成员' : 'Member') : (zh ? '联系人' : 'Contact')) }}</em></span>
            <div class="row-actions">
              <button type="button" @click="composeTo(contact)">{{ zh ? '写信' : 'Email' }}</button>
              <button v-if="contact.saved" type="button" class="icon-button" :title="zh ? '编辑' : 'Edit'" @click="openEdit(contact)"><Icon icon="solar:pen-new-square-linear" width="16" /></button>
              <button v-if="contact.saved" type="button" class="icon-button danger" :title="zh ? '删除' : 'Delete'" @click="removeContact(contact)"><Icon icon="solar:trash-bin-trash-linear" width="16" /></button>
              <button v-else-if="activeTab === 'external'" type="button" class="icon-button" :title="zh ? '保存联系人' : 'Save contact'" @click="saveRecent(contact)"><Icon icon="solar:add-circle-linear" width="17" /></button>
            </div>
          </article>
        </div>
        <div v-else class="empty-state">
          <Icon icon="solar:users-group-rounded-linear" width="38" />
          <strong>{{ zh ? '没有匹配的联系人' : 'No matching contacts' }}</strong>
          <span>{{ zh ? '换个关键词试试' : 'Try another search' }}</span>
        </div>
      </section>

      <section v-if="activeTab === 'team'" class="team-note">
        <strong>{{ zh ? '团队通讯录说明' : 'Team directory' }}</strong>
        <p>{{ zh ? '当前登录账号和企业域名联系人会显示在团队页；外部客户、供应商与物流联系人保存在本机账号中。' : 'Your account and company-domain contacts appear here. External contacts are saved to this account.' }}</p>
      </section>
    </div>

    <el-dialog v-model="dialogOpen" :title="editingId ? (zh ? '编辑联系人' : 'Edit contact') : (zh ? '新建联系人' : 'New contact')" width="min(520px, calc(100vw - 28px))">
      <div class="contact-form">
        <label><span>{{ zh ? '姓名' : 'Name' }}</span><el-input v-model.trim="form.name" /></label>
        <label><span>{{ zh ? '邮箱' : 'Email' }}</span><el-input v-model.trim="form.email" type="email" /></label>
        <label><span>{{ zh ? '公司' : 'Company' }}</span><el-input v-model.trim="form.company" /></label>
        <div class="form-grid">
          <label><span>{{ zh ? '类型' : 'Type' }}</span><div class="native-select-wrap"><select v-model="form.type"><option value="客户">{{ zh ? '客户' : 'Customer' }}</option><option value="供应商">{{ zh ? '供应商' : 'Supplier' }}</option><option value="物流">{{ zh ? '物流' : 'Logistics' }}</option><option value="合作伙伴">{{ zh ? '合作伙伴' : 'Partner' }}</option></select><Icon icon="solar:alt-arrow-down-linear" width="15" /></div></label>
          <label><span>{{ zh ? '国家 / 地区' : 'Country / region' }}</span><div class="native-select-wrap"><select v-model="form.country"><option value="">{{ zh ? '请选择' : 'Select' }}</option><option v-for="country in countryOptions" :key="country.value" :value="country.value">{{ zh ? country.zh : country.en }}</option></select><Icon icon="solar:alt-arrow-down-linear" width="15" /></div></label>
        </div>
      </div>
      <template #footer><el-button @click="dialogOpen = false">{{ zh ? '取消' : 'Cancel' }}</el-button><el-button type="primary" @click="saveContact">{{ zh ? '保存' : 'Save' }}</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useWriterStore } from '@/store/writer.js'
import { useUiStore } from '@/store/ui.js'
import { useSettingStore } from '@/store/setting.js'
import { useUserStore } from '@/store/user.js'
import { useAccountStore } from '@/store/account.js'
import { isEmail } from '@/utils/verify-utils.js'

defineOptions({ name: 'contacts' })

const writerStore = useWriterStore()
const uiStore = useUiStore()
const settingStore = useSettingStore()
const userStore = useUserStore()
const accountStore = useAccountStore()
const activeTab = ref('team')
const keyword = ref('')
const dialogOpen = ref(false)
const editingId = ref('')
const zh = computed(() => settingStore.lang === 'zh')
const form = reactive({ name: '', email: '', company: '', type: '客户', country: '' })
const countryOptions = [
  {value: 'China', zh: '中国大陆', en: 'China'}, {value: 'Hong Kong', zh: '中国香港', en: 'Hong Kong'},
  {value: 'Taiwan', zh: '中国台湾', en: 'Taiwan'}, {value: 'United States', zh: '美国', en: 'United States'},
  {value: 'Canada', zh: '加拿大', en: 'Canada'}, {value: 'Mexico', zh: '墨西哥', en: 'Mexico'},
  {value: 'United Kingdom', zh: '英国', en: 'United Kingdom'}, {value: 'Germany', zh: '德国', en: 'Germany'},
  {value: 'France', zh: '法国', en: 'France'}, {value: 'Italy', zh: '意大利', en: 'Italy'},
  {value: 'Spain', zh: '西班牙', en: 'Spain'}, {value: 'Netherlands', zh: '荷兰', en: 'Netherlands'},
  {value: 'Poland', zh: '波兰', en: 'Poland'}, {value: 'Turkey', zh: '土耳其', en: 'Turkey'},
  {value: 'Russia', zh: '俄罗斯', en: 'Russia'}, {value: 'United Arab Emirates', zh: '阿联酋', en: 'United Arab Emirates'},
  {value: 'Saudi Arabia', zh: '沙特阿拉伯', en: 'Saudi Arabia'}, {value: 'India', zh: '印度', en: 'India'},
  {value: 'Japan', zh: '日本', en: 'Japan'}, {value: 'South Korea', zh: '韩国', en: 'South Korea'},
  {value: 'Singapore', zh: '新加坡', en: 'Singapore'}, {value: 'Thailand', zh: '泰国', en: 'Thailand'},
  {value: 'Vietnam', zh: '越南', en: 'Vietnam'}, {value: 'Indonesia', zh: '印度尼西亚', en: 'Indonesia'},
  {value: 'Malaysia', zh: '马来西亚', en: 'Malaysia'}, {value: 'Philippines', zh: '菲律宾', en: 'Philippines'},
  {value: 'Australia', zh: '澳大利亚', en: 'Australia'}, {value: 'New Zealand', zh: '新西兰', en: 'New Zealand'},
  {value: 'Brazil', zh: '巴西', en: 'Brazil'}, {value: 'Argentina', zh: '阿根廷', en: 'Argentina'},
  {value: 'South Africa', zh: '南非', en: 'South Africa'}, {value: 'Other', zh: '其他', en: 'Other'},
]

const companyDomains = computed(() => {
  const values = [...(settingStore.domainList || [])]
  const current = accountStore.currentAccount?.email || userStore.user.email || ''
  if (current.includes('@')) values.push(current.split('@')[1])
  return new Set(values.map(value => String(value).replace(/^@/, '').toLowerCase()).filter(Boolean))
})

const savedContacts = computed(() => (writerStore.contacts || []).map(item => ({ ...item, saved: true })))
const recentContacts = computed(() => writerStore.sendRecipientRecord
    .filter(email => !savedContacts.value.some(item => item.email.toLowerCase() === String(email).toLowerCase()))
    .map(email => ({ id: `recent-${email}`, email, name: emailName(email), type: zh.value ? '最近' : 'Recent', saved: false })))
const selfContacts = computed(() => {
  const rows = [
    { id: 'self-user', name: userStore.user.name, email: userStore.user.email, type: userStore.user.role?.name, note: zh.value ? '（我）' : '(Me)' },
    { id: 'self-account', name: accountStore.currentAccount?.name, email: accountStore.currentAccount?.email, type: zh.value ? '企业邮箱' : 'Mailbox' }
  ].filter(item => item.email)
  return rows.filter((item, index) => rows.findIndex(row => row.email === item.email) === index)
})
const isInternal = email => companyDomains.value.has(String(email || '').split('@')[1]?.toLowerCase())
const teamContacts = computed(() => [...selfContacts.value, ...savedContacts.value.filter(item => isInternal(item.email))]
    .filter((item, index, rows) => rows.findIndex(row => row.email === item.email) === index))
const externalContacts = computed(() => [...savedContacts.value.filter(item => !isInternal(item.email)), ...recentContacts.value.filter(item => !isInternal(item.email))])
const filteredContacts = computed(() => {
  const source = activeTab.value === 'team' ? teamContacts.value : externalContacts.value
  const query = keyword.value.toLowerCase()
  if (!query) return source
  return source.filter(item => [item.name, item.email, item.company, item.country, item.type].some(value => String(value || '').toLowerCase().includes(query)))
})

function emailName(email) { return String(email || '').split('@')[0] || (zh.value ? '联系人' : 'Contact') }
function initials(contact) { return String(contact.name || emailName(contact.email)).split(/[\s._-]+/).filter(Boolean).slice(0, 2).map(item => item[0]).join('').toUpperCase() || 'C' }
function avatarColor(value) { const colors = ['#0ea5e9', '#25d366', '#8b5cf6', '#f59e0b', '#f6821f', '#6366f1']; const score = Array.from(String(value || '')).reduce((sum, char) => sum + char.charCodeAt(0), 0); return colors[score % colors.length] }
function typeClass(contact) { if (contact.type === '供应商') return 'supplier'; if (contact.type === '物流') return 'logistics'; if (activeTab.value === 'team') return 'team'; return 'customer' }
function resetForm() { Object.assign(form, { name: '', email: '', company: '', type: '客户', country: '' }); editingId.value = '' }
function openCreate() { resetForm(); dialogOpen.value = true }
function openEdit(contact) { editingId.value = contact.id; Object.assign(form, { name: contact.name || '', email: contact.email || '', company: contact.company || '', type: contact.type || '客户', country: contact.country || '' }); dialogOpen.value = true }
function saveRecent(contact) { resetForm(); Object.assign(form, { name: contact.name || emailName(contact.email), email: contact.email, type: '客户' }); dialogOpen.value = true }

function saveContact() {
  if (!form.name || !isEmail(form.email)) { ElMessage({ message: zh.value ? '请填写姓名和有效邮箱' : 'Enter a name and valid email', type: 'warning', plain: true }); return }
  const duplicate = writerStore.contacts.find(item => item.email.toLowerCase() === form.email.toLowerCase() && item.id !== editingId.value)
  if (duplicate) { ElMessage({ message: zh.value ? '该邮箱已在通讯录中' : 'This email already exists', type: 'warning', plain: true }); return }
  const data = { id: editingId.value || `contact-${Date.now()}`, name: form.name, email: form.email, company: form.company, type: form.type, country: form.country }
  const index = writerStore.contacts.findIndex(item => item.id === editingId.value)
  if (index >= 0) writerStore.contacts[index] = data
  else writerStore.contacts.unshift(data)
  if (!writerStore.sendRecipientRecord.includes(data.email)) writerStore.sendRecipientRecord.unshift(data.email)
  dialogOpen.value = false
  ElMessage({ message: zh.value ? '联系人已保存' : 'Contact saved', type: 'success', plain: true })
}

function removeContact(contact) {
  ElMessageBox.confirm(zh.value ? `删除联系人“${contact.name}”？` : `Delete “${contact.name}”?`, zh.value ? '删除联系人' : 'Delete contact', { type: 'warning' }).then(() => {
    writerStore.contacts = writerStore.contacts.filter(item => item.id !== contact.id)
  }).catch(() => {})
}

function composeTo(contact) { uiStore.writerRef?.openWithRecipient?.(contact.email) }
</script>

<style lang="scss" scoped>
.contacts-page { height: 100%; overflow-y: auto; background: var(--bg); }
.contacts-shell { width: min(1180px, 100%); margin: 0 auto; padding: 24px; }
.page-head { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.page-head h1 { margin: 0; color: var(--text); font-size: 19px; line-height: 1.35; }
.page-head p { margin: 3px 0 0; color: var(--text-3); font-size: 13px; }
.head-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }
.contact-search { width: 240px; height: 38px; padding: 0 11px; display: flex; align-items: center; gap: 8px; color: var(--text-3); background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-sm); }
.contact-search:focus-within { border-color: var(--brand-500); box-shadow: 0 0 0 3px var(--brand-soft); }
.contact-search input { min-width: 0; flex: 1; color: var(--text); font-size: 12.5px; }
.primary-button { height: 38px; padding: 0 13px; display: inline-flex; align-items: center; gap: 6px; color: #fff; background: var(--brand-600); border-radius: var(--r-sm); font-size: 12.5px; font-weight: 700; cursor: pointer; }
.primary-button:hover { background: var(--brand-700); }
.contact-tabs { display: flex; gap: 6px; margin-bottom: 16px; }
.contact-tabs button { height: 28px; padding: 0 10px; color: var(--text-2); background: var(--surface-3); border-radius: 99px; font-size: 12.5px; cursor: pointer; }
.contact-tabs button.active { color: var(--brand-600); background: var(--brand-soft); font-weight: 700; }
.contact-card { overflow: hidden; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); box-shadow: var(--sh-1); }
.table-head, .contact-row { display: grid; grid-template-columns: 1.35fr 1.5fr .7fr 160px; align-items: center; gap: 14px; }
.table-head.external, .contact-row.external { grid-template-columns: 1.3fr 1fr 1.35fr .65fr 160px; }
.table-head { min-height: 42px; padding: 0 16px; color: var(--text-3); background: var(--surface-2); border-bottom: 1px solid var(--border); font-size: 12px; font-weight: 700; }
.contact-list article + article { border-top: 1px solid var(--border); }
.contact-row { min-height: 66px; padding: 10px 16px; color: var(--text-2); font-size: 13px; }
.contact-row:hover { background: var(--surface-2); }
.person-cell { min-width: 0; display: flex; align-items: center; gap: 10px; }
.contact-avatar { width: 34px; height: 34px; flex: 0 0 34px; display: grid; place-items: center; color: #fff; border-radius: 50%; font-size: 11px; font-weight: 800; }
.person-cell div { min-width: 0; }
.person-cell strong, .person-cell small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.person-cell strong { color: var(--text); font-size: 13.5px; }
.person-cell small { margin-top: 2px; color: var(--text-3); font-size: 11.5px; }
.truncate-cell, .email-cell { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.type-badge { min-height: 22px; padding: 3px 8px; display: inline-flex; align-items: center; border-radius: 6px; font-size: 11px; font-style: normal; font-weight: 700; }
.type-badge.customer, .type-badge.team { color: var(--brand-600); background: var(--brand-soft); }
.type-badge.supplier { color: #b45309; background: color-mix(in srgb, var(--warning) 15%, transparent); }
.type-badge.logistics { color: var(--text-2); background: var(--surface-3); }
.row-actions { display: flex; justify-content: flex-end; gap: 5px; }
.row-actions button { height: 32px; padding: 0 9px; color: var(--text-2); background: var(--surface); border: 1px solid var(--border); border-radius: 8px; font-size: 12px; cursor: pointer; }
.row-actions button:hover { color: var(--brand-600); background: var(--brand-soft); }
.row-actions .icon-button { width: 32px; padding: 0; display: grid; place-items: center; }
.row-actions .danger:hover { color: var(--danger); background: color-mix(in srgb, var(--danger) 8%, var(--surface)); }
.empty-state { min-height: 260px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-3); }
.empty-state strong { margin-top: 12px; color: var(--text-2); font-size: 14px; }
.empty-state span { margin-top: 4px; font-size: 12.5px; }
.team-note { margin-top: 16px; padding: 16px; color: var(--text-2); background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); font-size: 13px; }
.team-note strong { color: var(--text); }
.team-note p { margin: 7px 0 0; line-height: 1.7; }
.contact-form { display: grid; gap: 14px; }
.contact-form label > span { display: block; margin-bottom: 6px; color: var(--text-2); font-size: 12.5px; font-weight: 650; }
.native-select-wrap { position: relative; }
.native-select-wrap select { width: 100%; height: 40px; padding: 0 36px 0 12px; color: var(--text); border: 1px solid var(--border); border-radius: var(--r-sm); background: var(--surface); font: inherit; font-size: 13px; outline: none; appearance: none; cursor: pointer; }
.native-select-wrap select:hover { border-color: var(--text-3); }
.native-select-wrap select:focus { border-color: var(--brand-500); box-shadow: 0 0 0 3px var(--brand-soft); }
.native-select-wrap > svg { position: absolute; top: 50%; right: 11px; color: var(--text-3); pointer-events: none; transform: translateY(-50%); }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 900px) {
  .contacts-shell { padding: 16px; }
  .page-head { align-items: flex-start; flex-direction: column; }
  .head-actions { width: 100%; margin-left: 0; }
  .contact-search { flex: 1; width: auto; }
  .table-head { display: none; }
  .contact-row, .contact-row.external { grid-template-columns: minmax(0, 1fr) auto; gap: 7px 12px; }
  .contact-row > .truncate-cell, .contact-row > .email-cell, .contact-row > span { grid-column: 1; padding-left: 44px; }
  .row-actions { grid-column: 2; grid-row: 1 / span 3; align-self: center; }
}
@media (max-width: 560px) {
  .contacts-shell { padding: 12px; }
  .head-actions { align-items: stretch; flex-direction: column; }
  .contact-search { width: 100%; flex: none; }
  .primary-button { justify-content: center; }
  .contact-row, .contact-row.external { grid-template-columns: minmax(0, 1fr); }
  .row-actions { grid-column: 1; grid-row: auto; justify-content: flex-start; padding-left: 44px; }
  .form-grid { grid-template-columns: 1fr; }
}
</style>
