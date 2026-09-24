<template>
  <div class="box">
    <div class="header-actions">
      <div class="action-group">
        <button v-if="!embedded" class="detail-action icon-only" :title="settingStore.lang === 'zh' ? '返回' : 'Back'" @click="handleBack"><Icon icon="material-symbols-light:arrow-back-ios-new" width="18" /></button>
        <button v-perm="'email:delete'" class="detail-action icon-only" :title="$t('delete')" @click="handleDelete"><Icon icon="uiw:delete" width="16" /></button>
        <button class="detail-action icon-only" v-if="emailStore.contentData.showStar" :title="$t('star')" @click="changeStar">
          <Icon v-if="email.isStar" icon="fluent-color:star-16" width="19" />
          <Icon v-else icon="solar:star-line-duotone" width="18" />
        </button>
      </div>
      <div class="action-group action-group-right" v-if="emailStore.contentData.showReply" v-perm="'email:send'">
        <button class="detail-action" @click="openReply"><Icon icon="la:reply" width="18" />{{ $t('reply') }}</button>
        <button class="detail-action" @click="openForward"><Icon icon="iconoir:arrow-up-right" width="17" />{{ $t('forward') }}</button>
      </div>
    </div>
    <div></div>
    <el-scrollbar class="scrollbar">
      <div class="container">
        <div class="message-card">
        <div class="email-title">
          {{ email.subject }}
        </div>
        <div class="code-card" v-if="email.code">
          <div class="code-insight">
            <span class="code-icon"><Icon icon="solar:clock-circle-linear" width="19" height="19" /></span>
            <div>
              <strong>Workers AI {{ settingStore.lang === 'zh' ? '自动识别' : 'detected code' }}</strong>
              <span>{{ settingStore.lang === 'zh' ? '验证码已提取，可一键复制' : 'Ready to copy' }}</span>
            </div>
          </div>
          <span class="code-value">{{ email.code }}</span>
          <el-button type="primary" @click="copyCode">{{ settingStore.lang === 'zh' ? '复制' : 'Copy' }}</el-button>
        </div>
        <div class="content">
          <div class="email-info">
            <div class="sender-summary">
              <span class="sender-avatar" :style="{ background: senderGradient }">{{ senderInitials }}</span>
              <div class="sender-copy">
                <div class="sender-primary">
                  <strong>{{ email.name || email.sendEmail }}</strong>
                  <span>&lt;{{ email.sendEmail }}&gt;</span>
                </div>
                <div class="sender-secondary">
                  {{ settingStore.lang === 'zh' ? '发送至' : 'To' }} {{ formateReceive(email.recipient) }} · {{ formatDetailDate(email.createTime) }}
                </div>
              </div>
            </div>
            <el-alert v-if="email.status === 3" :closable="false" :title="toMessage(email.message)" class="email-msg" type="error" show-icon />
            <el-alert v-if="email.status === 4" :closable="false" :title="$t('complained')" class="email-msg" type="warning" show-icon />
            <el-alert v-if="email.status === 5" :closable="false" :title="$t('delayed')" class="email-msg" type="warning" show-icon />
          </div>
          <el-scrollbar class="htm-scrollbar" :class="!email.attList?.length ? 'bottom-distance' : ''">
            <ShadowHtml class="shadow-html" :html="formatImage(email.content)" v-if="email.content" />
            <pre v-else class="email-text" >{{email.text}}</pre>
          </el-scrollbar>
          <div class="att" v-if="email.attList?.length > 0">
            <div class="att-title">
              <span>{{$t('attachments')}} · Cloudflare R2</span>
              <span>{{$t('attCount',{total: email.attList.length})}}</span>
            </div>
            <div class="att-box">

              <div class="att-item" v-for="att in email.attList" :key="att.attId">
                <div class="att-icon" @click="showImage(att.key)">
                  <Icon v-bind="getIconByName(att.filename)" />
                </div>
                <div class="att-name" @click="showImage(att.key)">
                  {{ att.filename }}
                </div>
                <div class="att-size">{{ formatBytes(att.size) }}</div>
                <div class="opt-icon att-icon">
                  <Icon v-if="isImage(att.filename)" icon="hugeicons:view" width="22" height="22" @click="showImage(att.key)"/>
                  <a :href="cvtR2Url(att.key)" download>
                    <Icon icon="system-uicons:push-down" width="22" height="22"/>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div class="delivery-trace">
            <div class="trace-heading">
              <Icon icon="solar:route-linear" width="17" height="17"/>
              <strong>{{ settingStore.lang === 'zh' ? '邮件处理轨迹' : 'Message processing path' }}</strong>
            </div>
            <div class="trace-item">
              <span class="trace-dot success"></span>
              <span>{{ settingStore.lang === 'zh' ? '邮件已由 Cloudflare Email Routing 接收' : 'Accepted by Cloudflare Email Routing' }}</span>
            </div>
            <div class="trace-item" v-if="email.code">
              <span class="trace-dot success"></span>
              <span>{{ settingStore.lang === 'zh' ? 'Workers AI 已识别验证码' : 'Verification code detected by Workers AI' }}</span>
            </div>
            <div class="trace-item" v-if="email.attList?.length">
              <span class="trace-dot success"></span>
              <span>{{ settingStore.lang === 'zh' ? `附件已存储至 R2（${email.attList.length} 个）` : `Attachments stored in R2 (${email.attList.length})` }}</span>
            </div>
            <div class="trace-item" v-if="telegramEnabled">
              <span class="trace-dot brand"></span>
              <span>{{ settingStore.lang === 'zh' ? 'Telegram 推送通道已启用' : 'Telegram push channel enabled' }}</span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </el-scrollbar>
    <el-image-viewer
        v-if="showPreview"
        :url-list="srcList"
        show-progress
        @close="showPreview = false"
    />
  </div>
