<template>
  <div class="send" :class="{ 'compose-full': !uiStore.asideShow }" v-show="show">
    <div class="compose-workspace">
      <header class="compose-topbar">
        <button class="back-button" type="button" @click="close"><Icon icon="solar:alt-arrow-left-linear" width="17"/>{{ settingStore.lang === 'zh' ? '返回' : 'Back' }}</button>
        <h1>{{ composeTitle }}</h1>
        <div class="topbar-actions">
          <button class="secondary-button" type="button" @click="saveDraftNow"><Icon icon="solar:diskette-outline" width="17"/>{{ settingStore.lang === 'zh' ? '存草稿' : 'Save draft' }}</button>
          <button class="secondary-button" type="button" @click="previewMail"><Icon icon="solar:eye-linear" width="17"/>{{ settingStore.lang === 'zh' ? '预览' : 'Preview' }}</button>
          <button class="send-button" type="button" @click="sendEmail"><Icon icon="solar:plain-2-bold" width="17"/><span>{{ sendActionLabel }}</span></button>
        </div>
      </header>

      <div class="compose-grid">
        <main class="compose-main-card">
          <section class="message-meta">
            <div class="field-row recipient-row">
              <label>{{ $t('recipient') }}</label>
              <div class="recipient-control">
                <el-input-tag @add-tag="addTagChange" tag-type="primary" @input="inputChange" size="default" v-model="form.receiveEmail" :placeholder="settingStore.lang === 'zh' ? '继续输入，回车分隔…' : 'Type and press Enter…'">
                  <template #prefix>
                    <el-select ref="mySelect" class="write-select" popper-class="write-select" :show-arrow="false" :no-match-text="' '" :no-data-text="' '" @visible-change="selectStatusChange" @change="selectChange">
                      <el-option v-for="item in selectRecipientList" :key="item" :label="item" :value="item" style="color:#999896" />
                    </el-select>
                  </template>
                </el-input-tag>
                <button class="inline-link" type="button" @click.stop="openContacts">{{ settingStore.lang === 'zh' ? '通讯录' : 'Contacts' }}</button>
              </div>
            </div>
            <div class="field-row subject-row">
              <label>{{ $t('subject') }}</label>
              <el-input v-model="form.subject" :placeholder="settingStore.lang === 'zh' ? '请输入邮件主题' : 'Enter a subject'" />
            </div>
            <div class="field-row identity-row">
              <label>{{ settingStore.lang === 'zh' ? '发件身份' : 'From' }}</label>
              <div class="sender-identity"><span class="sender-avatar">{{ senderInitial }}</span><strong>{{ form.name }}</strong><span>&lt;{{ form.sendEmail }}&gt;</span></div>
              <span class="quota-hint">{{ quotaHint }}</span>
            </div>
          </section>

          <section class="editor-shell">
            <tinyEditor :def-value="defValue" ref="editor" @change="change" @focus="focusChange" />
          </section>

          <div class="editor-status">
            <span>{{ settingStore.lang === 'zh' ? `字符 ${contentStats.characters}` : `${contentStats.characters} characters` }}</span>
            <span>{{ settingStore.lang === 'zh' ? `词数 ${contentStats.words}` : `${contentStats.words} words` }}</span>
            <span>{{ settingStore.lang === 'zh' ? `图片 ${contentStats.images}` : `${contentStats.images} images` }}</span>
            <span>{{ settingStore.lang === 'zh' ? `正文大小 ${contentStats.size}` : `Body ${contentStats.size}` }}</span>
            <span class="compatibility"><Icon icon="solar:shield-check-linear" width="14"/>{{ settingStore.lang === 'zh' ? '已内联样式 · 兼容主流客户端' : 'Inline styles · client compatible' }}</span>
          </div>

          <section class="attachment-zone" @dragover.prevent @drop.prevent="handleDrop">
            <div class="attachment-head">
              <div><strong>{{ settingStore.lang === 'zh' ? '附件' : 'Attachments' }}</strong><span>{{ form.attachments.length }} {{ settingStore.lang === 'zh' ? '个' : 'files' }} · {{ attachmentTotal }}（{{ settingStore.lang === 'zh' ? '上限 25 MB' : '25 MB limit' }}）</span></div>
              <button class="add-attachment" type="button" @click="chooseFile"><Icon icon="solar:add-circle-linear" width="17"/>{{ settingStore.lang === 'zh' ? '添加' : 'Add' }}</button>
            </div>
            <div class="empty-attachments" v-if="!form.attachments.length"><Icon icon="solar:cloud-upload-linear" width="18"/>{{ settingStore.lang === 'zh' ? '暂无附件。点击“添加”或将文件拖到这里' : 'No attachments. Add or drop files here.' }}</div>
            <div class="att-list" v-else>
              <div class="att-item" v-for="(item,index) in form.attachments" :key="`${item.filename}-${index}`">
                <span class="attachment-icon"><Icon v-bind="getIconByName(item.filename)"/></span><span class="att-filename">{{ item.filename }}</span><span class="att-size">{{ formatBytes(item.size) }}</span>
                <button type="button" class="remove-attachment" @click="delAtt(index)"><Icon icon="material-symbols-light:close-rounded" width="20"/></button>
              </div>
            </div>
          </section>
        </main>

        <aside class="compose-aside">
          <section class="side-card recipient-insight">
            <div class="side-title"><span>{{ settingStore.lang === 'zh' ? '收件人洞察' : 'Recipient insight' }}</span><small>{{ form.receiveEmail.length }} {{ settingStore.lang === 'zh' ? '位' : 'people' }}</small></div>
            <div v-if="recipientInsights.length" class="insight-list">
              <div class="insight-person" v-for="item in recipientInsights" :key="item.email"><span>{{ item.initial }}</span><div><strong>{{ item.email }}</strong><small>{{ item.domain }} · {{ item.internal ? (settingStore.lang === 'zh' ? '公司内部' : 'Internal') : (settingStore.lang === 'zh' ? '外部联系人' : 'External') }}</small></div></div>
            </div>
            <div v-else class="side-empty">{{ settingStore.lang === 'zh' ? '添加收件人后显示域名与发送范围' : 'Add recipients to see delivery context' }}</div>
            <button class="contact-book-button" type="button" @click="openContacts"><Icon icon="solar:user-plus-linear" width="17"/>{{ settingStore.lang === 'zh' ? '从通讯录添加' : 'Add from contacts' }}</button>
          </section>

          <section class="side-card preflight-card">
            <div class="side-title"><span>{{ settingStore.lang === 'zh' ? '发送前检查' : 'Pre-send checks' }}</span><small :class="{warning: composeChecks.some(item => !item.ok)}">{{ composeChecks.filter(item => !item.ok).length ? `${composeChecks.filter(item => !item.ok).length} ${settingStore.lang === 'zh' ? '项提醒' : 'warnings'}` : (settingStore.lang === 'zh' ? '已就绪' : 'Ready') }}</small></div>
            <div class="check-list"><div v-for="item in composeChecks" :key="item.label" :class="['check-item', {ok:item.ok, warning:!item.ok}]"><Icon :icon="item.ok ? 'solar:check-circle-bold' : 'solar:danger-circle-linear'" width="15"/><div><strong>{{ item.label }}</strong><small>{{ item.detail }}</small></div></div></div>
          </section>

          <section class="side-card">
            <div class="side-title"><span>{{ settingStore.lang === 'zh' ? '快捷插入' : 'Quick insert' }}</span><small>{{ settingStore.lang === 'zh' ? '点击写入正文' : 'Insert into body' }}</small></div>
            <div class="phrase-list"><button v-for="phrase in quickPhrases" :key="phrase.label" type="button" @click="insertPhrase(phrase.text)">{{ phrase.label }}</button></div>
          </section>

          <section class="side-card">
            <div class="side-title"><span>AI {{ settingStore.lang === 'zh' ? '翻译' : 'Translate' }}</span><small>Workers AI</small></div>
            <div class="translate-row"><select v-model="translateLanguage"><option value="en">English</option><option value="zh">简体中文</option></select><button type="button" :disabled="translating || !form.text.trim()" @click="translateBody"><Icon :icon="translating ? 'svg-spinners:ring-resize' : 'solar:translation-2-linear'" width="16"/>{{ translating ? (settingStore.lang === 'zh' ? '翻译中' : 'Translating') : (settingStore.lang === 'zh' ? '翻译正文' : 'Translate') }}</button></div>
            <p>{{ settingStore.lang === 'zh' ? '翻译会替换当前正文，发送前仍可继续编辑。' : 'Translation replaces the current body and remains editable.' }}</p>
          </section>
        </aside>
      </div>
    </div>

    <el-dialog v-model="showMailPreview" class="mail-preview-dialog" :title="settingStore.lang === 'zh' ? '邮件预览' : 'Email preview'" width="min(760px, calc(100vw - 28px))">
      <div class="preview-message"><div class="preview-meta"><span><b>{{ $t('sender') }}</b> {{ form.name }} &lt;{{ form.sendEmail }}&gt;</span><span><b>{{ $t('recipient') }}</b> {{ form.receiveEmail.join(', ') || '—' }}</span></div><h2>{{ form.subject || (settingStore.lang === 'zh' ? '（未填写主题）' : '(No subject)') }}</h2><ShadowHtml class="preview-body" :html="previewContent" /></div>
    </el-dialog>
    <el-dialog top="10vh" v-model="showContacts" @closed="clearSelectContact" :title="t('recentContacts')">
      <el-table ref="contactsTabRef" row-key="email" :data="contacts" style="height: 445px">
        <el-table-column type="selection" width="32" />
        <el-table-column property="email" :label="t('emailAccount')" >
          <template #default="props">
            <div class="email-row">{{ props.row.email }}</div>
          </template>
        </el-table-column>
        <el-table-column width="55" label="" >
          <template #default>
            <div style="display: flex;">
              <Icon icon="mage:user" style="color: var(--el-text-color-primary)" width="22" height="22" color="#606266" />
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="contacts-bottom">
        <el-button type="default" @click="deleteContact">{{t('clear')}}</el-button>
        <el-button type="primary" @click="chooseContact">{{t('selectContacts')}}</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
