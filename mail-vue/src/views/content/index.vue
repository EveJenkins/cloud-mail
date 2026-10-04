<template>
  <div class="box">
    <div class="header-actions">
      <div class="action-group">
        <button v-if="!embedded" class="detail-action icon-only" :title="settingStore.lang === 'zh' ? '返回' : 'Back'" @click="handleBack"><Icon icon="material-symbols-light:arrow-back-ios-new" width="18" /></button>
        <button v-if="!isTrash" v-perm="'email:delete'" class="detail-action icon-only" :title="$t('delete')" @click="handleDelete"><Icon icon="uiw:delete" width="16" /></button>
        <button v-else v-perm="'email:delete'" class="detail-action" type="button" :disabled="restoring" @click="handleRestore"><Icon icon="solar:restart-linear" width="17" />{{ restoring ? (settingStore.lang === 'zh' ? '恢复中…' : 'Restoring…') : $t('restore') }}</button>
        <button class="detail-action icon-only" v-if="emailStore.contentData.showStar" :title="$t('star')" @click="changeStar">
          <Icon v-if="email.isStar" icon="fluent-color:star-16" width="19" />
          <Icon v-else icon="solar:star-line-duotone" width="18" />
        </button>
      </div>
      <div class="action-group action-group-right" v-perm="'email:send'">
        <button v-if="emailStore.contentData.showReply" class="detail-action" @click="openReply"><Icon icon="la:reply" width="18" />{{ Number(email.type) === 1 ? (settingStore.lang === 'zh' ? '跟进' : 'Follow up') : $t('reply') }}</button>
        <button v-if="emailStore.contentData.showReply" class="detail-action" @click="openForward"><Icon icon="iconoir:arrow-up-right" width="17" />{{ $t('forward') }}</button>
      </div>
    </div>
    <div></div>
    <el-scrollbar class="scrollbar">
      <div class="container">
      <div class="read-main">
        <div class="message-card">
        <div class="email-title">
          {{ email.subject }}
        </div>
        <div class="detail-badges">
          <span class="detail-badge category" v-if="emailCategory">{{ emailCategory }}</span>
          <span class="detail-badge">{{ senderScope }}</span>
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
                <div class="copy-secondary" v-if="formateReceive(email.cc)">{{ settingStore.lang === 'zh' ? '抄送' : 'Cc' }} {{ formateReceive(email.cc) }}</div>
                <div class="copy-secondary" v-if="Number(email.type) === 1 && formateReceive(email.bcc)">{{ settingStore.lang === 'zh' ? '密送' : 'Bcc' }} {{ formateReceive(email.bcc) }}</div>
              </div>
            </div>
            <el-alert v-if="email.status === 3" :closable="false" :title="toMessage(email.message)" class="email-msg" type="error" show-icon />
            <el-alert v-if="email.status === 8" :closable="false" :title="toMessage(email.message) || (settingStore.lang === 'zh' ? '发送失败' : 'Sending failed')" class="email-msg" type="error" show-icon />
            <el-alert v-if="email.status === 4" :closable="false" :title="$t('complained')" class="email-msg" type="warning" show-icon />
            <el-alert v-if="email.status === 5" :closable="false" :title="$t('delayed')" class="email-msg" type="warning" show-icon />
          </div>
          <div class="code-card" v-if="detectedCode">
            <div class="code-card-head">
              <div class="code-insight">
                <span class="code-icon"><Icon icon="solar:shield-check-linear" width="19" height="19" /></span>
                <div>
                  <strong>Workers AI {{ settingStore.lang === 'zh' ? '已识别验证码' : 'detected a verification code' }}</strong>
                  <span>{{ settingStore.lang === 'zh' ? '验证码已安全提取，可一键复制' : 'Ready to copy safely' }}</span>
                </div>
              </div>
              <span class="ai-badge">AI</span>
            </div>
            <div class="code-card-body">
              <span class="code-value">{{ detectedCode }}</span>
              <el-button type="primary" @click="copyCode"><Icon icon="solar:copy-linear" width="15" />{{ settingStore.lang === 'zh' ? '复制验证码' : 'Copy code' }}</el-button>
            </div>
          </div>
          <div class="body-block">
          <section class="translation-banner" v-if="translationSuggestion || translationSettingsOpen || translatedText" :aria-busy="translating">
            <span class="translation-banner-icon"><Icon icon="solar:translation-2-linear" width="19" /></span>
            <div class="translation-banner-copy">
              <strong v-if="translatedText && translationOpen">{{ settingStore.lang === 'zh' ? '已翻译此邮件' : 'Message translated' }}</strong>
              <strong v-else-if="translationSuggestion === 'en'">{{ settingStore.lang === 'zh' ? '此邮件似乎是用英语撰写的' : 'This message appears to be in English' }}</strong>
              <strong v-else-if="translationSuggestion === 'zh'">{{ settingStore.lang === 'zh' ? '此邮件似乎是用中文撰写的' : 'This message appears to be in Chinese' }}</strong>
              <strong v-else>{{ settingStore.lang === 'zh' ? '翻译邮件' : 'Translate message' }}</strong>
              <button class="translation-primary" type="button" :disabled="translating" @click="toggleTranslation">
                <Icon v-if="translating" icon="svg-spinners:ring-resize" width="14" />
                {{ translating ? (settingStore.lang === 'zh' ? '正在翻译…' : 'Translating…') : translatedText && translationOpen ? (settingStore.lang === 'zh' ? '显示原文' : 'Show original') : translatedText ? (settingStore.lang === 'zh' ? '显示译文' : 'Show translation') : (settingStore.lang === 'zh' ? `翻译成${translationLanguage === 'zh' ? '中文' : '英文'}` : `Translate to ${translationLanguage === 'zh' ? 'Chinese' : 'English'}`) }}
              </button>
            </div>
            <button class="translation-settings-button" type="button" :aria-label="settingStore.lang === 'zh' ? '翻译设置' : 'Translation settings'" :aria-expanded="translationSettingsOpen" @click="translationSettingsOpen = !translationSettingsOpen">
              <Icon icon="solar:settings-linear" width="19" />
            </button>
          </section>
          <div class="translation-settings" v-if="translationSettingsOpen">
            <label for="translation-language">{{ settingStore.lang === 'zh' ? '翻译为' : 'Translate to' }}</label>
            <select id="translation-language" v-model="translationLanguage" @change="resetTranslation">
              <option value="zh">简体中文</option>
              <option value="en">English</option>
            </select>
            <span>{{ settingStore.lang === 'zh' ? '原文可随时切换查看' : 'You can switch back to the original at any time' }}</span>
          </div>
          <button v-if="!translationSuggestion && !translationSettingsOpen && !translatedText && translationSource" class="translate-fab" type="button"
                  :title="settingStore.lang === 'zh' ? '翻译正文' : 'Translate message'"
                  :aria-label="settingStore.lang === 'zh' ? '翻译正文' : 'Translate message'"
                  @click="translationSettingsOpen = true">
            <Icon icon="solar:translation-2-linear" width="17" />
          </button>
          <div v-if="translationOpen && translatedText" class="translated-body" :lang="translationLanguage">
            <span>{{ settingStore.lang === 'zh' ? '译文' : 'Translation' }} · {{ translationLanguage === 'zh' ? '简体中文' : 'English' }}</span>
            <pre>{{ translatedText }}</pre>
          </div>
          <el-scrollbar v-else class="htm-scrollbar" :class="!email.attList?.length ? 'bottom-distance' : ''">
            <ShadowHtml class="shadow-html" :html="displayBody.html" :fallback-text="displayBody.text" comfortable v-if="displayBody.html" />
            <pre v-else-if="displayBody.text" class="email-text">{{ displayBody.text }}</pre>
            <div v-else class="empty-email-body">{{ settingStore.lang === 'zh' ? '该邮件没有可显示的正文内容' : 'This message has no displayable body content' }}</div>
          </el-scrollbar>
          </div>
        </div>
        </div>
        <section class="conversation-thread" v-if="relatedThreadMessages.length">
          <div class="conversation-heading">
            <div>
              <Icon icon="solar:chat-round-dots-linear" width="18" />
              <strong>{{ settingStore.lang === 'zh' ? '会话记录' : 'Conversation' }}</strong>
            </div>
            <span>{{ relatedThreadMessages.length }} {{ settingStore.lang === 'zh' ? '封关联邮件' : 'related messages' }}</span>
          </div>
          <article class="thread-message" v-for="item in relatedThreadMessages" :key="item.emailId" :class="{ sent: item.type === 1, failed: threadStatus(item).failed }">
            <header class="thread-message-head">
              <span class="thread-avatar" :class="{ sent: item.type === 1 }">{{ threadInitial(item) }}</span>
              <div class="thread-sender">
                <div><strong>{{ item.type === 1 ? (settingStore.lang === 'zh' ? '我的回复' : 'My reply') : (item.name || item.sendEmail) }}</strong><span>{{ threadAddress(item) }}</span></div>
                <small>{{ item.type === 1 ? (settingStore.lang === 'zh' ? '发送给客户' : 'Sent to customer') : (settingStore.lang === 'zh' ? '客户回复' : 'Customer reply') }} · {{ formatDetailDate(item.createTime) }}</small>
              </div>
              <div class="thread-actions">
                <span class="thread-direction" :class="threadStatus(item).className"><Icon :icon="threadStatus(item).icon" width="15" />{{ threadStatus(item).label }}</span>
                <button v-if="canRetryThreadMessage(item)" class="thread-retry" type="button" :disabled="isRetrying(item)" @click="retryThreadMessage(item)">
                  <Icon :icon="isRetrying(item) ? 'svg-spinners:ring-resize' : 'solar:refresh-linear'" width="14" />
                  {{ isRetrying(item) ? (settingStore.lang === 'zh' ? '重试中' : 'Retrying') : (settingStore.lang === 'zh' ? '重新发送' : 'Retry') }}
                </button>
              </div>
            </header>
            <div class="thread-subject" v-if="item.subject && item.subject !== email.subject">{{ item.subject }}</div>
            <ShadowHtml v-if="threadDisplayParts(item).primary.html" class="thread-body" :html="threadDisplayParts(item).primary.html" comfortable />
            <pre v-else class="thread-body thread-text">{{ threadDisplayParts(item).primary.text || (settingStore.lang === 'zh' ? '该邮件没有可显示的正文内容' : 'No displayable message body') }}</pre>
            <details class="quoted-content" v-if="threadDisplayParts(item).quoted.html || threadDisplayParts(item).quoted.text">
              <summary><Icon icon="solar:history-linear" width="15" />{{ settingStore.lang === 'zh' ? '展开引用内容' : 'Show quoted message' }}</summary>
              <ShadowHtml v-if="threadDisplayParts(item).quoted.html" class="thread-body quoted-body" :html="threadDisplayParts(item).quoted.html" comfortable />
              <pre v-else class="thread-body thread-text quoted-body">{{ threadDisplayParts(item).quoted.text }}</pre>
            </details>
          </article>
        </section>
        <section class="system-notice" v-if="detectedCode">
          <span class="notice-icon"><Icon icon="solar:shield-check-linear" width="18" /></span>
          <div><strong>{{ settingStore.lang === 'zh' ? '系统通知类邮件，无需回复' : 'System notification — no reply needed' }}</strong><p>{{ settingStore.lang === 'zh' ? 'Workers AI 已识别为验证码通知，因此不会生成回复草稿；验证码可直接复制使用。' : 'Workers AI recognized a verification-code notice, so no reply draft is generated.' }}</p></div>
        </section>
        <section class="quick-reply" v-else-if="emailStore.contentData.showReply" v-perm="'email:send'">
          <div class="quick-reply-heading">
            <div class="reply-title">
              <span class="reply-mark"><Icon icon="solar:chat-round-line-linear" width="17" height="17"/></span>
              <strong>{{ Number(email.type) === 1 ? (settingStore.lang === 'zh' ? '快速跟进' : 'Quick follow-up') : (settingStore.lang === 'zh' ? '快速回复' : 'Quick reply') }}</strong>
              <span class="reply-recipient">{{ Number(email.type) === 1 ? (settingStore.lang === 'zh' ? `跟进给 ${replyTargetLabel}` : `Follow up with ${replyTargetLabel}`) : (settingStore.lang === 'zh' ? `回复给 ${replyTargetLabel}` : `Reply to ${replyTargetLabel}`) }}</span>
            </div>
            <div class="ai-draft">
              <button class="ai-draft-btn" type="button" :class="{ active: aiPanelOpen }" @click="aiPanelOpen = !aiPanelOpen">
                <Icon icon="solar:magic-stick-3-linear" width="15"/>{{ settingStore.lang === 'zh' ? 'AI 起草' : 'AI draft' }}
                <Icon icon="mingcute:down-small-fill" width="15"/>
              </button>
              <div class="ai-panel" v-show="aiPanelOpen">
                <div class="ai-panel-row">
                  <span class="panel-label">{{ settingStore.lang === 'zh' ? '语气' : 'Tone' }}</span>
                  <div class="tone-options">
                    <button v-for="item in toneOptions" :key="item.value" type="button" :class="{ active: aiTone === item.value }" @click="aiTone = item.value">{{ item.label }}</button>
                  </div>
                </div>
                <div class="ai-panel-row">
                  <span class="panel-label">{{ settingStore.lang === 'zh' ? '语言' : 'Language' }}</span>
                  <select v-model="aiLanguage" class="ai-panel-select">
                    <option value="auto">{{ settingStore.lang === 'zh' ? '根据通讯录自动选择' : 'Auto from contact' }}</option>
                    <option v-for="language in replyLanguages" :key="language.value" :value="language.value">{{ language.label }}</option>
                  </select>
                </div>
                <p class="ai-panel-hint" :class="{ matched: replyAutoLanguage.contact }">
                  <Icon :icon="replyAutoLanguage.contact ? 'solar:map-point-wave-linear' : 'solar:info-circle-linear'" width="13" />
                  <span>{{ replyLanguageHint }}</span>
                </p>
                <button class="ai-generate" type="button" :disabled="aiGenerating" @click="generateAiReply(false)">
                  <Icon :icon="aiGenerating ? 'svg-spinners:ring-resize' : 'solar:stars-minimalistic-bold'" width="15" height="15"/>
                  {{ aiGenerating ? (settingStore.lang === 'zh' ? '正在起草…' : 'Drafting…') : (quickReply ? (settingStore.lang === 'zh' ? '重新起草' : 'Regenerate') : (settingStore.lang === 'zh' ? '生成草稿' : 'Generate draft')) }}
                </button>
              </div>
            </div>
          </div>
          <div class="ai-insight" v-if="aiCategory || aiSummary">
            <span v-if="aiCategory">{{ aiCategory }}</span>
            <p v-if="aiSummary">{{ aiSummary }}</p>
          </div>
          <div class="quick-reply-editor" :class="{ focused: quickReplyFocused }">
            <textarea
                v-model="quickReply"
                :placeholder="settingStore.lang === 'zh' ? '输入回复内容，或用右上角 AI 起草…' : 'Write your reply, or use AI draft…'"
                rows="3"
                @focus="quickReplyFocused = true"
                @blur="quickReplyFocused = false"
                @keydown.ctrl.enter.prevent="sendQuickReply"
                @keydown.meta.enter.prevent="sendQuickReply"
            ></textarea>
            <div class="quick-reply-footer">
              <button class="reply-tool" type="button" @click="openReplyWithDraft">
                <Icon icon="solar:pen-new-square-linear" width="17" height="17"/>
                <span>{{ settingStore.lang === 'zh' ? '在写信页打开' : 'Open in composer' }}</span>
              </button>
              <button v-if="quickReply" class="reply-tool" type="button" :disabled="aiGenerating" @click="generateAiReply(true)">
                <Icon icon="solar:refresh-linear" width="16" height="16"/>
                <span>{{ settingStore.lang === 'zh' ? '换一版' : 'Another version' }}</span>
              </button>
              <span class="reply-shortcut">Ctrl / ⌘ + Enter</span>
              <button class="quick-send" type="button" :disabled="quickSending || !quickReply.trim()" @click="sendQuickReply">
                <Icon icon="solar:plain-2-bold" width="16" height="16"/>
                <span>{{ quickSending ? (settingStore.lang === 'zh' ? '发送中…' : 'Sending…') : Number(email.type) === 1 ? (settingStore.lang === 'zh' ? '发送跟进' : 'Send follow-up') : (settingStore.lang === 'zh' ? '发送回复' : 'Send reply') }}</span>
              </button>
            </div>
          </div>
        </section>
      </div>
      <aside class="read-side">
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
              <span>{{ Number(email.type) === 1 ? (settingStore.lang === 'zh' ? '邮件已提交发送' : 'Message submitted for sending') : (settingStore.lang === 'zh' ? '邮件已由 Cloudflare Email Routing 接收' : 'Accepted by Cloudflare Email Routing') }}</span>
            </div>
            <div v-if="Number(email.type) === 1" class="delivery-summary">{{ deliveryHeadline }}</div>
            <div v-for="item in deliveryRecipients" :key="item.address" class="delivery-recipient">
              <span class="delivery-recipient-address">{{ item.address }}</span>
              <span :class="['delivery-recipient-state', item.status]">{{ deliveryStateLabel(item.status) }}</span>
              <small v-if="item.reason" :title="item.reason">{{ item.reason }}</small>
            </div>
            <div class="trace-item" v-if="detectedCode">
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
      </aside>
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
import {ElMessage, ElMessageBox, ElNotification} from 'element-plus'
import {emailAiCompose, emailAiReply, emailDelete, emailList, emailRead, emailRestore, emailSend, emailThread} from "@/request/email.js";
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
import {useUserStore} from "@/store/user.js";
import {useWriterStore} from "@/store/writer.js";
import {replyRecipients} from '@/utils/reply-target.js'
import {suggestedSourceLanguage} from '@/utils/translation-hint.js'