</template>
<script setup>
import ShadowHtml from '@/components/shadow-html/index.vue'
import {computed, reactive, ref, watch, onMounted, onUnmounted} from "vue";
import {useRouter} from 'vue-router'
import {ElMessage, ElMessageBox} from 'element-plus'
import {emailDelete, emailRead} from "@/request/email.js";
import {Icon} from "@iconify/vue";
import {useEmailStore} from "@/store/email.js";
import {useAccountStore} from "@/store/account.js";
import {formatDetailDate} from "@/utils/day.js";
import {starAdd, starCancel} from "@/request/star.js";
import {getExtName, formatBytes} from "@/utils/file-utils.js";
import {cvtR2Url,toOssDomain} from "@/utils/convert.js";
import {getIconByName} from "@/utils/icon-utils.js";
import {useSettingStore} from "@/store/setting.js";
import {allEmailDelete} from "@/request/all-email.js";
import {useUiStore} from "@/store/ui.js";
import {useI18n} from "vue-i18n";
import {EmailUnreadEnum} from "@/enums/email-enum.js";

const props = defineProps({
  embedded: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['close'])
const embedded = computed(() => props.embedded)

const uiStore = useUiStore();
const settingStore = useSettingStore();
const accountStore = useAccountStore();
const emailStore = useEmailStore();
const router = useRouter()
const email = computed(() => emailStore.contentData.email || {
  emailId: 0,
  attList: [],
  content: '',
  text: '',
  recipient: '[]',
})
const showPreview = ref(false)
const srcList = reactive([])
const telegramEnabled = computed(() => settingStore.settings?.tgBotStatus === 0)
const senderInitials = computed(() => {
  const value = String(email.value.name || email.value.sendEmail || 'M').replace(/@.*/, '').trim()
  return value.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'M'
})
const senderGradient = computed(() => {
  const value = String(email.value.name || email.value.sendEmail || '')
  const palettes = [
    ['#25d366', '#0ea5e9'], ['#f59e0b', '#f97316'], ['#8b5cf6', '#ec4899'], ['#0ea5e9', '#0284c7']
  ]
  const score = Array.from(value).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const [from, to] = palettes[score % palettes.length]
  return `linear-gradient(135deg, ${from}, ${to})`
})

const { t } = useI18n()
watch(() => accountStore.currentAccountId, () => {
  handleBack()
})

let readRequesting = false

function tryMarkRead() {
  if (!emailStore.contentData.showUnread || readRequesting) return
  const current = email.value
  if (!current?.emailId || current.unread !== EmailUnreadEnum.UNREAD) return

  // 等详情数据就绪（detailMap 已写入，或正文已有内容）再标已读
  const full = emailStore.detailMap[current.emailId]
  const detailReady = !!full || !!(current.content || current.text)
  if (!detailReady) return

  readRequesting = true
  const emailId = current.emailId
  current.unread = EmailUnreadEnum.READ
  if (emailStore.detailMap[emailId]) {
    emailStore.detailMap[emailId].unread = EmailUnreadEnum.READ
  }
  emailStore.markListRead(emailId)
  emailRead([emailId]).finally(() => {
    readRequesting = false
  })
}

watch(
  () => [
    email.value?.emailId,
    email.value?.content,
    email.value?.text,
    emailStore.detailMap[email.value?.emailId]
  ],
  () => tryMarkRead(),
  { flush: 'post' }
)

onMounted(() => {
  tryMarkRead()
  window.addEventListener('keydown', handleKeyDown);
})

onUnmounted(() => {
  emailStore.contentData.showUnread = false;
  readRequesting = false
  window.removeEventListener('keydown', handleKeyDown);
})

function handleKeyDown(event) {
  if (event.key !== 'Escape') return;
  if (showPreview.value) return;
  if (document.querySelector('.el-message-box')) return;
  const writeBox = document.querySelector('.write-box');
  if (writeBox && writeBox.offsetParent !== null) return;
  handleBack();
}

function openReply() {
  uiStore.writerRef.openReply(email.value)
}

function openForward() {
  uiStore.writerRef.openForward(email.value)
}

function toMessage(message) {
  return  message ? JSON.parse(message).message : '';
}

function formatImage(content) {
  content = content || '';
  const domain = settingStore.settings.r2Domain;
  return  content.replace(/{{domain}}/g, toOssDomain(domain) + '/');
}

function showImage(key) {
  if (!isImage(key)) return;
  const url = cvtR2Url(key)
  srcList.length = 0
  srcList.push(url)
  showPreview.value = true
}

function isImage(filename) {
  return ['png', 'jpg', 'jpeg', 'bmp', 'gif','jfif'].includes(getExtName(filename))
}

function formateReceive(recipient) {
  if (!recipient) return ''
  recipient = JSON.parse(recipient)
  return recipient.map(item => item.address).join(', ')
}

async function copyCode() {
  await navigator.clipboard.writeText(String(email.value.code))
  ElMessage({ message: t('copySuccessMsg'), type: 'success', plain: true })
}

function changeStar() {
  if (email.value.isStar) {
    email.value.isStar = 0;
    starCancel(email.value.emailId).then(() => {
      email.value.isStar = 0;
      emailStore.cancelStarEmailId = email.value.emailId
      setTimeout(() => emailStore.cancelStarEmailId = 0)
      emailStore.starScroll?.deleteEmail([email.value.emailId])
    }).catch((e) => {
      console.error(e)
      email.value.isStar = 1;
    })
  } else {
    email.value.isStar = 1;
    starAdd(email.value.emailId).then(() => {
      email.value.isStar = 1;
      emailStore.addStarEmailId = email.value.emailId
      setTimeout(() => emailStore.addStarEmailId = 0)
      emailStore.starScroll?.addItem(email.value)
    }).catch((e) => {
      console.error(e)
      email.value.isStar = 0;
    })
  }
}

const handleBack = () => {
  if (props.embedded) {
    emit('close')
    return
  }
  router.back()
}

const handleDelete = () => {
  ElMessageBox.confirm(t('delEmailConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    if (emailStore.contentData.delType === 'logic') {
      emailDelete(email.value.emailId).then(() => {
        ElMessage({
          message: t('delSuccessMsg'),
          type: 'success',
          plain: true,
        })
        emailStore.deleteIds = [email.value.emailId]
      })
    } else  {

      allEmailDelete(email.value.emailId).then(() => {
        ElMessage({
          message: t('delSuccessMsg'),
          type: 'success',
          plain: true,
        })
        emailStore.deleteIds = [email.value.emailId]
      })
    }

    if (props.embedded) emit('close')
    else router.back()
  })
}
</script>
<style scoped lang="scss">
.box {
  height: 100%;
  overflow: hidden;
}