import tinyEditor from '@/components/tiny-editor/index.vue'
import ShadowHtml from '@/components/shadow-html/index.vue'
import {h, nextTick, onMounted, onUnmounted, reactive, ref, toRaw, computed} from "vue";
import {Icon} from "@iconify/vue";
import {useUserStore} from "@/store/user.js";
import {emailAiCompose, emailSend} from "@/request/email.js";
import {isEmail} from "@/utils/verify-utils.js";
import {useAccountStore} from "@/store/account.js";
import {useEmailStore} from "@/store/email.js";
import {fileToBase64, formatBytes} from "@/utils/file-utils.js";
import {getIconByName} from "@/utils/icon-utils.js";
import sendPercent from "@/components/send-percent/index.vue"
import {toOssDomain} from "@/utils/convert.js";
import {formatDetailDate} from "@/utils/day.js";
import {useSettingStore} from "@/store/setting.js";
import {userDraftStore} from "@/store/draft.js";
import {useWriterStore} from "@/store/writer.js";
import {useUiStore} from "@/store/ui.js";
import db from "@/db/db.js";
import dayjs from "dayjs";
import {useI18n} from "vue-i18n";
import router from "@/router/index.js";
import {ElMessageBox} from "element-plus";

defineExpose({
  open,
  openReply,
  openReplyWithContent,
  openForward,
  openDraft
})

