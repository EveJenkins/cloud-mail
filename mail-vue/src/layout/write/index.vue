<template>
  <div class="send" v-show="show">
    <div class="write-box">
      <header class="compose-header">
        <div class="compose-heading">
          <span class="compose-icon">
            <Icon icon="hugeicons:quill-write-01" width="23" height="23"/>
          </span>
          <div class="compose-title-copy">
            <strong>{{ composeTitle }}</strong>
            <span>{{ settingStore.lang === 'zh' ? '创建一封清晰、专业的邮件' : 'Create a clear, professional message' }}</span>
          </div>
        </div>
        <div class="compose-header-actions">
          <button class="draft-button" type="button" @click="saveDraftNow">
            <Icon icon="solar:diskette-outline" width="18" height="18"/>
            <span>{{ settingStore.lang === 'zh' ? '存草稿' : 'Save draft' }}</span>
          </button>
          <button class="close-button" type="button" :aria-label="t('close')" @click="close">
            <Icon icon="material-symbols-light:close-rounded" width="24" height="24"/>
          </button>
        </div>
      </header>
      <div class="container">
        <section class="message-meta">
          <div class="sender-row">
            <span class="sender-avatar">{{ senderInitial }}</span>
            <span class="meta-label">{{ $t('sender') }}</span>
            <strong class="sender-name">{{ form.name }}</strong>
            <span class="send-email">&lt;{{ form.sendEmail }}&gt;</span>
          </div>
          <div class="field-row recipient-row">
            <label>{{ $t('recipient') }}</label>
            <div class="recipient-control">
              <el-input-tag @add-tag="addTagChange" tag-type="primary" @input="inputChange" size="default" v-model="form.receiveEmail">
                <template #prefix>
                  <el-select
                      ref="mySelect"
                      class="write-select"
                      popper-class="write-select"
                      :show-arrow="false"
                      :no-match-text="' '"
                      :no-data-text="' '"
                      @visible-change="selectStatusChange"
                      @change="selectChange"
                  >
                    <el-option
                        v-for="item in selectRecipientList"
                        :key="item"
                        :label="item"
                        :value="item"
                        style="color: #999896;"
                    />
                  </el-select>
                </template>
              </el-input-tag>
              <button class="contacts-button" type="button" @click.stop="openContacts">
                <Icon icon="fa7-solid:user-plus" width="17" height="17"/>
                <span>{{ settingStore.lang === 'zh' ? '通讯录' : 'Contacts' }}</span>
              </button>
            </div>
          </div>
          <div class="field-row subject-row">
            <label>{{ $t('subject') }}</label>
            <el-input v-model="form.subject" :placeholder="settingStore.lang === 'zh' ? '请输入邮件主题' : 'Enter a subject'" />
          </div>
        </section>

        <section class="editor-shell">
          <tinyEditor :def-value="defValue" ref="editor" @change="change" @focus="focusChange" />
        </section>

        <section class="compose-footer" @dragover.prevent @drop.prevent="handleDrop">
          <div class="attachment-zone">
            <div class="footer-tools">
              <button class="tool-button" type="button" @click="chooseFile">
                <Icon icon="iconamoon:attachment-fill" width="19" height="19"/>
                <span>{{ settingStore.lang === 'zh' ? '添加附件' : 'Add attachment' }}</span>
              </button>
              <button class="tool-button tool-button-muted" type="button" @click="clearContent">
                <Icon icon="icon-park-outline:clear-format" width="18" height="18"/>
                <span>{{ settingStore.lang === 'zh' ? '清空内容' : 'Clear' }}</span>
              </button>
              <span class="drop-tip">
                <Icon icon="solar:cloud-upload-linear" width="17" height="17"/>
                {{ settingStore.lang === 'zh' ? '可将文件拖到此处，附件安全存储至 Cloudflare R2' : 'Drop files here · secured by Cloudflare R2' }}
              </span>
            </div>
            <div class="att-list" v-if="form.attachments.length">
              <div class="att-item" v-for="(item,index) in form.attachments" :key="`${item.filename}-${index}`">
                <span class="attachment-icon"><Icon v-bind="getIconByName(item.filename)"/></span>
                <span class="att-filename">{{ item.filename }}</span>
                <span class="att-size">{{ formatBytes(item.size) }}</span>
                <button type="button" class="remove-attachment" @click="delAtt(index)">
                  <Icon icon="material-symbols-light:close-rounded" width="20" height="20"/>
                </button>
              </div>
            </div>
          </div>
          <button class="send-button" type="button" @click="sendEmail">
            <Icon icon="solar:plain-2-bold" width="18" height="18"/>
            <span>{{ sendActionLabel }}</span>
          </button>
        </section>
      </div>
    </div>
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
import {h, nextTick, onMounted, onUnmounted, reactive, ref, toRaw, computed} from "vue";
import {Icon} from "@iconify/vue";
import {useUserStore} from "@/store/user.js";
import {emailSend} from "@/request/email.js";
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
import db from "@/db/db.js";
import dayjs from "dayjs";
import {useI18n} from "vue-i18n";
import router from "@/router/index.js";
import {ElMessageBox} from "element-plus";

defineExpose({
  open,
  openReply,
  openForward,
  openDraft
})

const {t} = useI18n()
const writerStore = useWriterStore();
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
  form.manyType = null
  form.attachments = []
  form.sendType = ''
  form.emailId = 0
  form.draftId = null
  backReply.content = ''
  backReply.subject = ''
  backReply.receiveEmail = []
  backReply.sendType = ''
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

function open() {
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
  editor.value.focus()
}

function openDraft(draft) {
  Object.assign(form, {...draft})
  defValue.value = ''
  setTimeout(() => defValue.value = form.content)
  show.value = true;
  editor.value.focus()
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
</style>