.header-actions {
  min-height: 50px;
  padding: 6px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}
.action-group { display: flex; align-items: center; gap: 7px; }
.action-group-right { margin-left: auto; }
.detail-action { height: 36px; padding: 0 11px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; color: var(--text-2); border: 1px solid var(--border); border-radius: 9px; background: var(--surface); font-size: 12.5px; font-weight: 600; cursor: pointer; transition: color var(--dur) var(--ease), border-color var(--dur) var(--ease), background var(--dur) var(--ease); }
.detail-action:hover { color: var(--brand-700); border-color: color-mix(in srgb, var(--brand-500) 42%, var(--border)); background: var(--brand-soft); }
.detail-action.icon-only { width: 36px; padding: 0; }


.scrollbar {
  height: calc(100% - 50px);
  width: 100%;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  font-size: 14px;
  padding: 26px 30px 38px;
  @media (max-width: 1023px) {
    padding-left: 15px;
    padding-right: 15px;
  }

  .email-title {
    font-size: 21px;
    font-weight: 750;
    line-height: 1.35;
    letter-spacing: -.3px;
    margin-bottom: 18px;
  }

  .message-card {
    overflow: hidden;
    padding: 24px;
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    background: var(--surface);
    box-shadow: var(--sh-1);
  }

  .code-card {
    margin-bottom: 18px;
    padding: 14px 16px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 14px;
    border: 1px solid color-mix(in srgb, var(--success) 28%, var(--border));
    border-radius: var(--r-md);
    background: linear-gradient(135deg, color-mix(in srgb, var(--success) 10%, transparent), var(--brand-soft));
  }

  .delivery-trace {
    margin-top: 20px;
    padding: 14px 16px;
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    color: var(--text-2);
    background: linear-gradient(180deg, var(--surface-2), color-mix(in srgb, var(--surface-2) 84%, var(--brand-soft)));
  }
  .trace-heading { display: flex; align-items: center; gap: 7px; margin-bottom: 12px; color: var(--text); font-size: 13.5px; }
  .trace-item { display: flex; align-items: center; gap: 9px; min-height: 27px; font-size: 12.5px; }
  .trace-dot { width: 8px; height: 8px; flex: 0 0 8px; border-radius: 50%; }
  .trace-dot.success { background: var(--success); }
  .trace-dot.brand { background: var(--brand-500); }
  .code-insight { display: flex; align-items: center; gap: 10px; }
  .code-insight strong, .code-insight span { display: block; }
  .code-insight strong { color: var(--success); font-size: 12px; }
  .code-insight span { margin-top: 2px; color: var(--text-3); font-size: 11.5px; }
  .code-icon { width: 36px; height: 36px; display: grid; place-items: center; border-radius: var(--r-sm); color: var(--success); background: color-mix(in srgb, var(--success) 16%, transparent); }
  .code-value { padding: 7px 12px; border: 1px dashed var(--border-strong); border-radius: var(--r-sm); background: var(--surface); color: var(--text); font-size: 22px; font-weight: 800; letter-spacing: .18em; font-variant-numeric: tabular-nums; }
  .code-card .el-button { margin-left: auto; }

  .htm-scrollbar {
  }

  .content {
    display: flex;
    flex-direction: column;

    .att {
      margin-top: 24px;
      margin-bottom: 24px;
      border: 1px solid var(--light-border-color);
      padding: 16px;
      border-radius: var(--r-md);
      width: 100%;
      .att-box {
        min-width: 0;
        max-width: none;
        display: grid;
        gap: 12px;
        grid-template-rows: 1fr;
      }

      .att-title {
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
        span:first-child {
          font-weight: bold;
        }
      }

      .att-item {
        cursor: pointer;
        div {
          align-self: center;
        }
        background: var(--light-ill);
        padding: 10px 12px;
        border: 1px solid var(--border);
        border-radius: var(--r-sm);
        align-self: start;
        display: grid;
        grid-template-columns: auto 1fr auto auto;
        .att-icon {
          display: grid;
        }

        .att-size {
          color: var(--secondary-text-color);
        }

        .att-name {
          margin-left: 8px;
          margin-right: 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          word-break: break-all;
        }

        .att-image {
          width: 60px;
          height: 60px;
          object-fit: contain;
        }

        .opt-icon {
          padding-left: 10px;
          color: var(--secondary-text-color);
          align-items: center;
          display: flex;
          gap: 8px;
          cursor: pointer;
          a {
            color: var(--secondary-text-color);
            align-items: center;
            display: flex;
          }
        }
      }
    }

    .email-info {

      border-bottom: 1px solid var(--light-border-color);
      margin-bottom: 20px;
      padding-bottom: 8px;
      @media (max-width: 1024px) {
        margin-bottom: 15px;
      }

      .sender-summary { display: flex; align-items: center; gap: 12px; padding-bottom: 10px; }
      .sender-avatar { width: 40px; height: 40px; flex: 0 0 40px; display: grid; place-items: center; color: #fff; border-radius: 50%; font-size: 12px; font-weight: 750; letter-spacing: .02em; }
      .sender-copy { min-width: 0; flex: 1; }
      .sender-primary { min-width: 0; display: flex; flex-wrap: wrap; align-items: baseline; gap: 5px 8px; }
      .sender-primary strong { color: var(--text); font-size: 14.5px; }
      .sender-primary span { overflow: hidden; color: var(--text-3); font-size: 12.5px; text-overflow: ellipsis; white-space: nowrap; }
      .sender-secondary { margin-top: 3px; overflow: hidden; color: var(--text-3); font-size: 12.5px; text-overflow: ellipsis; white-space: nowrap; }
      .date {
        color: var(--regular-text-color);
        margin-bottom: 6px;
      }

      .email-msg {
        max-width: 400px;
        width: fit-content;
        margin-bottom: 15px;
      }

      .send {
        display: flex;
        margin-bottom: 6px;

        .send-name {
          color: var(--regular-text-color);
          display: flex;
          flex-wrap: wrap;
        }

        .send-name-title {
          padding-right: 5px;
        }
      }

      .receive {
        margin-bottom: 6px;
        display: flex;
        .receive-email {
          max-width: 700px;
          word-break: break-word;
        }
        span:nth-child(2) {
          color: var(--regular-text-color);
        }
      }

      .send-source {
        white-space: nowrap;
        font-weight: bold;
        padding-right: 10px;
      }

      .source {
        white-space: nowrap;
        font-weight: bold;
        padding-right: 10px;
      }
    }
  }
}

.shadow-html::after  {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--message-block-color); /* 半透明黑色蒙层 */
  pointer-events: none; /* 不影响点击 */
}

.email-text {
  font-family: inherit;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

.bottom-distance {
  margin-bottom: 30px;
}

@media (max-width: 767px) {
  .header-actions { padding: 6px 10px; }
  .detail-action { padding: 0 9px; }
  .container { padding: 16px 12px 28px; }
  .container .message-card { padding: 17px; border-radius: var(--r-md); }
  .container .email-title { font-size: 19px; }
  .container .code-card .el-button { width: 100%; margin-left: 0; }
  .container .content .email-info .sender-secondary { white-space: normal; }
}


</style>