const {t} = useI18n()
const writerStore = useWriterStore();
const uiStore = useUiStore()
const draftStore = userDraftStore()
const settingStore = useSettingStore()
const emailStore = useEmailStore();
const accountStore = useAccountStore()
const editor = ref({})
const userStore = useUserStore();
const show = ref(false);
const percent = ref(0)
let percentMessage = null
let sending = false
const defValue = ref('')
const contactsTabRef = ref({})
const showContacts = ref(false)
const showMailPreview = ref(false)
const previewContent = ref('')
const translating = ref(false)
const translateLanguage = ref('en')
const mySelect = ref()
let selectStatus = false
const backReply = reactive({
  receiveEmail: [],
  subject: '',
  content: '',
  sendType: ''
})
const form = reactive({
  sendEmail: '',
  receiveEmail: [],
  accountId: -1,
  name: '',
  subject: '',
  content: '',
  sendType: '',
  text: '',
  emailId: 0,
  attachments: [],
  draftId: null,
})

const selectRecipientList = ref([])

const contacts = computed(() => writerStore.sendRecipientRecord.map(item => ({email: item})))
const senderInitial = computed(() => (form.name || form.sendEmail || 'S').trim().charAt(0).toUpperCase())
const composeTitle = computed(() => {
  if (form.sendType === 'reply') return t('reply')
  if (form.sendType === 'forward') return t('forward')
  return settingStore.lang === 'zh' ? '写邮件' : 'New message'
})
const sendActionLabel = computed(() => {
  if (form.sendType === 'reply') return t('reply')
  if (form.sendType === 'forward') return t('forward')
  return t('send')
})
const quotaHint = computed(() => {
  const max = Number(userStore.user.role?.sendCount) || 0
  const used = Number(userStore.user.sendCount) || 0
  if (!max) return settingStore.lang === 'zh' ? '本月外发配额不限' : 'Unlimited monthly quota'
  return settingStore.lang === 'zh' ? `剩余配额 ${Math.max(0, max - used)} 封 / 本月` : `${Math.max(0, max - used)} messages remaining`
})
const attachmentBytes = computed(() => form.attachments.reduce((sum, item) => sum + (Number(item.size) || 0), 0))
const attachmentTotal = computed(() => formatBytes(attachmentBytes.value))
const contentStats = computed(() => {
  const text = String(form.text || '').trim()
  const html = String(form.content || '')
  return {
    characters: text.length,
    words: text ? text.split(/\s+/).filter(Boolean).length : 0,
    images: (html.match(/<img\b/gi) || []).length,
    size: formatBytes(new Blob([html]).size),
  }
})
const recipientInsights = computed(() => {
  const internalDomains = (settingStore.domainList || []).map(item => String(item).replace(/^@/, '').toLowerCase())
  return form.receiveEmail.map(email => {
    const domain = String(email).split('@')[1]?.toLowerCase() || ''
    return { email, domain: domain || '—', initial: String(email).charAt(0).toUpperCase(), internal: internalDomains.includes(domain) }
  })
})
const composeChecks = computed(() => [
  { label: settingStore.lang === 'zh' ? '收件人' : 'Recipients', detail: form.receiveEmail.length ? `${form.receiveEmail.length} ${settingStore.lang === 'zh' ? '位' : 'people'}` : (settingStore.lang === 'zh' ? '尚未添加' : 'Not added'), ok: form.receiveEmail.length > 0 },
  { label: settingStore.lang === 'zh' ? '邮件主题' : 'Subject', detail: form.subject.trim() ? (settingStore.lang === 'zh' ? '已填写' : 'Complete') : (settingStore.lang === 'zh' ? '尚未填写' : 'Missing'), ok: Boolean(form.subject.trim()) },
  { label: settingStore.lang === 'zh' ? '正文内容' : 'Message body', detail: form.text.trim() ? `${contentStats.value.characters} ${settingStore.lang === 'zh' ? '字' : 'characters'}` : (settingStore.lang === 'zh' ? '正文为空' : 'Empty'), ok: Boolean(form.text.trim()) },
  { label: settingStore.lang === 'zh' ? '附件大小' : 'Attachment size', detail: attachmentBytes.value ? attachmentTotal.value : (settingStore.lang === 'zh' ? '无附件' : 'No attachments'), ok: attachmentBytes.value <= 25 * 1024 * 1024 },
])
const quickPhrases = computed(() => settingStore.lang === 'zh' ? [
  {label:'报价有效期', text:'本报价自发出之日起 30 天内有效。'},
  {label:'交期说明', text:'具体交付时间将在订单确认后另行通知。'},
  {label:'付款条款', text:'付款条款请以双方最终确认的订单为准。'},
  {label:'质保条款', text:'产品质保范围与期限以正式合同约定为准。'},
  {label:'索要图纸', text:'烦请提供对应型号、OE 号或技术图纸，以便进一步确认。'},
] : [
  {label:'Quote validity', text:'This quotation is valid for 30 days from the date of issue.'},
  {label:'Lead time', text:'The final lead time will be confirmed after the order is placed.'},
  {label:'Payment terms', text:'Payment terms are subject to the final confirmed order.'},
  {label:'Warranty', text:'Warranty coverage and duration are subject to the final contract.'},
  {label:'Request drawing', text:'Please provide the model, OE number, or technical drawing for further confirmation.'},
])

function openContacts() {
  showContacts.value = true
  nextTick(() => {
    form.receiveEmail.forEach(item => {
      if (writerStore.sendRecipientRecord.includes(item)) {
        contactsTabRef.value.toggleRowSelection({email: item});
      }
    })
  })
}

function deleteContact() {
  ElMessageBox.confirm(t('confirmDeletionOfContacts'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    const contactList = contactsTabRef.value.getSelectionRows().map(item => item.email);
    form.receiveEmail = form.receiveEmail.filter(item => !contactList.includes(item));
    writerStore.sendRecipientRecord = writerStore.sendRecipientRecord.filter(item => !contactList.includes(item));
  })
}