const props = defineProps({
  embedded: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['close', 'restored'])
const embedded = computed(() => props.embedded)

const uiStore = useUiStore();
const settingStore = useSettingStore();
const accountStore = useAccountStore();
const emailStore = useEmailStore();
const userStore = useUserStore();
const writerStore = useWriterStore();
const router = useRouter()
const email = computed(() => emailStore.contentData.email || {
  emailId: 0,
  attList: [],
  content: '',
  text: '',
  recipient: '[]',
})
const isTrash = computed(() => emailStore.contentData.delType === 'trash')
const restoring = ref(false)
const showPreview = ref(false)
const srcList = reactive([])
const quickReply = ref('')
const quickReplyFocused = ref(false)
const aiPanelOpen = ref(false)
const quickSending = ref(false)
const aiGenerating = ref(false)
const aiTone = ref('formal')
const aiLanguage = ref('auto')
const aiCategory = ref('')
const aiSummary = ref('')
const translationOpen = ref(false)
const translationSettingsOpen = ref(false)
const translationLanguage = ref(settingStore.lang === 'en' ? 'en' : 'zh')
const translating = ref(false)
const translatedText = ref('')
let translationRequestVersion = 0
const threadMessages = ref([])
const retryingMessageIds = ref([])
const toneOptions = computed(() => settingStore.lang === 'zh'
    ? [{value: 'formal', label: '正式'}, {value: 'brief', label: '简洁'}, {value: 'friendly', label: '友好'}]
    : [{value: 'formal', label: 'Formal'}, {value: 'brief', label: 'Brief'}, {value: 'friendly', label: 'Friendly'}])
const replyLanguages = [
  {value: 'en', label: 'English'}, {value: 'zh', label: '简体中文'}, {value: 'zh-TW', label: '繁體中文'},
  {value: 'de', label: 'Deutsch'}, {value: 'fr', label: 'Français'}, {value: 'es', label: 'Español'},
  {value: 'pt', label: 'Português'}, {value: 'it', label: 'Italiano'}, {value: 'nl', label: 'Nederlands'},
  {value: 'pl', label: 'Polski'}, {value: 'tr', label: 'Türkçe'}, {value: 'ru', label: 'Русский'},
  {value: 'ar', label: 'العربية'}, {value: 'hi', label: 'हिन्दी'}, {value: 'ja', label: '日本語'},
  {value: 'ko', label: '한국어'}, {value: 'th', label: 'ไทย'}, {value: 'vi', label: 'Tiếng Việt'},
  {value: 'id', label: 'Bahasa Indonesia'}, {value: 'ms', label: 'Bahasa Melayu'},
]
const replyCountryLanguageMap = {
  China: 'zh', 'Hong Kong': 'zh-TW', Taiwan: 'zh-TW', 'United States': 'en', Canada: 'en', Mexico: 'es',
  'United Kingdom': 'en', Germany: 'de', France: 'fr', Italy: 'it', Spain: 'es', Netherlands: 'nl',
  Poland: 'pl', Turkey: 'tr', Russia: 'ru', 'United Arab Emirates': 'ar', 'Saudi Arabia': 'ar', India: 'hi',
  Japan: 'ja', 'South Korea': 'ko', Singapore: 'en', Thailand: 'th', Vietnam: 'vi', Indonesia: 'id',
  Malaysia: 'ms', Philippines: 'en', Australia: 'en', 'New Zealand': 'en', Brazil: 'pt', Argentina: 'es', 'South Africa': 'en',
  中国: 'zh', 中国大陆: 'zh', 中国香港: 'zh-TW', 中国台湾: 'zh-TW', 美国: 'en', 加拿大: 'en', 墨西哥: 'es',
  英国: 'en', 德国: 'de', 法国: 'fr', 意大利: 'it', 西班牙: 'es', 荷兰: 'nl', 波兰: 'pl', 土耳其: 'tr',
  俄罗斯: 'ru', 阿联酋: 'ar', 沙特阿拉伯: 'ar', 印度: 'hi', 日本: 'ja', 韩国: 'ko', 新加坡: 'en',
  泰国: 'th', 越南: 'vi', 印度尼西亚: 'id', 马来西亚: 'ms', 菲律宾: 'en', 澳大利亚: 'en', 新西兰: 'en',
  巴西: 'pt', 阿根廷: 'es', 南非: 'en',
}
const conversationEmails = computed(() => {
  return replyRecipients(email.value).map(address => address.toLowerCase())
})
const replyAutoLanguage = computed(() => {
  const contacts = Array.isArray(writerStore.contacts) ? writerStore.contacts : []
  const contact = conversationEmails.value.map(address => contacts.find(item => String(item.email).toLowerCase() === address)).find(Boolean)
  const code = replyCountryLanguageMap[contact?.country] || 'en'
  const language = replyLanguages.find(item => item.value === code) || replyLanguages[0]
  return {contact, code, language}
})
const replyTargetLabel = computed(() => {
  const address = conversationEmails.value[0]
  if (!address) return ''
  const contacts = Array.isArray(writerStore.contacts) ? writerStore.contacts : []
  const contact = contacts.find(item => String(item.email || '').toLowerCase() === address)
  return contact?.name || address
})
const replyLanguageHint = computed(() => {
  const result = replyAutoLanguage.value
  if (!result.contact) return settingStore.lang === 'zh' ? '通讯录未找到该联系人，智能回复将使用 English' : 'Contact not found; smart reply will use English'
  return settingStore.lang === 'zh'
      ? `已根据 ${result.contact.name || result.contact.email}（${result.contact.country}）选择 ${result.language.label}`
      : `${result.language.label} selected from ${result.contact.name || result.contact.email} (${result.contact.country})`
})
const telegramEnabled = computed(() => settingStore.settings?.tgBotStatus === 0)
const detectedCode = computed(() => {
  const serverCode = String(email.value.code || '').trim()
  if (serverCode) return serverCode

  const source = `${email.value.subject || ''} ${email.value.text || ''} ${email.value.content || ''}`
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;|&#160;/gi, ' ')
      .replace(/\s+/g, ' ')

  if (!/(验证码|校验码|动态码|一次性密码|otp|verification\s*code|security\s*code|authentication\s*code)/i.test(source)) return ''

  const labelled = source.match(/(?:验证码|校验码|动态码|一次性密码|otp|verification\s*code|security\s*code|authentication\s*code)[^A-Z0-9]{0,20}([A-Z0-9]{4,8})/i)
  if (labelled?.[1] && /\d/.test(labelled[1])) return labelled[1]

  return source.match(/\b\d{4,8}\b/)?.[0] || ''
})
const emailCategory = computed(() => {
  const source = `${email.value.subject || ''} ${email.value.text || ''}`.toLowerCase()
  if (detectedCode.value) return settingStore.lang === 'zh' ? '系统' : 'System'
  if (Number(email.value.type) === 1 && /(报价|询价|quotation|quote|rfq)/i.test(source)) return settingStore.lang === 'zh' ? '已发送报价' : 'Sent quote'
  if (/(报价|询价|quotation|quote|rfq)/i.test(source)) return settingStore.lang === 'zh' ? '供应商报价' : 'Supplier quote'
  if (/(运单|物流|清关|提单|装箱单|快递|shipment|tracking|customs|dhl|fedex|ups)/i.test(source)) return settingStore.lang === 'zh' ? '物流单据' : 'Logistics'
  if (/(询盘|采购|需求|我(?:要|想要|需要)|有(?:现)?货(?:吗|么)?|有没有货|能否提供|是否有货|多少钱|价格|inquiry|enquiry|request for|\bneed\b|\bwant\b|looking for|do you have|can you supply|availability|in stock)/i.test(source)) return settingStore.lang === 'zh' ? '客户询盘' : 'Customer inquiry'
  if (/(已送达|送达通知|delivered|delivery notice)/i.test(source)) return settingStore.lang === 'zh' ? '发送通知' : 'Delivery notice'
  return ''
})
const senderScope = computed(() => {
  if (Number(email.value.type) === 1) return settingStore.lang === 'zh' ? '已发送邮件' : 'Sent message'
  const senderDomain = String(email.value.sendEmail || '').split('@')[1]?.toLowerCase()
  const accountDomain = String(accountStore.currentAccount?.email || userStore.user?.email || '').split('@')[1]?.toLowerCase()
  const internal = senderDomain && accountDomain && senderDomain === accountDomain
  if (settingStore.lang === 'zh') return internal ? '公司内部' : '外部来信'
  return internal ? 'Internal' : 'External'
})
const senderInitials = computed(() => {
  const value = String(email.value.name || email.value.sendEmail || 'M').replace(/@.*/, '').trim()
  return value.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'M'
})
const senderGradient = computed(() => {
  const value = String(email.value.name || email.value.sendEmail || '')
  const palettes = [
    'var(--avatar-1)', 'var(--avatar-2)', 'var(--avatar-3)',
    'var(--avatar-4)', 'var(--avatar-5)', 'var(--avatar-6)'
  ]
  const score = Array.from(value).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return palettes[score % palettes.length]
})
function messageDisplayBody(message) {
  const html = formatImage(String(message?.content || '').trim())
  const text = String(message?.text || '').trim()
  if (!html) return {html: '', text}
  try {
    const documentNode = new DOMParser().parseFromString(html, 'text/html')
    const hasDocumentStyles = Boolean(documentNode.querySelector('style, link[rel="stylesheet"]'))
    documentNode.querySelectorAll('script, title, meta').forEach(node => node.remove())
    const htmlText = String(documentNode.body?.textContent || '').replace(/\s+/g, ' ').trim()
    const hasVisualContent = Boolean(documentNode.body?.querySelector('img, svg, table, video, audio, canvas'))
    if (!htmlText && !hasVisualContent) return {html: '', text}
    const hasComplexLayout = hasDocumentStyles || hasVisualContent || Boolean(documentNode.body?.querySelector('[class], [id]'))
    if (!hasComplexLayout) {
      const plainBody = text || String(documentNode.body?.innerText || documentNode.body?.textContent || '').trim()
      return {html: '', text: plainBody}
    }
  } catch {
    if (!html.replace(/<[^>]+>/g, '').trim()) return {html: '', text}
  }
  return {html, text}
}
const displayBody = computed(() => messageDisplayBody(email.value))
const relatedThreadMessages = computed(() => threadMessages.value.filter(item => item.emailId !== email.value.emailId))

function threadDisplayParts(message) {
  const body = messageDisplayBody(message)
  const empty = {html: '', text: ''}
  if (body.html) {
    try {
      const documentNode = new DOMParser().parseFromString(body.html, 'text/html')
      const quoteContainer = documentNode.createElement('div')
      const quoteSelectors = [
        'blockquote', '.gmail_quote', '.yahoo_quoted', '.moz-cite-prefix',
        '.protonmail_quote', '[data-skiff-mail]', '[data-original-message]'
      ]
      const quoteNodes = [...documentNode.body.querySelectorAll(quoteSelectors.join(','))]
          .filter(node => !quoteNodesContainAncestor(node, quoteSelectors, documentNode.body))
      quoteNodes.forEach(node => {
        quoteContainer.append(node.cloneNode(true))
        node.remove()
      })
      const primaryHtml = String(documentNode.body.innerHTML || '').trim()
      const quotedHtml = String(quoteContainer.innerHTML || '').trim()
      if (quotedHtml) return {primary: {html: primaryHtml, text: ''}, quoted: {html: quotedHtml, text: ''}}
    } catch {
      // Fall through to the plain-text splitter when malformed email HTML cannot be parsed.
    }
  }

  const text = body.text || String(message?.text || '').trim()
  const quoteMatch = text.match(/\n(?=(?:On .+ wrote:|在.+写道[：:]|[-_]{2,}\s*(?:Original Message|原始邮件)\s*[-_]{2,}|From:\s*.+\n(?:Sent|Date):))/i)
  if (!quoteMatch || quoteMatch.index == null) return {primary: body, quoted: empty}
  return {
    primary: {html: '', text: text.slice(0, quoteMatch.index).trim()},
    quoted: {html: '', text: text.slice(quoteMatch.index).trim()},
  }
}

function quoteNodesContainAncestor(node, selectors, root) {
  let parent = node.parentElement
  while (parent && parent !== root) {
    if (selectors.some(selector => parent.matches?.(selector))) return true
    parent = parent.parentElement
  }
  return false
}

function threadStatus(item) {
  if (Number(item?.type) !== 1) {
    return {label: settingStore.lang === 'zh' ? '已接收' : 'Received', icon: 'solar:inbox-in-linear', className: 'received', failed: false}
  }
  const status = Number(item.status)
  if (status === 3) return {label: settingStore.lang === 'zh' ? '已退信' : 'Bounced', icon: 'solar:danger-triangle-linear', className: 'failed', failed: true}
  if (status === 8) return {label: settingStore.lang === 'zh' ? '发送失败' : 'Failed', icon: 'solar:danger-triangle-linear', className: 'failed', failed: true}
  if (status === 4) return {label: settingStore.lang === 'zh' ? '被投诉' : 'Complained', icon: 'solar:danger-triangle-linear', className: 'failed', failed: false}
  if (status === 5) return {label: settingStore.lang === 'zh' ? '发送延迟' : 'Delayed', icon: 'solar:clock-circle-linear', className: 'delayed', failed: false}
  if (status === 2) return {label: settingStore.lang === 'zh' ? '已送达' : 'Delivered', icon: 'solar:check-circle-linear', className: 'delivered', failed: false}
  return {label: settingStore.lang === 'zh' ? '待确认送达' : 'Delivery pending', icon: 'solar:plain-2-linear', className: 'sent', failed: false}
}

const deliveryData = computed(() => {
  try { return JSON.parse(email.value.message || '{}').delivery || null }
  catch { return null }
})
const deliveryRecipients = computed(() => {
  if (Number(email.value.type) !== 1 || !deliveryData.value) return []
  const addresses = [email.value.recipient, email.value.cc, email.value.bcc].flatMap(value => {
    try { return (typeof value === 'string' ? JSON.parse(value || '[]') : value || []).map(item => item.address || item.email || item) }
    catch { return [] }
  })
  return addresses.map(address => ({address, ...(deliveryData.value.recipients?.[address.toLowerCase()] || {status: 'pending'})}))
})
const deliveryHeadline = computed(() => {
  if (Number(email.value.status) === 2) return settingStore.lang === 'zh' ? '全部收件人已送达' : 'Delivered to all recipients'
  if (Number(email.value.status) === 3) return settingStore.lang === 'zh' ? '有收件人被退信' : 'One or more recipients bounced'
  if (Number(email.value.status) === 8) return settingStore.lang === 'zh' ? '发送失败' : 'Sending failed'
  if (Number(email.value.status) === 4) return settingStore.lang === 'zh' ? '收件人已将邮件标记为垃圾邮件' : 'A recipient reported this message as spam'
  if (Number(email.value.status) === 5) return settingStore.lang === 'zh' ? '投递延迟，服务商正在重试' : 'Delivery delayed; provider retrying'
  return settingStore.lang === 'zh' ? '服务商已接收，等待送达确认' : 'Accepted by provider; awaiting delivery confirmation'
})
function deliveryStateLabel(status) {
  const zh = {pending: '待确认', delivered: '已送达', delayed: '延迟中', bounced: '已退信', failed: '发送失败', complained: '已投诉'}
  const en = {pending: 'Pending', delivered: 'Delivered', delayed: 'Delayed', bounced: 'Bounced', failed: 'Failed', complained: 'Complained'}
  return (settingStore.lang === 'zh' ? zh : en)[status] || status
}

function canRetryThreadMessage(item) {
  return Number(item?.type) === 1 && [3, 8].includes(Number(item.status)) && !item.attList?.length
}

function isRetrying(item) {
  return retryingMessageIds.value.includes(item.emailId)
}

function sortThreadMessages(list) {
  return [...list].sort((a, b) => {
    const aTime = Date.parse(String(a.createTime || '').replace(' ', 'T')) || 0
    const bTime = Date.parse(String(b.createTime || '').replace(' ', 'T')) || 0
    return aTime - bTime || Number(a.emailId) - Number(b.emailId)
  })
}

function threadAddress(item) {
  if (item.type !== 1) return `<${item.sendEmail || ''}>`
  try {
    const recipients = Array.isArray(item.recipient) ? item.recipient : JSON.parse(item.recipient || '[]')
    return recipients.map(recipient => recipient.address || recipient.email || recipient).filter(Boolean).join(', ')
  } catch {
    return ''
  }
}

function threadInitial(item) {
  if (item.type === 1) return settingStore.lang === 'zh' ? '我' : 'ME'
  return String(item.name || item.sendEmail || 'M').replace(/@.*/, '').trim().charAt(0).toUpperCase() || 'M'
}

function messageThreadKeys(message) {
  return [...new Set([message?.messageId, message?.inReplyTo, message?.relation]
      .filter(Boolean)
      .flatMap(value => String(value).match(/<[^>]+>|[^\s,]+/g) || [])
      .map(value => value.trim())
      .filter(Boolean))]
}

function isRelatedSentMessage(item) {
  if (Number(item?.type) !== 1) return false
  const keys = messageThreadKeys(email.value)
  const relatedKeys = messageThreadKeys(item)
  return keys.some(key => relatedKeys.includes(key))
}

async function loadThreadFallback(emailId) {
  const data = await emailList(
      accountStore.currentAccountId,
      0,
      0,
      50,
      1,
      1
  )
  if (email.value?.emailId !== emailId) return
  const sent = (data?.list || []).filter(isRelatedSentMessage)
  threadMessages.value = sortThreadMessages([email.value, ...sent])
}

async function loadThread() {
  const emailId = email.value?.emailId
  if (isTrash.value) {
    threadMessages.value = []
    return
  }
  if (!emailId) {
    threadMessages.value = []
    return
  }
  try {
    const list = await emailThread(emailId)
    if (email.value?.emailId === emailId) threadMessages.value = Array.isArray(list) ? sortThreadMessages(list) : []
  } catch (error) {
    try {
      await loadThreadFallback(emailId)
    } catch (fallbackError) {
      console.error('Unable to load email thread', error, fallbackError)
      threadMessages.value = []
    }
  }
}

const { t } = useI18n()
watch(() => accountStore.currentAccountId, () => {
  handleBack()
})

watch(() => email.value?.emailId, () => {
  quickReply.value = ''
  quickReplyFocused.value = false
  aiCategory.value = ''
  aiSummary.value = ''
  aiTone.value = 'formal'
  aiLanguage.value = 'auto'
  translationOpen.value = false
  translationSettingsOpen.value = false
  translationLanguage.value = settingStore.lang === 'en' ? 'en' : 'zh'
  translatedText.value = ''
  translating.value = false
  translationRequestVersion++
  loadThread()
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
  loadThread()
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('mail-thread-updated', handleThreadUpdated)
})

onUnmounted(() => {
  emailStore.contentData.showUnread = false;
  readRequesting = false
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('mail-thread-updated', handleThreadUpdated)
})

function handleThreadUpdated(event) {
  if (Number(event.detail?.sourceEmailId) !== Number(email.value?.emailId)) return
  const sent = Array.isArray(event.detail?.emails) ? event.detail.emails : []
  const existingIds = new Set(threadMessages.value.map(item => item.emailId))
  threadMessages.value = sortThreadMessages([...threadMessages.value, ...sent.filter(item => !existingIds.has(item.emailId))])
  if (sent.length) emailStore.markListReplied(email.value.emailId)
}

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

function openReplyWithDraft() {
  if (quickReply.value.trim()) {
    uiStore.writerRef.openReplyWithContent(email.value, quickReply.value.trim())
  } else {
    openReply()
  }
}

async function generateAiReply(variant = false) {
  if (aiGenerating.value) return
  if (!replyRecipients(email.value).length) {
    ElMessage.warning(settingStore.lang === 'zh' ? '找不到邮件收件人，无法起草跟进邮件' : 'No recipient found for this message')
    return
  }
  aiGenerating.value = true
  try {
    const replyLanguage = aiLanguage.value === 'auto' ? replyAutoLanguage.value.code : aiLanguage.value
    const data = await emailAiReply(email.value.emailId, aiTone.value, replyLanguage, variant)
    quickReply.value = data?.draft || ''
    aiCategory.value = data?.category || ''
    aiSummary.value = data?.summary || ''
    if (!quickReply.value) throw new Error(settingStore.lang === 'zh' ? '未生成有效回复' : 'No reply was generated')
  } catch (error) {
	const errorMessage = error?.response?.data?.message || error?.message || ''
    ElNotification({
      title: settingStore.lang === 'zh' ? '智能起草暂不可用' : 'Smart drafting unavailable',
      type: 'warning',
	  message: errorMessage || (settingStore.lang === 'zh' ? '你仍可在下方直接输入并发送回复。' : 'You can still write and send a reply below.'),
      position: 'bottom-right',
    })
  } finally {
    aiGenerating.value = false
  }
}

function openForward() {
  uiStore.writerRef.openForward(email.value)
}

function getEmailSourceText() {
  const plain = String(email.value.text || '').trim()
  if (plain) return plain
  const html = String(email.value.content || '').trim()
  if (!html) return ''
  const documentNode = new DOMParser().parseFromString(html, 'text/html')
  return String(documentNode.body?.textContent || '').replace(/\n{3,}/g, '\n\n').trim()
}

const translationSource = computed(getEmailSourceText)
const translationSuggestion = computed(() => suggestedSourceLanguage(translationSource.value, settingStore.lang))

function resetTranslation() {
  translationRequestVersion++
  translating.value = false
  translationOpen.value = false
  translatedText.value = ''
}

function toggleTranslation() {
  if (translatedText.value) {
    translationOpen.value = !translationOpen.value
    return
  }
  translateEmail()
}

async function translateEmail() {
  if (translating.value) return
  const source = translationSource.value
  if (!source) {
    ElMessage({
      message: settingStore.lang === 'zh' ? '当前邮件没有可翻译的正文' : 'This message has no translatable content',
      type: 'warning',
      plain: true,
    })
    return
  }

  translating.value = true
  const requestVersion = ++translationRequestVersion
  const emailId = email.value.emailId
  const targetLanguage = translationLanguage.value
  try {
    const data = await emailAiCompose(source, 'translate', targetLanguage)
    if (requestVersion !== translationRequestVersion || email.value.emailId !== emailId) return
    const result = String(data?.text || '').trim()
    if (!result) throw new Error(settingStore.lang === 'zh' ? '未生成有效译文' : 'No translation was returned')
    translatedText.value = result
    translationOpen.value = true
  } catch (error) {
    if (requestVersion !== translationRequestVersion || email.value.emailId !== emailId) return
    ElMessage({
      message: error?.response?.data?.message || error?.message || (settingStore.lang === 'zh' ? '翻译暂不可用' : 'Translation is unavailable'),
      type: 'warning',
      plain: true,
    })
  } finally {
    if (requestVersion === translationRequestVersion) translating.value = false
  }
}

function escapeHtml(value) {
  return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;')
}

function currentSenderAccount() {
  return accountStore.currentAccount?.email
      ? accountStore.currentAccount
      : userStore.user.account
}

function replyPayload({text, html, subject, receiveEmail}) {
  const currentAccount = currentSenderAccount()
  return {
    sendEmail: currentAccount.email || userStore.user.email,
    receiveEmail,
    accountId: currentAccount.accountId,
    name: currentAccount.name || userStore.user.name,
    subject,
    content: html,
    text,
    sendType: 'reply',
    emailId: email.value.emailId,
    attachments: [],
  }
}

async function retryThreadMessage(item) {
  if (!canRetryThreadMessage(item) || isRetrying(item)) return
  retryingMessageIds.value = [...retryingMessageIds.value, item.emailId]
  try {
    const recipients = threadAddress(item).split(/[,;]\s*/).filter(Boolean)
    const sentEmails = await emailSend(replyPayload({
      text: String(item.text || '').trim(),
      html: String(item.content || '').trim(),
      subject: item.subject || `Re: ${email.value.subject || ''}`,
      receiveEmail: recipients.length ? recipients : [email.value.sendEmail],
    }), () => {})
    const failedIndex = threadMessages.value.findIndex(message => message.emailId === item.emailId)
    const next = [...threadMessages.value]
    if (failedIndex >= 0) next.splice(failedIndex, 1)
    threadMessages.value = sortThreadMessages([...next, ...sentEmails])
    sentEmails.forEach(message => emailStore.sendScroll?.addItem(message))
    emailStore.markListReplied(email.value.emailId)
    ElNotification({
      title: settingStore.lang === 'zh' ? '回复已重新发送' : 'Reply sent again',
      type: 'success',
      message: item.subject,
      position: 'bottom-right',
    })
  } catch (error) {
    item.status = 8
    item.message = JSON.stringify({message: error?.message || ''})
    ElNotification({
      title: settingStore.lang === 'zh' ? '重新发送失败' : 'Retry failed',
      type: 'error',
      message: error?.message || (settingStore.lang === 'zh' ? '请稍后再试' : 'Please try again later'),
      position: 'bottom-right',
    })
  } finally {
    retryingMessageIds.value = retryingMessageIds.value.filter(id => id !== item.emailId)
  }
}

async function sendQuickReply() {
  const replyText = quickReply.value.trim()
  if (!replyText) {
    ElMessage({
      message: settingStore.lang === 'zh' ? '请输入回复内容' : 'Please enter a reply',
      type: 'warning',
      plain: true,
    })
    return
  }
  if (quickSending.value) return

  const recipients = replyRecipients(email.value)
  if (!recipients.length) {
    ElMessage.warning(settingStore.lang === 'zh' ? '找不到邮件收件人，无法发送回复' : 'No recipient found for this message')
    return
  }

  const subject = email.value.subject || ''
  const replySubject = /^(Re:|Re：|回复：|回复:)/i.test(subject) ? subject : `Re: ${subject}`
  const html = `<div>${escapeHtml(replyText).replaceAll('\n', '<br>')}</div>`
  const payload = replyPayload({text: replyText, html, subject: replySubject, receiveEmail: recipients})

  quickSending.value = true
  try {
    const sentEmails = await emailSend(payload, () => {})
    sentEmails.forEach(item => emailStore.sendScroll?.addItem(item))
    handleThreadUpdated({detail: {sourceEmailId: email.value.emailId, emails: sentEmails}})
    userStore.refreshUserInfo()
    quickReply.value = ''
    ElNotification({
      title: settingStore.lang === 'zh' ? '回复已发送' : 'Reply sent',
      type: 'success',
      message: replySubject,
      position: 'bottom-right',
    })
  } catch (error) {
    threadMessages.value = sortThreadMessages([...threadMessages.value, {
      emailId: -Date.now(),
      accountId: payload.accountId,
      sendEmail: payload.sendEmail,
      name: payload.name,
      subject: payload.subject,
      content: payload.content,
      text: payload.text,
      recipient: JSON.stringify(payload.receiveEmail.map(address => ({address, name: ''}))),
      type: 1,
      status: 8,
      createTime: new Date().toISOString(),
      attList: [],
      message: JSON.stringify({message: error?.message || ''}),
    }])
    ElNotification({
      title: settingStore.lang === 'zh' ? '回复发送失败' : 'Reply failed',
      type: error.code === 403 ? 'warning' : 'error',
      message: error.message,
      position: 'bottom-right',
    })
    if (error.code === 401) {
      localStorage.removeItem('token')
      router.replace('/login')
    }
  } finally {
    quickSending.value = false
  }
}

function toMessage(message) {
  if (!message) return ''
  try { return JSON.parse(message).message || '' } catch { return String(message) }
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
  try {
    const addresses = typeof recipient === 'string' ? JSON.parse(recipient) : recipient
    return Array.isArray(addresses) ? addresses.map(item => item.address || item.email || item).filter(Boolean).join(', ') : ''
  } catch {
    return ''
  }
}

async function copyCode() {
  await navigator.clipboard.writeText(detectedCode.value)
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
  ElMessageBox.confirm(t(emailStore.contentData.delType === 'logic' ? 'delEmailConfirm' : 'delOneEmailConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(async () => {
    if (emailStore.contentData.delType === 'logic') {
      await emailDelete(email.value.emailId)
      ElMessage({
        message: t('mailMovedToTrash'),
        type: 'success',
        plain: true,
      })
      emailStore.deleteIds = [email.value.emailId]
    } else  {
      await allEmailDelete(email.value.emailId)
      ElMessage({
        message: t('delSuccessMsg'),
        type: 'success',
        plain: true,
      })
      emailStore.deleteIds = [email.value.emailId]
    }

    if (props.embedded) emit('close')
    else router.back()
  }).catch(() => {})
}

async function handleRestore() {
  if (!isTrash.value || !email.value?.emailId || restoring.value) return
  restoring.value = true
  const emailId = email.value.emailId
  try {
    await emailRestore([emailId], accountStore.currentAccountId)
    ElMessage({ message: t('restoreSuccessMsg'), type: 'success', plain: true })
    emailStore.deleteIds = [emailId]
    emit('restored', emailId)
    if (props.embedded) emit('close')
    else router.back()
  } finally {
    restoring.value = false
  }
}
</script>
<style scoped lang="scss">
.box {
  height: 100%;
  overflow: hidden;
}

.header-actions {
  min-height: 44px;
  padding: 5px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}
.action-group { display: flex; align-items: center; gap: 6px; }
.action-group-right { margin-left: auto; }
.detail-action { height: 32px; padding: 0 10px; display: inline-flex; align-items: center; justify-content: center; gap: 5px; color: var(--text-2); border: 1px solid var(--border); border-radius: var(--r-md); background: var(--surface); font-size: 12.5px; font-weight: 500; cursor: pointer; transition: color var(--dur) var(--ease), border-color var(--dur) var(--ease), background var(--dur) var(--ease); }
.detail-action:hover { color: var(--brand-600); border-color: color-mix(in srgb, var(--brand-500) 42%, var(--border)); background: var(--brand-soft); }
.detail-action.icon-only { width: 32px; padding: 0; }


.scrollbar {
  height: calc(100% - 44px);
  width: 100%;
}

.container {
  width: 100%;
  max-width: var(--page-max);
  margin: 0 auto;
  font-size: var(--font-base);
  padding: 16px 24px 32px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  align-items: start;
  gap: 16px;
  @media (max-width: 1023px) {
    padding-left: 15px;
    padding-right: 15px;
  }

  .email-title {
    font-size: var(--font-read-title);
    font-weight: 750;
    line-height: 1.35;
    letter-spacing: -.3px;
    margin-bottom: 18px;
  }

  .message-card {
    overflow: hidden;
    padding: 18px;
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    background: var(--surface);
    box-shadow: var(--sh-1);
  }

  .quick-reply {
    margin-top: 12px;
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    background: var(--surface);
    box-shadow: var(--sh-1);
  }

  .quick-reply-heading {
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .quick-reply-heading > div { display: flex; align-items: center; gap: 9px; color: var(--text); }
  .quick-reply-heading strong { font-size: var(--font-card-title); font-weight: 600; }
  .reply-title { min-width: 0; display: flex; align-items: center; gap: 8px; }
  .reply-mark { width: 26px; height: 26px; flex: 0 0 26px; display: grid; place-items: center; color: var(--brand-600); background: var(--brand-soft); border-radius: var(--r-md); }
  .reply-recipient { min-width: 0; overflow: hidden; color: var(--text-mail-meta); font-size: 12.5px; text-overflow: ellipsis; white-space: nowrap; }

  /* AI 起草：参数收进弹出面板 */
  .ai-draft { position: relative; flex: none; }
  .ai-draft-btn {
    height: 30px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 0 9px;
    color: var(--text-2);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    font-size: 12px;
    cursor: pointer;
    transition: color var(--dur) var(--ease), background var(--dur) var(--ease), border-color var(--dur) var(--ease);
  }
  .ai-draft-btn:hover { color: var(--brand-600); border-color: color-mix(in srgb, var(--brand-500) 40%, var(--border)); }
  .ai-draft-btn.active { color: var(--brand-600); background: var(--brand-soft); border-color: color-mix(in srgb, var(--brand-500) 44%, var(--border)); }
  .ai-panel {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 3;
    width: 300px;
    padding: 12px;
    display: grid;
    gap: 10px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    box-shadow: var(--sh-3);
  }
  .ai-panel-row { display: flex; align-items: center; gap: 8px; }
  .panel-label { flex: none; width: 30px; color: var(--text-3); font-size: 11.5px; }
  .ai-panel-select { flex: 1; min-width: 0; height: 28px; padding: 0 8px; color: var(--text-2); background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-md); outline: 0; font: inherit; font-size: 11.5px; }
  .ai-panel-hint { margin: 0; display: flex; align-items: flex-start; gap: 5px; color: var(--text-3); font-size: 10.5px; line-height: 1.45; }
  .ai-panel-hint.matched { color: var(--brand-600); }
  .ai-panel-hint svg { flex: 0 0 auto; margin-top: 1px; }
  .tone-options { display: flex; align-items: center; gap: 5px; }
  .tone-options button, .ai-generate { border: 0; font: inherit; cursor: pointer; }
  .tone-options button { height: 26px; padding: 0 9px; color: var(--text-2); background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-md); font-size: 11.5px; }
  .tone-options button.active { color: var(--brand-600); background: var(--brand-soft); border-color: color-mix(in srgb, var(--brand-500) 44%, var(--border)); }
  .ai-generate { height: 32px; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 0 11px; color: #fff; background: var(--brand-600); border-radius: var(--r-md); font-size: 12px; font-weight: 500; }
  .ai-generate:hover:not(:disabled) { background: var(--brand-hover); }
  .ai-generate:disabled { cursor: wait; opacity: .65; }
  .ai-insight { display: flex; align-items: center; gap: 8px; margin: 0 0 8px; color: var(--text-2); }
  .ai-insight span { flex: 0 0 auto; padding: 2px 6px; color: var(--brand-600); background: var(--brand-soft); border-radius: var(--r-sm); font-size: 10.5px; font-weight: 500; }
  .ai-insight p { margin: 0; overflow: hidden; font-size: 11.5px; text-overflow: ellipsis; white-space: nowrap; }

  .quick-reply-editor {
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    background: var(--surface);
    transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease);
  }
  .quick-reply-editor.focused {
    border-color: var(--brand-500);
    box-shadow: 0 0 0 3px var(--brand-soft);
  }
  .quick-reply-editor textarea {
    width: 100%;
    min-height: 84px;
    display: block;
    resize: vertical;
    padding: 13px 14px 8px;
    border: 0;
    outline: 0;
    color: var(--text);
    background: transparent;
    font: inherit;
    font-size: var(--font-read-body);
    line-height: 1.75;
  }
  .quick-reply-editor textarea::placeholder { color: var(--text-3); }
  .quick-reply-footer {
    min-height: 48px;
    padding: 7px 9px 8px 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-top: 1px solid var(--border);
  }
  .reply-tool,
  .quick-send {
    border: 0;
    font: inherit;
    cursor: pointer;
  }
  .reply-tool {
    height: 32px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 9px;
    color: var(--text-2);
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 12px;
  }
  .reply-tool:hover { color: var(--brand-700); background: var(--brand-soft); }
  .reply-shortcut { margin-left: auto; color: var(--text-3); font-size: 10.5px; }
  .quick-send {
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 0 12px;
    color: #fff;
    background: var(--brand-600);
    border-radius: var(--r-md);
    font-size: 12.5px;
    font-weight: 500;
  }
  .quick-send:hover:not(:disabled) { background: var(--brand-hover); }
  .quick-send:disabled { cursor: not-allowed; opacity: .48; box-shadow: none; }

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
  .trace-heading { display: flex; align-items: center; gap: 7px; margin-bottom: 12px; color: var(--text); font-size: var(--font-card-title); }
  .trace-item { display: flex; align-items: center; gap: 9px; min-height: 30px; font-size: var(--font-read-meta); }
  .delivery-summary { margin: 8px 0; color: var(--text-2); font-size: var(--font-read-meta); font-weight: 650; }
  .delivery-recipient { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; padding: 7px 0; border-top: 1px solid var(--border); font-size: var(--font-read-meta); }
  .delivery-recipient-address { min-width: 0; flex: 1; overflow-wrap: anywhere; }
  .delivery-recipient-state { color: var(--text-3); white-space: nowrap; }
  .delivery-recipient-state.delivered { color: var(--success); }
  .delivery-recipient-state.bounced, .delivery-recipient-state.failed { color: var(--danger); }
  .delivery-recipient-state.delayed { color: var(--warning); }
  .delivery-recipient small { width: 100%; color: var(--text-3); overflow-wrap: anywhere; }
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


    .email-info {

      border-bottom: 1px solid var(--light-border-color);
      margin-bottom: 20px;
      padding-bottom: 8px;
      @media (max-width: 1024px) {
        margin-bottom: 15px;
      }

      .sender-summary { display: flex; align-items: center; gap: 12px; padding-bottom: 10px; }
      .sender-avatar { width: 36px; height: 36px; flex: 0 0 36px; display: grid; place-items: center; color: #fff; border-radius: 50%; font-size: 12px; font-weight: 600; letter-spacing: .02em; }
      .sender-copy { min-width: 0; flex: 1; }
      .sender-primary { min-width: 0; display: flex; flex-wrap: wrap; align-items: baseline; gap: 5px 8px; }
      .sender-primary strong { color: var(--text); font-size: var(--font-read-meta); }
      .sender-primary span { overflow: hidden; color: var(--text-mail-meta); font-size: var(--font-read-meta); text-overflow: ellipsis; white-space: nowrap; }
      .sender-secondary { margin-top: 4px; overflow: hidden; color: var(--text-mail-meta); font-size: var(--font-read-meta); line-height: 1.45; text-overflow: ellipsis; white-space: nowrap; }
      .copy-secondary { margin-top: 4px; color: var(--text-mail-meta); font-size: var(--font-read-meta); line-height: 1.45; overflow-wrap: anywhere; }
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

  .att {
    margin: 0;
    border: 1px solid var(--border);
    padding: 12px;
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

/* Structured inbox detail cards from the enterprise redesign. */
.container .message-card {
  overflow: visible;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
.container .email-title { margin-bottom: 8px; }
.detail-badges { margin-bottom: 14px; display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
.detail-badge { min-height: 24px; padding: 3px 9px; display: inline-flex; align-items: center; color: var(--text-3); background: var(--surface-3); border-radius: var(--r-sm); font-size: 14px; font-weight: 600; }
.detail-badge.category { color: var(--success); background: color-mix(in srgb, var(--success) 11%, var(--surface)); }
.container .content .email-info { margin-bottom: 14px; padding: 0; border: 0; }
.container .content .email-info .sender-summary { padding: 0; }
.container .code-card { margin: 0 0 16px; padding: 15px 16px; display: block; }
.code-card-head, .code-card-body { display: flex; align-items: center; gap: 12px; }
.code-card-head { justify-content: space-between; }
.code-card-body { margin-top: 10px; flex-wrap: wrap; }
.code-card-body .el-button { margin-left: 0; }
.ai-badge { padding: 3px 7px; color: var(--success); background: var(--surface); border-radius: 6px; font-size: 10.5px; font-weight: 750; }
.body-block { position: relative; }
.translate-fab {
  position: absolute;
  top: 12px;
  right: 14px;
  z-index: 2;
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  cursor: pointer;
  transition: color var(--dur) var(--ease), background var(--dur) var(--ease), border-color var(--dur) var(--ease);
}
.translate-fab:hover { color: var(--brand-600); background: var(--brand-soft); border-color: color-mix(in srgb, var(--brand-500) 40%, var(--border)); }
.translation-banner { margin-bottom: 12px; padding: 13px 14px; display: flex; align-items: flex-start; gap: 12px; border: 1px solid var(--border); border-radius: var(--r-lg); background: var(--surface-2); }
.translation-banner-icon { width: 30px; height: 30px; flex: none; display: grid; place-items: center; color: var(--brand-600); background: var(--brand-soft); border-radius: var(--r-md); }
.translation-banner-copy { min-width: 0; flex: 1; display: flex; flex-direction: column; align-items: flex-start; gap: 5px; }
.translation-banner-copy strong { color: var(--text); font-size: 14px; font-weight: 600; line-height: 1.45; }
.translation-primary { padding: 0; color: var(--brand-600); border: 0; background: transparent; font: inherit; font-size: 14px; font-weight: 650; cursor: pointer; }
.translation-primary:disabled { opacity: .6; cursor: wait; }
.translation-primary svg { vertical-align: -2px; }
.translation-settings-button { width: 30px; height: 30px; flex: none; display: grid; place-items: center; color: var(--text-3); border: 0; border-radius: var(--r-md); background: transparent; cursor: pointer; }
.translation-settings-button:hover { color: var(--text); background: var(--surface-3); }
.translation-settings { margin: -4px 0 12px; padding: 10px 14px; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; color: var(--text-3); border: 1px solid var(--border); border-radius: var(--r-md); background: var(--surface); font-size: 12px; }
.translation-settings select { height: 30px; min-width: 118px; padding: 0 9px; color: var(--text); border: 1px solid var(--border); border-radius: var(--r-md); background: var(--surface); font: inherit; }
.translation-settings > span { margin-left: auto; }
.translated-body { min-height: 120px; padding: 16px; border: 1px solid var(--border); border-radius: var(--r-lg); background: var(--surface); box-shadow: var(--sh-1); }
.translated-body > span { color: var(--brand-600); font-size: 11px; font-weight: 650; }
.translated-body pre { margin: 10px 0 0; color: var(--text); font-family: inherit; font-size: var(--font-read-body); line-height: 1.8; white-space: pre-wrap; overflow-wrap: anywhere; }
.container .htm-scrollbar { min-height: 120px; padding: 16px; border: 1px solid var(--border); border-radius: var(--r-lg); background: var(--surface); box-shadow: var(--sh-1); }
.container .htm-scrollbar .email-text { padding: 0; color: var(--text); font-size: var(--font-read-body); line-height: 1.8; background: transparent; }
.empty-email-body { min-height: 76px; display: grid; place-items: center; color: var(--text-3); font-size: 12px; }
.container .bottom-distance { margin-bottom: 0; }
.container .att { margin: 0; background: var(--surface); box-shadow: var(--sh-1); }
.container .delivery-trace { margin: 0; background: var(--surface); box-shadow: var(--sh-1); }

/* 读信页两栏：左正文 + 右信息栏 */
.read-main { min-width: 0; display: grid; gap: 12px; align-content: start; }
.read-side { min-width: 0; display: grid; gap: 12px; align-content: start; position: sticky; top: 0; }
/* 窗口宽 - 侧栏224 - 列表360 后正文不足 ~560px 时收成单栏 */
@media (max-width: 1519px) {
  .container { grid-template-columns: minmax(0, 1fr); }
  .read-side { position: static; }
}
.conversation-thread { margin-top: 16px; display: grid; gap: 10px; }
.conversation-heading { min-height: 38px; padding: 0 4px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.conversation-heading > div { display: flex; align-items: center; gap: 7px; color: var(--text); }
.conversation-heading strong { font-size: 13.5px; }
.conversation-heading > span { color: var(--text-3); font-size: 12px; }
.thread-message { overflow: hidden; padding: 12px; border: 1px solid var(--border); border-radius: var(--r-lg); background: var(--surface); box-shadow: var(--sh-1); }
.thread-message.sent { border-color: color-mix(in srgb, var(--brand-500) 25%, var(--border)); background: color-mix(in srgb, var(--brand-soft) 30%, var(--surface)); }
.thread-message.failed { border-color: color-mix(in srgb, var(--danger) 38%, var(--border)); }
.thread-message-head { display: flex; align-items: center; gap: 10px; }
.thread-avatar { width: 30px; height: 30px; flex: 0 0 30px; display: grid; place-items: center; color: #fff; border-radius: 50%; background: var(--avatar-2); font-size: 11px; font-weight: 600; }
.thread-avatar.sent { background: var(--brand-600); }
.thread-sender { min-width: 0; flex: 1; }
.thread-sender > div { min-width: 0; display: flex; align-items: baseline; flex-wrap: wrap; gap: 5px 8px; }
.thread-sender strong { color: var(--text); font-size: var(--font-read-meta); }
.thread-sender span, .thread-sender small { color: var(--text-3); font-size: 12px; }
.thread-sender span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.thread-sender small { display: block; margin-top: 2px; }
.thread-actions { flex: 0 0 auto; display: flex; align-items: center; gap: 6px; }
.thread-direction { flex: 0 0 auto; padding: 5px 8px; display: inline-flex; align-items: center; gap: 4px; color: var(--brand-700); border-radius: 7px; background: var(--brand-soft); font-size: 10.5px; font-weight: 700; }
.thread-direction.failed { color: var(--danger); background: color-mix(in srgb, var(--danger) 10%, var(--surface)); }
.thread-direction.delayed { color: var(--warning); background: color-mix(in srgb, var(--warning) 11%, var(--surface)); }
.thread-direction.delivered { color: var(--success); background: color-mix(in srgb, var(--success) 11%, var(--surface)); }
.thread-retry { height: 27px; padding: 0 8px; display: inline-flex; align-items: center; gap: 4px; color: var(--danger); border: 1px solid color-mix(in srgb, var(--danger) 30%, var(--border)); border-radius: 7px; background: var(--surface); font: inherit; font-size: 10.5px; font-weight: 700; cursor: pointer; }
.thread-retry:disabled { cursor: wait; opacity: .6; }
.thread-subject { margin: 13px 0 0; padding-top: 12px; color: var(--text-2); border-top: 1px solid var(--border); font-size: 12px; font-weight: 700; }
.thread-body { margin-top: 13px; padding: 14px 15px; color: var(--text); border: 1px solid var(--border); border-radius: var(--r-md); background: var(--surface); font-size: var(--font-read-body); line-height: 1.8; }
.thread-text { font-family: inherit; white-space: pre-wrap; word-break: break-word; }
.quoted-content { margin-top: 10px; border-top: 1px solid var(--border); }
.quoted-content summary { width: max-content; margin-top: 10px; padding: 5px 7px; display: flex; align-items: center; gap: 5px; color: var(--text-3); border-radius: 7px; font-size: 11px; font-weight: 600; cursor: pointer; list-style: none; }
.quoted-content summary::-webkit-details-marker { display: none; }
.quoted-content summary:hover { color: var(--brand-700); background: var(--brand-soft); }
.quoted-body { margin-top: 7px; opacity: .78; }
.system-notice { margin-top: 16px; padding: 15px 16px; display: flex; align-items: flex-start; gap: 11px; color: var(--text); border: 1px solid var(--border); border-radius: var(--r-lg); background: var(--surface-2); }
.notice-icon { width: 34px; height: 34px; flex: 0 0 34px; display: grid; place-items: center; color: var(--text-3); background: var(--surface-3); border-radius: var(--r-md); }
.system-notice strong { font-size: 13px; }
.system-notice p { margin: 4px 0 0; color: var(--text-3); font-size: 11.5px; line-height: 1.6; }

@media (max-width: 767px) {
  .header-actions { padding: 6px 10px; }
  .detail-action { padding: 0 9px; }
  .container { padding: 16px 12px 28px; }
  .container .message-card { padding: 0; border: 0; border-radius: 0; background: transparent; box-shadow: none; }
  .container .email-title { font-size: var(--font-read-title); }
  .container .translation-banner-copy strong,
  .container .translation-primary { font-size: 14px; }
  .container .code-card .el-button { width: 100%; margin-left: 0; }
  .container .translation-banner { padding: 12px; }
  .container .translation-settings > span { width: 100%; margin-left: 0; }
  .container .content .email-info .sender-secondary { white-space: normal; }
  .thread-message { padding: 12px; }
  .thread-direction { font-size: 0; }
  .container .quick-reply { padding: 10px; border-radius: var(--r-md); }
  .container .quick-reply-heading > span,
  .container .reply-shortcut { display: none; }
  .container .reply-recipient { display: none; }
  .container .ai-panel { width: calc(100vw - 44px); }
  .container .reply-tool span { display: none; }
  .container .quick-reply-footer { gap: 7px; }
  .container .quick-send { margin-left: auto; }
}


</style>