function chooseContact() {

  const contactList = contactsTabRef.value.getSelectionRows().map(item => item.email);
  contactList.forEach(item => {
    if (!form.receiveEmail.includes(item)) {
      form.receiveEmail.push(item);
    }
  })

  form.receiveEmail = form.receiveEmail.filter(item => {
    return contactList.includes(item) || !writerStore.sendRecipientRecord.includes(item);
  });

  showContacts.value = false
}

function clearSelectContact() {
  contactsTabRef.value.clearSelection();
}

function selectChange(value) {
  form.receiveEmail.push(value)
}

function selectStatusChange(status) {
  selectStatus = status
}

const openSelect = () => {
  mySelect.value.toggleMenu()
}

function inputChange(value) {

  selectRecipientList.value = writerStore.sendRecipientRecord.filter(item => value && !form.receiveEmail.includes(item) && item.startsWith(value)).slice(0, 10);

  if (!selectStatus && selectRecipientList.value.length > 0) {
    openSelect()
  }

  if (selectStatus && selectRecipientList.value.length === 0) {
    openSelect()
  }

}

function addTagChange(val) {

  const emails = Array.from(new Set(
      val.split(/[,，]/).map(item => item.trim()).filter(item => item)
  ));

  form.receiveEmail.splice(form.receiveEmail.length - 1, 1)

  let has = false
  emails.forEach(email => {
    if (isEmail(email) && !form.receiveEmail.includes(email)) {
      form.receiveEmail.push(email)
      has = true
    }
  })
  if (selectStatus && has) openSelect()
}

function clearContent() {
  ElMessageBox.confirm(t('clearContentConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    resetForm()
  })

}

function delAtt(index) {
  form.attachments.splice(index, 1);
}

function chooseFile() {
  const doc = document.createElement("input")
  doc.setAttribute("type", "file")
  doc.multiple = true;
  doc.click()
  doc.onchange = (e) => addFiles(e.target.files)
}

async function addFiles(fileList) {
  for (const file of Array.from(fileList || [])) {
    const size = file.size
    const filename = file.name
    const contentType = file.type
    const content = await fileToBase64(file)
    form.attachments.push({content, filename, size, contentType})
  }
}

function handleDrop(event) {
  addFiles(event.dataTransfer?.files)
}

function previewMail() {
  form.content = editor.value.getContent?.() || form.content
  previewContent.value = formatImage(form.content) || `<p>${settingStore.lang === 'zh' ? '（正文为空）' : '(Empty message)'}</p>`
  showMailPreview.value = true
}

function insertPhrase(text) {
  const html = `<p>${String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</p>`
  editor.value.insertContent?.(html)
}

async function translateBody() {
  if (translating.value) return
  const content = editor.value.getContent?.() || form.content
  if (!String(form.text || '').trim()) return
  translating.value = true
  try {
    const data = await emailAiCompose(content, 'translate', translateLanguage.value)
    const translated = String(data?.text || '')
    if (!translated) throw new Error(settingStore.lang === 'zh' ? '未生成译文' : 'No translation returned')
    const html = translated.split(/\n{2,}/).map(part => `<p>${part.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('\n', '<br>')}</p>`).join('')
    editor.value.setContent?.(html)
    ElMessage({message: settingStore.lang === 'zh' ? '正文翻译完成' : 'Message translated', type: 'success', plain: true})
  } catch (error) {
    ElMessage({message: error?.response?.data?.message || error?.message || (settingStore.lang === 'zh' ? '翻译失败' : 'Translation failed'), type: 'warning', plain: true})
  } finally {
    translating.value = false
  }
}

async function sendEmail() {

  if (form.receiveEmail.length === 0) {
    ElMessage({
      message: t('emptyRecipientMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (!form.subject) {
    ElMessage({
      message: t('emptySubjectMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (!form.content) {
    form.content = editor.value.getContent();
  }

  if (!form.content) {
    ElMessage({
      message: t('emptyContentMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (form.manyType === 'divide' && form.attachments.length > 0) {
    ElMessage({
      message: t('noSeparateSendMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (sending) {
    ElMessage({
      message: t('sendingErrorMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  percentMessage = ElMessage({
    message: () => h(sendPercent, {value: percent.value, desc: t('sending')}),
    dangerouslyUseHTMLString: true,
    plain: true,
    duration: 0,
    customClass: 'message-bottom'
  })

  sending = true

  show.value = false

  emailSend(form, (e) => {
    percent.value = Math.round((e.loaded * 98) / e.total)
  }).then(emailList => {
    const email = emailList[0]
    emailList.forEach(item => {
      emailStore.sendScroll?.addItem(item)
    })

    ElNotification({
      title: t('sendSuccessMsg'),
      type: "success",
      message: h('span', {style: 'color: teal'}, email.subject),
      position: 'bottom-right'
    })

    userStore.refreshUserInfo();

    addRecipientRecord();

    if (form.draftId) {
      form.subject = ''
      form.content = ''
      form.receiveEmail = []
      draftStore.setDraft = {...toRaw(form)}
    }

    show.value = false
    resetForm();
  }).catch((e) => {
    ElNotification({
      title: t('sendFailMsg'),
      type: e.code === 403 ? 'warning' : 'error',
      message: h('span', {style: 'color: teal'}, e.message),
      position: 'bottom-right'
    })
    if (e.code === 401) {
      localStorage.removeItem('token');
      router.replace('/login');
    }
    show.value = true
    addRecipientRecord();
  }).finally(() => {
    percentMessage.close()
    percent.value = 0
    sending = false
  })
}

function addRecipientRecord() {
  writerStore.sendRecipientRecord = writerStore.sendRecipientRecord.filter(
      email => !form.receiveEmail.includes(email)
  );

  writerStore.sendRecipientRecord.unshift(...form.receiveEmail);
  writerStore.sendRecipientRecord = writerStore.sendRecipientRecord.slice(0, 500);
}

function resetForm() {
  form.receiveEmail = []
  form.subject = ''
  form.content = ''
  form.text = ''
  form.manyType = null
  form.attachments = []
  form.sendType = ''
  form.emailId = 0
  form.draftId = null
  backReply.content = ''
  backReply.subject = ''
  backReply.receiveEmail = []
  backReply.sendType = ''
  showMailPreview.value = false
  previewContent.value = ''
  editor.value.clearEditor()
}

function change(content, text) {
  form.content = content;
  form.text = text
}

function focusChange() {
  if (selectStatus) openSelect()
}

function openForward(email) {
  resetForm();

  email.subject = email.subject || ''

  form.subject = email.subject
  form.sendType = 'forward'

  defValue.value = ''

  setTimeout(() => {
    defValue.value = `
      ${formatImage(email.content) || `<pre style="font-family: inherit;word-break: break-word;white-space: pre-wrap;margin: 0">${email.text}</pre>`}
    `
    open()

    nextTick(() => {
      backReply.content = editor.value.getContent()
      backReply.subject = form.subject
      backReply.receiveEmail = form.receiveEmail
      backReply.sendType = form.sendType
    })

  });
}

function openReply(email) {

  resetForm();

  email.subject = email.subject || ''

  form.receiveEmail.push(email.sendEmail)
  form.subject = (
      email.subject.startsWith('Re:') ||
      email.subject.startsWith('Re：') ||
      email.subject.startsWith('回复：') ||
      email.subject.startsWith('回复:')) ? email.subject : 'Re: ' + email.subject
  form.sendType = 'reply'
  form.emailId = email.emailId

  defValue.value = ''

  setTimeout(() => {
    defValue.value = `
    <div></div>
    <div>
    <br>
        ${formatDetailDate(email.createTime)} ${email.name} &lt${email.sendEmail}&gt ${t('wrote')}:
    </div>
    <blockquote class="mceNonEditable" style="margin: 0 0 0 0.8ex;border-left: 1px solid rgb(204,204,204);padding-left: 1ex;">
      <articl>
          ${formatImage(email.content) || `<pre style="font-family: inherit;word-break: break-word;white-space: pre-wrap;margin: 0">${email.text}</pre>`}
      </article>
    </blockquote>`
    open()

    nextTick(() => {
      backReply.content = editor.value.getContent()
      backReply.subject = form.subject
      backReply.receiveEmail = form.receiveEmail
      backReply.sendType = form.sendType
    })
  })

}

function formatImage(content) {
  content = content || '';
  const domain = settingStore.settings.r2Domain;
  return content.replace(/{{domain}}/g, toOssDomain(domain) + '/');
}

async function open() {
  if (!accountStore.currentAccount.email) {
    form.sendEmail = userStore.user.email;
    form.accountId = userStore.user.account.accountId;
    form.name = userStore.user.name;
  } else {
    form.sendEmail = accountStore.currentAccount.email;
    form.accountId = accountStore.currentAccount.accountId;
    form.name = accountStore.currentAccount.name;
  }
  show.value = true;
  await nextTick()
  editor.value?.focus?.()
}

async function openDraft(draft) {
  Object.assign(form, {...draft})
  defValue.value = ''
  setTimeout(() => defValue.value = form.content)
  show.value = true;
  await nextTick()
  editor.value?.focus?.()
}

const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    close()
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

function close() {

  if (selectStatus) openSelect();

  if (!form.content) {
    form.content = editor.value.getContent();
  }

  if (form.draftId) {
    draftStore.setDraft = {...toRaw(form)}
    show.value = false
    resetForm()
    return;
  }

  if (!(form.content || form.subject || form.receiveEmail.length > 0)) {
    show.value = false
    resetForm()
    return;
  }

  if (backReply.sendType === 'reply' || backReply.sendType === 'forward') {
    let subjectFlag = form.subject === backReply.subject
    let contentFlag = editor.value.getContent() === backReply.content
    let receiveFlag = form.receiveEmail.length === 1 && form.receiveEmail[0] === backReply.receiveEmail[0]
    if (backReply.sendType === 'forward' && form.receiveEmail.length === 0) {
      receiveFlag = true;
    }
    if (subjectFlag && contentFlag && receiveFlag) {
      resetForm();
      close()
      return;
    }
  }

  ElMessageBox.confirm(t('saveDraftConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning',
    distinguishCancelAndClose: true
  }).then(saveDraftNow).catch((action) => {
    if (action === 'cancel') {
      show.value = false
      resetForm()
    }
  })

}

function openReplyWithContent(email, replyText = '') {
  resetForm();
  email.subject = email.subject || ''
  form.receiveEmail.push(email.sendEmail)
  form.subject = /^(Re:|Re：|回复：|回复:)/i.test(email.subject) ? email.subject : 'Re: ' + email.subject
  form.sendType = 'reply'
  form.emailId = email.emailId
  defValue.value = ''

  const safeText = String(replyText)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;')
      .replaceAll('\n', '<br>')

  setTimeout(() => {
    defValue.value = `<div>${safeText}</div><div><br></div><div>${formatDetailDate(email.createTime)} ${email.name || ''} &lt;${email.sendEmail}&gt; ${t('wrote')}:</div><blockquote class="mceNonEditable" style="margin:0 0 0 .8ex;border-left:1px solid #ccc;padding-left:1ex;">${formatImage(email.content) || `<pre style="font-family:inherit;word-break:break-word;white-space:pre-wrap;margin:0">${email.text || ''}</pre>`}</blockquote>`
    open()
    nextTick(() => {
      backReply.content = editor.value.getContent()
      backReply.subject = form.subject
      backReply.receiveEmail = [...form.receiveEmail]
      backReply.sendType = form.sendType
    })
  })
}

async function saveDraftNow() {
  if (!form.content) form.content = editor.value.getContent()

  if (form.draftId) {
    draftStore.setDraft = {...toRaw(form)}
  } else {
    const formData = {...toRaw(form)}
    delete formData.draftId
    delete formData.attachments
    formData.createTime = dayjs().utc().format('YYYY-MM-DD HH:mm:ss')
    const draftId = await db.value.draft.add({...formData})
    await db.value.att.add({draftId, attachments: toRaw(form.attachments)})
    draftStore.refreshList++
  }

  show.value = false
  await nextTick()
  resetForm()
}

</script>
<style>
.write-select .el-select-dropdown__list {
  padding: 4px 4px !important;
}
.write-select .el-select-dropdown__item {
  padding: 0 10px 0 10px;
}

.write-select .el-select-dropdown {
  min-width: 0 !important;
}
</style>
<style scoped lang="scss">
.send {
  position: fixed;
  inset: 0;
  z-index: 1900;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: color-mix(in srgb, #07110d 58%, transparent);
  backdrop-filter: blur(8px);

  .write-box {
    width: min(1180px, 100%);
    height: min(820px, calc(100vh - 48px));
    display: grid;
    grid-template-rows: auto 1fr;
    overflow: hidden;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 18px;
    box-shadow: 0 24px 64px rgba(3, 20, 12, .28);
    transition: var(--el-transition-duration);

    .container {
      min-height: 0;
      height: 100%;
      display: grid;
      grid-template-rows: auto minmax(250px, 1fr) auto;
      gap: 14px;
      padding: 18px 20px 20px;
    }
  }
}
.send.compose-full { left: 0; }

.compose-header {
  min-height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 12px 18px 12px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.compose-heading,
.compose-header-actions,
.sender-row,
.recipient-control,
.footer-tools {
  display: flex;
  align-items: center;
}

.compose-heading { min-width: 0; gap: 12px; }
.compose-icon {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  display: grid;
  place-items: center;
  color: #fff;
  background: linear-gradient(145deg, #11a861, #08723f);
  border-radius: 12px;
  box-shadow: 0 7px 18px rgba(16, 139, 80, .24);
}
.compose-title-copy { min-width: 0; display: grid; gap: 2px; }
.compose-title-copy strong { color: var(--el-text-color-primary); font-size: 17px; line-height: 1.25; }
.compose-title-copy span { color: var(--el-text-color-secondary); font-size: 12px; }
.compose-header-actions { gap: 9px; }

.draft-button,
.close-button,
.contacts-button,
.tool-button,
.remove-attachment,
.send-button {
  border: 0;
  font: inherit;
  cursor: pointer;
}
.draft-button {
  height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 13px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-light);
  border-radius: 9px;
}
.draft-button:hover { color: #0a8c4d; border-color: color-mix(in srgb, #0a8c4d 45%, var(--el-border-color)); }
.close-button {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  color: var(--el-text-color-secondary);
  background: transparent;
  border-radius: 9px;
}
.close-button:hover { color: var(--el-text-color-primary); background: var(--el-fill-color-light); }

.message-meta {
  overflow: hidden;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 13px;
}
.sender-row,
.field-row {
  min-height: 48px;
  padding: 8px 13px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.field-row:last-child { border-bottom: 0; }
.sender-row { gap: 8px; }
.sender-avatar {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  display: grid;
  place-items: center;
  color: #08703e;
  font-size: 12px;
  font-weight: 800;
  background: #dff7e9;
  border: 1px solid #bde9cf;
  border-radius: 50%;
}
.meta-label,
.field-row > label {
  width: 66px;
  flex: 0 0 66px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.sender-name { color: var(--el-text-color-primary); font-size: 13px; }
.send-email {
  min-width: 0;
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.field-row { display: flex; align-items: center; }
.recipient-control { min-width: 0; flex: 1; gap: 8px; }
.recipient-control :deep(.el-input-tag) { min-width: 0; flex: 1; box-shadow: none; }
.recipient-control :deep(.el-input-tag__wrapper) { padding-left: 0; box-shadow: none !important; }
.subject-row :deep(.el-input) { flex: 1; }
.subject-row :deep(.el-input__wrapper) { padding-left: 0; box-shadow: none !important; }
.contacts-button {
  height: 30px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 9px;
  color: #087b45;
  background: color-mix(in srgb, #12a861 10%, var(--el-bg-color));
  border-radius: 8px;
  white-space: nowrap;
}

.editor-shell {
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 13px;
}
.editor-shell :deep(.tox-tinymce) { border: 0 !important; }
.editor-shell :deep(.tox-editor-header) { border-bottom: 1px solid var(--el-border-color-lighter) !important; box-shadow: none !important; }
.editor-shell :deep(.tox-toolbar-overlord),
.editor-shell :deep(.tox-toolbar__primary) { background-image: none !important; }

.compose-footer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 14px;
  padding: 12px;
  background: var(--el-fill-color-extra-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 13px;
}
.attachment-zone { min-width: 0; }
.footer-tools { min-width: 0; gap: 8px; }
.tool-button {
  height: 34px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  color: #087b45;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  white-space: nowrap;
}
.tool-button-muted { color: var(--el-text-color-regular); }
.tool-button:hover { border-color: #23a667; }
.drop-tip {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 11.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.att-list {
  max-height: 88px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(255px, 1fr));
  gap: 7px;
  overflow-y: auto;
  margin-top: 9px;
}
.att-item {
  min-width: 0;
  height: 38px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 7px;
  padding: 4px 6px 4px 8px;
  color: var(--el-text-color-primary);
  font-size: 12.5px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}
.attachment-icon { display: flex; color: #129154; }
.att-filename { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.att-size { color: var(--el-text-color-secondary); font-size: 11px; white-space: nowrap; }
.remove-attachment {
  width: 25px;
  height: 25px;
  display: grid;
  place-items: center;
  color: var(--el-text-color-secondary);
  background: transparent;
  border-radius: 6px;
}
.remove-attachment:hover { color: #d14343; background: color-mix(in srgb, #d14343 9%, transparent); }
.send-button {
  height: 42px;
  min-width: 104px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 20px;
  color: #fff;
  font-weight: 700;
  background: linear-gradient(135deg, #16a762, #087940);
  border-radius: 10px;
  box-shadow: 0 8px 20px rgba(9, 132, 71, .22);
}
.send-button:hover { filter: brightness(1.05); transform: translateY(-1px); }

.email-row {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.el-dialog) {
  width: 420px !important;
  @media (max-width: 460px) {
    width: calc(100% - 40px) !important;
    margin-right: 20px !important;
    margin-left: 20px !important;
  }
}

.contacts-bottom {
  display: flex;
  justify-content: end;
  margin-top: 10px;
}

.write-select {
  position: absolute;
  width: 300px;
  left: 60px;
  z-index: 0;
  opacity: 0;
  pointer-events: none;
}

:deep(.el-input-tag__suffix) {
  padding-right: 4px;
}

@media (max-width: 767px) {
  .send { padding: 0; }
  .write-box {
    width: 100% !important;
    height: 100% !important;
    border: 0 !important;
    border-radius: 0 !important;
  }
  .compose-header { min-height: 60px; padding: 9px 10px 9px 13px; }
  .compose-icon { width: 36px; height: 36px; flex-basis: 36px; border-radius: 10px; }
  .compose-title-copy span { display: none; }
  .draft-button { padding: 0 10px; }
  .write-box .container { gap: 9px !important; padding: 10px !important; }
  .sender-row, .field-row { min-height: 44px; padding: 7px 10px; }
  .meta-label, .field-row > label { width: 52px; flex-basis: 52px; }
  .send-email { display: none; }
  .contacts-button span { display: none; }
  .contacts-button { width: 32px; justify-content: center; padding: 0; }
  .compose-footer { gap: 9px; padding: 9px; }
  .drop-tip { display: none; }
  .tool-button span { display: none; }
  .tool-button { width: 34px; justify-content: center; padding: 0; }
  .send-button { min-width: 86px; padding: 0 14px; }
  .att-list { grid-template-columns: minmax(0, 1fr); }
}

@media (max-width: 420px) {
  .draft-button span { display: none; }
  .draft-button { width: 36px; justify-content: center; padding: 0; }
  .compose-title-copy strong { font-size: 15px; }
}

/* Full-page compose workspace, aligned with the product redesign reference. */
.send {
  inset: 56px 0 0 var(--sidebar-w);
  z-index: 90;
  display: block;
  padding: 0;
  overflow: auto;
  background: var(--surface-2);
  backdrop-filter: none;
}
.compose-workspace { width: min(1080px, calc(100% - 32px)); min-height: 100%; margin: 0 auto; padding: 24px 0 36px; }
.compose-topbar { height: 42px; display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.compose-topbar h1 { margin: 0; color: var(--text); font-size: 17px; font-weight: 800; letter-spacing: -.25px; }
.topbar-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }
.back-button, .secondary-button, .inline-link, .add-attachment, .contact-book-button, .phrase-list button, .translate-row button { border: 0; font: inherit; cursor: pointer; }
.back-button, .secondary-button { height: 38px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 0 11px; color: var(--text-2); background: var(--surface); border: 1px solid var(--border); border-radius: 9px; font-size: 12.5px; font-weight: 650; }
.back-button:hover, .secondary-button:hover { color: var(--brand-700); border-color: color-mix(in srgb, var(--brand-500) 40%, var(--border)); background: var(--brand-soft); }
.topbar-actions .send-button { height: 38px; min-width: 80px; padding: 0 14px; border-radius: 9px; font-size: 12.5px; }
.compose-grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; align-items: start; gap: 16px; }
.compose-main-card { min-width: 0; overflow: hidden; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); box-shadow: var(--sh-1); }
.compose-main-card .message-meta { overflow: visible; border: 0; border-radius: 0; background: var(--surface); }
.compose-main-card .field-row { min-height: 46px; padding: 7px 16px; border-bottom: 1px solid var(--border); }
.compose-main-card .field-row > label { width: 64px; flex-basis: 64px; color: var(--text-2); font-size: 12.5px; font-weight: 700; }
.recipient-control { gap: 7px; }
.recipient-control :deep(.el-input-tag__wrapper) { min-height: 30px; }
.inline-link { flex: 0 0 auto; padding: 4px 0; color: var(--brand-700); background: transparent; font-size: 12px; font-weight: 700; }
.subject-row :deep(.el-input__inner) { color: var(--text); font-weight: 650; }
.identity-row { gap: 8px; }
.sender-identity { min-width: 0; display: flex; align-items: center; gap: 7px; color: var(--text-3); font-size: 12px; }
.sender-identity strong { color: var(--text); font-size: 12.5px; }
.sender-avatar { width: 26px; height: 26px; flex-basis: 26px; }
.quota-hint { margin-left: auto; color: var(--text-3); font-size: 11px; white-space: nowrap; }
.compose-main-card .editor-shell { height: 450px; min-height: 360px; overflow: hidden; border: 0; border-radius: 0; background: var(--surface); }
.compose-main-card .editor-shell :deep(.tox-editor-header) { padding: 0 8px !important; background: var(--surface-2) !important; border-bottom: 1px solid var(--border) !important; }
.compose-main-card .editor-shell :deep(.tox-toolbar-overlord), .compose-main-card .editor-shell :deep(.tox-toolbar__primary) { background: var(--surface-2) !important; }
.compose-main-card .editor-shell :deep(.tox-edit-area) { background: var(--surface); }
.editor-status { min-height: 36px; padding: 7px 16px; display: flex; align-items: center; flex-wrap: wrap; gap: 12px; color: var(--text-3); background: var(--surface-2); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); font-size: 10.5px; }
.editor-status .compatibility { margin-left: auto; display: inline-flex; align-items: center; gap: 5px; }
.attachment-zone { padding: 14px 16px; background: var(--surface-2); }
.attachment-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.attachment-head > div { display: flex; align-items: center; gap: 9px; }
.attachment-head strong { color: var(--text-2); font-size: 12px; }
.attachment-head span { color: var(--text-3); font-size: 11px; }
.add-attachment { height: 30px; display: inline-flex; align-items: center; gap: 5px; padding: 0 9px; color: var(--text-2); background: var(--surface); border: 1px solid var(--border); border-radius: 8px; font-size: 11.5px; }
.empty-attachments { min-height: 32px; margin-top: 8px; display: flex; align-items: center; gap: 6px; color: var(--text-3); font-size: 11.5px; }
.compose-main-card .att-list { max-height: 130px; }
.compose-aside { display: grid; gap: 14px; }
.side-card { min-width: 0; padding: 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); box-shadow: var(--sh-1); }
.side-title { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.side-title > span { color: var(--text-3); font-size: 11.5px; font-weight: 750; }
.side-title small { margin-left: auto; padding: 3px 7px; color: var(--text-3); background: var(--surface-2); border-radius: 7px; font-size: 10.5px; }
.side-title small.warning { color: #b45309; background: #fff3dd; }
.insight-list { display: grid; gap: 8px; }
.insight-person { min-width: 0; display: flex; align-items: center; gap: 9px; }
.insight-person > span { width: 32px; height: 32px; flex: 0 0 32px; display: grid; place-items: center; color: #fff; background: linear-gradient(135deg, #f59e0b, #f97316); border-radius: 50%; font-size: 11px; font-weight: 800; }
.insight-person > div { min-width: 0; display: grid; gap: 2px; }
.insight-person strong, .insight-person small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.insight-person strong { color: var(--text); font-size: 11.5px; }
.insight-person small { color: var(--text-3); font-size: 10.5px; }
.side-empty { padding: 10px; color: var(--text-3); background: var(--surface-2); border-radius: 8px; font-size: 11.5px; line-height: 1.55; }
.contact-book-button { width: 100%; height: 36px; margin-top: 11px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; color: var(--brand-700); background: var(--brand-soft); border-radius: 8px; font-size: 12px; font-weight: 750; }
.check-list { display: grid; gap: 6px; }
.check-item { min-height: 52px; padding: 8px 9px; display: flex; align-items: flex-start; gap: 7px; border-radius: 8px; }
.check-item.ok { color: var(--success); background: color-mix(in srgb, var(--success) 9%, var(--surface)); }
.check-item.warning { color: #b45309; background: color-mix(in srgb, #f59e0b 11%, var(--surface)); }
.check-item > div { display: grid; gap: 2px; }
.check-item strong { font-size: 11.5px; }
.check-item small { color: var(--text-3); font-size: 10.5px; }
.phrase-list { display: flex; flex-wrap: wrap; gap: 6px; }
.phrase-list button { padding: 5px 8px; color: var(--text-2); background: var(--surface-2); border: 1px solid transparent; border-radius: 999px; font-size: 10.5px; }
.phrase-list button:hover { color: var(--brand-700); background: var(--brand-soft); border-color: color-mix(in srgb, var(--brand-500) 25%, var(--border)); }
.translate-row { display: grid; grid-template-columns: 1fr auto; gap: 7px; }
.translate-row select { min-width: 0; height: 34px; padding: 0 8px; color: var(--text-2); background: var(--surface); border: 1px solid var(--border); border-radius: 8px; outline: 0; font: inherit; font-size: 11.5px; }
.translate-row button { height: 34px; display: inline-flex; align-items: center; gap: 5px; padding: 0 10px; color: #fff; background: var(--brand-600); border-radius: 8px; font-size: 11.5px; font-weight: 700; }
.translate-row button:disabled { cursor: not-allowed; opacity: .5; }
.side-card > p { margin: 8px 0 0; color: var(--text-3); font-size: 10.5px; line-height: 1.55; }
:global(.mail-preview-dialog) { width: min(760px, calc(100vw - 28px)) !important; border-radius: 14px !important; }
:global(.mail-preview-dialog .el-dialog__body) { padding-top: 8px; }
.preview-message { padding: 4px 6px 12px; }
.preview-meta { display: flex; flex-wrap: wrap; gap: 7px 20px; color: var(--text-3); font-size: 11.5px; }
.preview-meta b { color: var(--text-2); }
.preview-message h2 { margin: 13px 0 18px; color: var(--text); font-size: 18px; }
.preview-body { min-height: 240px; padding-top: 16px; border-top: 1px solid var(--border); color: var(--text); line-height: 1.75; }

@media (max-width: 1200px) {
  .compose-workspace { width: calc(100% - 24px); }
  .compose-grid { grid-template-columns: minmax(0, 1fr) 285px; gap: 12px; }
}
@media (max-width: 1024px) {
  .send { inset: 56px 0 0 0; }
  .compose-grid { grid-template-columns: minmax(0, 1fr); }
  .compose-aside { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 767px) {
  .send { inset: 52px 0 58px 0; }
  .compose-workspace { width: 100%; padding: 10px 10px 24px; }
  .compose-topbar { height: auto; min-height: 42px; flex-wrap: wrap; }
  .compose-topbar h1 { font-size: 15px; }
  .topbar-actions { gap: 5px; }
  .secondary-button { width: 36px; padding: 0; font-size: 0; }
  .topbar-actions .send-button { min-width: 68px; padding: 0 10px; }
  .compose-main-card { border-radius: var(--r-md); }
  .compose-main-card .field-row { align-items: flex-start; flex-direction: column; gap: 5px; padding: 9px 11px; }
  .compose-main-card .field-row > label { width: auto; flex-basis: auto; }
  .recipient-control { width: 100%; flex-wrap: wrap; }
  .recipient-control :deep(.el-input-tag) { flex-basis: 100%; }
  .quota-hint { margin-left: 0; }
  .compose-main-card .editor-shell { height: 420px; min-height: 320px; }
  .editor-status { gap: 7px; padding: 7px 10px; }
  .editor-status .compatibility { width: 100%; margin-left: 0; }
  .compose-aside { grid-template-columns: minmax(0, 1fr); }
}
</style>
