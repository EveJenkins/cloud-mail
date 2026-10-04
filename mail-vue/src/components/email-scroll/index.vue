<template>
  <div class="email-container" :class="{ 'has-summary': props.showInboxSummary }">
    <div class="inbox-panel-head" v-if="props.showInboxSummary">
      <label class="inbox-search">
        <Icon icon="solar:magnifer-linear" width="16" height="16" />
        <input v-model.trim="searchKeyword" :placeholder="settingStore.lang === 'zh' ? '搜索…' : 'Search…'" :aria-label="settingStore.lang === 'zh' ? '搜索邮件' : 'Search messages'" />
        <button v-if="searchKeyword" type="button" class="search-clear" :title="settingStore.lang === 'zh' ? '清除搜索' : 'Clear search'" @click.prevent="resetSearchOnly">
          <Icon icon="solar:close-circle-linear" width="16" height="16" />
        </button>
      </label>
      <div class="summary-status">
        <span v-if="total">{{ settingStore.lang === 'zh' ? `${total} 封` : `${total} messages` }}</span>
        <span class="sync-status" :class="{ failed: loadError }" role="status"><i></i>{{ lastSyncedLabel }}</span>
        <button type="button" class="summary-refresh" :disabled="loading" :title="settingStore.lang === 'zh' ? '同步邮件' : 'Sync messages'" @click="refresh">
          <Icon icon="solar:refresh-linear" width="16" height="16" :class="{ spinning: loading }" />
        </button>
      </div>
    </div>
    <div class="header-actions" v-if="!props.showInboxSummary">
      <el-checkbox
          v-model="checkAll"
          :indeterminate="isIndeterminate"
          :disabled="!emailList.length || loading"
          @change="handleCheckAllChange"
      >
      </el-checkbox>
      <div class="header-left" :style="'padding-left:' + actionLeft">

        <slot name="first"></slot>
        <Icon class="icon reload" icon="ion:reload" width="18" height="18" @click="refresh"/>
        <Icon v-perm="'email:delete'" class="icon delete" icon="uiw:delete" width="16" height="16"
              v-if="getSelectedMailsIds().length > 0"
              @click="handleDelete"/>
        <Icon v-perm="'email:delete'" class="icon delete" icon="fluent:mail-read-20-regular" width="21" height="21"
              v-if="getSelectedMailsIds().length > 0 && showUnread"
              @click="handleRead"/>
      </div>

      <div class="header-right">
        <span class="email-count" v-if="total">{{ $t('emailCount', {total: total}) }}</span>
        <Icon v-if="showAccountIcon" class="more-icon icon" width="16" height="16" icon="akar-icons:dot-grid-fill"
              @click="changeAccountShow"/>
      </div>
    </div>

    <div ref="scroll" class="scroll" :aria-busy="loading">
      <UseVirtualList ref="scrollbarRef"
                        @scroll="onScroll"
                        :list="list"
                        :options="{ itemHeight: itemHeight, overscan: 15 }"
                        class="virtual"
                        style="height: 100%"
                        v-if="!loading && list.length > 0"
                        :key="keyCount"
        >
          <template #default="{ data: item, index }" >
            <div :class="['email-row', props.type, { 'right-checked': item.rightChecked, 'mail-selected': (item.emailId ?? item.draftId) === props.selectedId }]"
                 :data-checked="item.checked"
                 @click="jumpDetails(item)"
                 @keydown.enter.self.prevent="jumpDetails(item)"
                 @keydown.space.self.prevent="jumpDetails(item)"
                 v-if="!item.expand"
                 :key="item.emailId || `draft-${item.draftId}`"
                 @contextmenu="handleContextmenu($event, item)"
                 role="button"
                 tabindex="0"
                 :aria-selected="(item.emailId ?? item.draftId) === props.selectedId"
            >
              <el-checkbox v-if="!props.showInboxSummary" :class=" props.type === 'all-email' ? 'all-email-checkbox' : 'checkbox'"
                           v-model="item.checked"
                           :disabled="!item.checked && isSelectMax"
                           @click.stop></el-checkbox>
              <div @click.stop="starChange(item)" class="pc-star" v-if="showStar && !props.showInboxSummary">
                <Icon v-if="item.isStar" icon="fluent-color:star-16" width="20" height="20"/>
                <Icon v-else icon="solar:star-line-duotone" width="18" height="18"/>
              </div>
              <div v-if="!showStar && !props.showInboxSummary"></div>
              <div class="sender-avatar" :style="{ background: avatarColor(item.name || item.sendEmail) }">
                {{ senderInitials(item.name || item.sendEmail) }}
              </div>
              <div class="title" :class="accountShow ? 'title-column' : 'title-column'">

                <div class="email-sender" :style=" (showStatus ? 'gap: 10px;' : '') + ((item.unread === EmailUnreadEnum.UNREAD && showUnread)  ? 'font-weight: bold' : '')">
                  <div class="email-status" v-if="showStatus">
                    <el-tooltip effect="dark" :content="item.statusIcon.content">
                      <Icon :icon="item.statusIcon.icon" :style="`color: ${item.statusIcon.color}`" width="20" height="20"/>
                    </el-tooltip>
                    <div class="del-status" v-if="item.isDel">
                      <el-tooltip effect="dark" :content="item.isDelContent">
                        <Icon class="icon" icon="mdi:email-remove" width="20" height="20"/>
                      </el-tooltip>
                    </div>
                  </div>
                  <div v-else></div>
                  <span class="name">
                    <span>
                      <div class="unread" v-if="isMobile && (item.unread === EmailUnreadEnum.UNREAD && showUnread) "/>
                      <slot name="name" :email="item"> {{ item.name }}</slot>
                    </span>
                    <span>
                      <Icon v-if="item.isStar" icon="fluent-color:star-16" width="18" height="18"/>
                    </span>
                  </span>
                  <button v-if="props.showInboxSummary && showStar && item.isStar" class="summary-star active" type="button" :title="$t('star')" @click.stop="starChange(item)">
                    <Icon :icon="item.isStar ? 'fluent-color:star-16' : 'solar:star-line-duotone'" width="15" height="15"/>
                  </button>
                  <span class="phone-time">{{ item.formatCreateTime }}</span>
                </div>
                <div>
                  <div class="email-text">
                    <span class="email-subject" :style="(item.unread === EmailUnreadEnum.UNREAD && showUnread)  ? 'font-weight: bold' : ''">
                      <div class="unread" v-if="!isMobile && (item.unread === EmailUnreadEnum.UNREAD && showUnread) "/>
                      <span v-if="item.code && !props.showInboxSummary" class="code-tag" @click.stop="copyCode(item.code)">
                        <Icon icon="solar:check-circle-bold" width="12" height="12" />{{ t('codeLabel') }} {{ item.code }}
                      </span>
                      <span class="subject-text">
                        <slot name="subject" :email="item" >
                          {{ item.subject || '\u200B' }}
                        </slot>
                      </span>
                    </span>
                    <span class="email-content">{{ item.listText || item.text || '\u200B' }}</span>
                  </div>
                  <!-- 固定行高的虚拟列表要求每行占位一致，标签区始终保留高度 -->
                  <div class="row-tags" v-if="props.showInboxSummary">
                    <span class="mail-badge replied" v-if="item.hasReply"><Icon icon="solar:reply-2-linear" width="12" />{{ settingStore.lang === 'zh' ? '已回复' : 'Replied' }}</span>
                    <span class="mail-badge category" v-if="mailCategory(item)">{{ mailCategory(item) }}</span>
                    <span class="mail-badge code" v-if="extractVerificationCode(item)"><Icon icon="solar:check-circle-bold" width="11" />{{ settingStore.lang === 'zh' ? '含验证码' : 'Code detected' }}</span>
                    <span class="mail-badge" v-if="item.attList?.length"><Icon icon="solar:paperclip-linear" width="12" />{{ item.attList.length }} {{ settingStore.lang === 'zh' ? '附件' : 'attachments' }}</span>
                  </div>
                  <div class="user-info" v-if="showUserInfo">
                    <div class="user">
                      <span>
                        <Icon icon="mynaui:user" width="20" height="20"/>
                      </span>
                      <span>{{ item.userEmail }}</span>
                    </div>
                    <div class="account">
                      <span>
                        <Icon icon="mdi-light:email" width="20" height="20"/>
                      </span>
                      <span>{{ item.type === 0 ? item.toEmail : item.sendEmail }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <slot name="row-actions" :email="item"></slot>
              <div class="email-right" :style="showUserInfo ? 'align-self: start;':''">
                <span class="email-time" :style="(item.unread === EmailUnreadEnum.UNREAD && showUnread) ? 'font-weight: bold' : ''">{{ item.formatCreateTime }}</span>
              </div>
            </div>
            <skeletonBlock v-else-if="item.expand === 'loading'"
                           :rows="1"
                           :showStar="showStar"
                           :accountShow="accountShow"
                           :showStatus="showStatus"
                           :showUserInfo="showUserInfo"
                           :type="type"/>
            <div class="noLoading" v-else-if="item.expand === 'retry'">
              <button class="retry-load" type="button" @click="getEmailList()">{{ settingStore.lang === 'zh' ? '加载失败，点击重试' : 'Could not load more. Retry' }}</button>
            </div>
            <div class="noLoading" v-else-if="item.expand === 'noMoreData'">
              <div>{{ $t('noMoreData') }}</div>
            </div>
          </template>
        </UseVirtualList>
      <skeletonBlock v-if="firstLoad && showFirstLoading && !loading && !loadError"
                       :rows="20"
                       :showStar="showStar"
                       :accountShow="accountShow"
                       :showStatus="showStatus"
                       :showUserInfo="showUserInfo"
                       :type="type"/>
      <skeletonBlock v-if="loading"
                       :rows="skeletonRows"
                       :showStar="showStar"
                       :accountShow="accountShow"
                       :showStatus="showStatus"
                       :showUserInfo="showUserInfo"
                       :type="type"/>
      <div class="empty" v-if="!firstLoad && list.length === 0 && !loading" role="status">
        <div v-if="loadError" class="compact-empty">
          <span><Icon icon="solar:cloud-cross-linear" width="28" height="28" /></span>
          <strong>{{ settingStore.lang === 'zh' ? '邮件暂时无法加载' : 'Could not load your mail' }}</strong>
          <p>{{ settingStore.lang === 'zh' ? '请检查网络连接，再试一次。' : 'Check your connection and try again.' }}</p>
          <button type="button" class="clear-filter" @click="refresh">{{ settingStore.lang === 'zh' ? '重新加载' : 'Try again' }}</button>
        </div>
        <div v-else-if="isFiltering" class="compact-empty">
          <span><Icon icon="solar:magnifer-linear" width="24" height="24" /></span>
          <strong>{{ settingStore.lang === 'zh' ? '未找到匹配邮件' : 'No matching messages' }}</strong>
          <p>{{ settingStore.lang === 'zh' ? '请调整关键词或筛选条件' : 'Try another keyword or filter' }}</p>
          <button type="button" class="clear-filter" @click="resetFilters">{{ settingStore.lang === 'zh' ? '清除筛选' : 'Clear filters' }}</button>
        </div>
        <div v-else-if="props.emptyTitle" class="compact-empty">
          <span><Icon :icon="props.emptyIcon" width="24" height="24" /></span>
          <strong>{{ props.emptyTitle }}</strong>
          <p>{{ props.emptyDescription }}</p>
          <div v-if="$slots['empty-actions']" class="compact-empty-actions"><slot name="empty-actions" /></div>
        </div>
        <el-empty v-else :image-size="isMobile ? 96 : 120" :description="$t('noMessagesFound')"/>
      </div>
    </div>
    <el-dropdown
        ref="dropdownRef"
        @visible-change="visibleChange"
        :virtual-ref="triggerRef"
        :show-arrow="false"
        :popper-options="{
      modifiers: [{ name: 'offset', options: { offset: [0, 0] } }],
    }"
        virtual-triggering
        trigger="contextmenu"
        placement="bottom-start"
    >
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item v-if="rightClickEmail.code" @click="copyCode(rightClickEmail.code)" >
            <template #default>
              <div class="right-dropdown-item">
                <Icon icon="fluent-color:clipboard-24" width="20" height="20" />
                <span>{{t('copyCode')}}</span>
              </div>
            </template>
          </el-dropdown-item>
          <el-dropdown-item v-if="['email'].includes(props.type)" @click="emailRead(rightClickEmail.emailId)" >
            <template #default>
              <div class="right-dropdown-item">
                <Icon icon="fluent:mail-read-20-regular" width="20" height="20" />
                <span>{{t('markAsRead')}}</span>
              </div>
            </template>
          </el-dropdown-item>
          <el-dropdown-item v-if="['email','star'].includes(props.type)" @click="openReply(rightClickEmail)">
            <template #default>
              <div class="right-dropdown-item">
                <Icon icon="la:reply" width="20" height="20"  />
                <span>{{t('reply')}}</span>
              </div>
            </template>
          </el-dropdown-item>
          <el-dropdown-item v-if="['email','send', 'star'].includes(props.type)" @click="openForward(rightClickEmail)">
            <template #default>
              <div class="right-dropdown-item">
                <Icon icon="iconoir:arrow-up-right" width="19" height="19"  />
                <span>{{t('forward')}}</span>
              </div>
            </template>
          </el-dropdown-item>
          <el-dropdown-item v-if="['email','send', 'star'].includes(props.type)" @click="starChange(rightClickEmail)">
            <template #default>
              <div class="right-dropdown-item">
                <Icon icon="solar:star-line-duotone" width="19" height="19"/>
                <span>{{t('star')}}</span>
              </div>
            </template>
          </el-dropdown-item>
          <el-dropdown-item v-if="props.type === 'all-email'" @click="handleSearch('user', rightClickEmail.userEmail)">
            <template #default>
              <div class="right-dropdown-item">
                <Icon icon="iconoir:search" width="20" height="20" />
                <span>{{t('searchUser')}}</span>
              </div>
            </template>
          </el-dropdown-item>
          <el-dropdown-item v-if="props.type === 'all-email' " @click="handleSearch('account', rightClickEmail.toEmail)">
            <template #default>
              <div class="right-dropdown-item">
                <Icon icon="iconoir:search" width="20" height="20" />
                <span>{{t('searchEmail')}}</span>
              </div>
            </template>
          </el-dropdown-item>
          <el-dropdown-item v-if="props.type === 'all-email' " @click="handleSearch('name', rightClickEmail.name)">
            <template #default>
              <div class="right-dropdown-item">
                <Icon icon="iconoir:search" width="20" height="20" />
                <span>{{t('searchSender')}}</span>
              </div>
            </template>
          </el-dropdown-item>
          <el-dropdown-item @click="rightDelete(rightClickEmail.emailId)">
            <template #default>
              <div class="right-dropdown-item">
                <Icon icon="uiw:delete" width="16" height="20" style="margin-left: 1px;margin-right: 3px" />
                <span>{{t('delete')}}</span>
              </div>
            </template>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import {Icon} from "@iconify/vue";
import skeletonBlock from "@/components/email-scroll/skeleton/index.vue"
import {computed, onActivated, reactive, ref, watch, nextTick, onMounted, onUnmounted } from "vue";
import {useEmailStore} from "@/store/email.js";
import {useUiStore} from "@/store/ui.js";
import {useSettingStore} from "@/store/setting.js";
import {mailListRows} from '@/utils/mail-list-state.js';
import {sleep} from "@/utils/time-utils.js"
import {fromNow} from "@/utils/day.js";
import {useI18n} from "vue-i18n";
import {EmailUnreadEnum} from "@/enums/email-enum.js";
import { UseVirtualList } from '@vueuse/components'
import { useScroll } from '@vueuse/core'

const props = defineProps({
  getEmailList: Function,
  emailDelete: Function,
  emailRead: Function,
  starAdd: Function,
  starCancel: Function,
  cancelSuccess: Function,
  starSuccess: Function,
  actionLeft: {
    type: String,
    default: '0'
  },
  timeSort: {
    type: Number,
    default: 0,
  },
  showStatus: {
    type: Boolean,
    default: false
  },
  showAccountIcon: {
    type: Boolean,
    default: true,
  },
  showUserInfo: {
    type: Boolean,
    default: false
  },
  showStar: {
    type: Boolean,
    default: true
  },
  allowStar: {
    type: Boolean,
    default: true
  },
  type: {
    type: String,
    default: 'email'
  },
  showFirstLoading: {
    type: Boolean,
    default: true
  },
  showUnread: {
    type: Boolean,
    default: false
  },
  selectedId: {
    type: [Number, String],
    default: null
  },
  rowHeight: {
    type: Number,
    default: 0
  },
  unreadBadge: {
    type: Boolean,
    default: false
  },
  showInboxSummary: {
    type: Boolean,
    default: false
  },
  summaryTitle: {
    type: String,
    default: ''
  },
  emptyTitle: {
    type: String,
    default: ''
  },
  emptyDescription: {
    type: String,
    default: ''
  },
  emptyIcon: {
    type: String,
    default: 'solar:inbox-line-linear'
  },
  searchQuery: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['jump', 'refresh-before', 'delete-draft', 'right-search', 'list-loaded', 'filters-reset'])
const {t} = useI18n()
const settingStore = useSettingStore()
const uiStore = useUiStore();
const emailStore = useEmailStore();
const loading = ref(false);
const followLoading = ref(false);
const noLoading = ref(false);
const emailList = reactive([])
const loadError = ref(false)
const total = ref(0);
const lastSyncedAt = ref(null);
const checkAll = ref(false);
const isIndeterminate = ref(false);
const scroll = ref(null)
const firstLoad = ref(true)
let requestVersion = 0
let scrollTop = 0
const latestEmail = ref(null)
const scrollbarRef = ref(null)
let reqLock = false
let isMobile = ref(innerWidth < 1367)
let skeletonRows = 6
const timePaddingRight = ref('');
const keyCount = ref(0);
const dropdownRef = ref(null);
const dropdownCloseLock = ref(false);
const dropdownShow = ref(false);
const rightClickEmail = ref({});
const MAX_SELECT_COUNT = 95;
const checkedEmailCount = ref(0);
const isSelectMax = computed(() => checkedEmailCount.value >= MAX_SELECT_COUNT);
let timer = null

function senderInitials(value = '') {
  const text = String(value).trim()
  if (!text) return 'M'
  const parts = text.replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean)
  return parts.slice(0, 2).map(part => part[0]).join('').toUpperCase()
}

function avatarColor(value = '') {
  const palettes = [
    'var(--avatar-1)', 'var(--avatar-2)', 'var(--avatar-3)',
    'var(--avatar-4)', 'var(--avatar-5)', 'var(--avatar-6)'
  ]
  const score = Array.from(String(value)).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return palettes[score % palettes.length]
}

function extractVerificationCode(item = {}) {
  const serverCode = String(item.code || '').trim()
  if (serverCode) return serverCode

  const source = `${item.subject || ''} ${item.listText || ''} ${item.text || ''} ${item.content || ''}`
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;|&#160;/gi, ' ')
      .replace(/\s+/g, ' ')
  if (!/(验证码|校验码|动态码|一次性密码|otp|verification\s*code|security\s*code|authentication\s*code)/i.test(source)) return ''

  const labelled = source.match(/(?:验证码|校验码|动态码|一次性密码|otp|verification\s*code|security\s*code|authentication\s*code)[^A-Z0-9]{0,20}([A-Z0-9]{4,8})/i)
  return (labelled?.[1] && /\d/.test(labelled[1]) ? labelled[1] : '') || source.match(/\b\d{4,8}\b/)?.[0] || ''
}

function mailCategory(item = {}) {
  const source = `${item.subject || ''} ${item.listText || ''} ${item.text || ''}`.toLowerCase()
  if (extractVerificationCode(item)) return settingStore.lang === 'zh' ? '系统' : 'System'
  if (Number(item.type) === 1 && /(报价|询价|quotation|quote|rfq)/i.test(source)) return settingStore.lang === 'zh' ? '已发送报价' : 'Sent quote'
  if (/(报价|询价|quotation|quote|rfq)/i.test(source)) return settingStore.lang === 'zh' ? '供应商报价' : 'Supplier quote'
  if (/(运单|物流|清关|提单|装箱单|快递|shipment|tracking|customs|dhl|fedex|ups)/i.test(source)) return settingStore.lang === 'zh' ? '物流单据' : 'Logistics'
  if (/(询盘|采购|需求|我(?:要|想要|需要)|有(?:现)?货(?:吗|么)?|有没有货|能否提供|是否有货|多少钱|价格|inquiry|enquiry|request for|\bneed\b|\bwant\b|looking for|do you have|can you supply|availability|in stock)/i.test(source)) return settingStore.lang === 'zh' ? '客户询盘' : 'Customer inquiry'
  if (/(已送达|送达通知|delivered|delivery notice)/i.test(source)) return settingStore.lang === 'zh' ? '发送通知' : 'Delivery notice'
  return ''
}
const position = ref(
    DOMRect.fromRect({
      x: 0,
      y: 0,
    })
)

const triggerRef = ref({
  getBoundingClientRect() {
    return position.value;
  }
})

const queryParam = reactive({
  size: 50
});

// 切换邮箱身份时同步清空，避免旧邮箱的邮件在刷新返回前闪现
function resetList() {
  requestVersion++
  lastSyncedAt.value = null
  noLoading.value = false
  followLoading.value = false
  emailList.length = 0
  loadError.value = false
  total.value = 0
  latestEmail.value = null
  firstLoad.value = true
  loading.value = true
}

defineExpose({
  resetList,
  refreshList,
  deleteEmail,
  addItem,
  handleList,
  emailList,
  firstLoad,
  latestEmail,
  noLoading,
  total,
  loading,
  loadError,
  lastSyncedAt
})

onActivated(() => {
  requestAnimationFrame(() => {
    const index = scrollTop / itemHeight.value
    scrollbarRef.value?.scrollTo(index);
  })
})

onMounted(() => {
  timer = setInterval(() => {
    emailList.forEach(email => {
      email.formatCreateTime = fromNow(email.createTime);
    })
  }, 1000 * 60);
  window.addEventListener('resize', handleWindowResize)
})

onUnmounted(() => {
  clearInterval(timer)
  window.removeEventListener('resize', handleWindowResize)
})

getEmailList()

function handleWindowResize() {
  isMobile.value = innerWidth < 1367
}

function onScroll(e) {
  scrollTop = e.target.scrollTop;
}

const { arrivedState } = useScroll(scrollbarRef, {
  offset: { bottom: isMobile.value ? 2200 : 1500 }
})


const list = computed(() => {
  const source = props.showInboxSummary ? filteredEmails.value : emailList
  return mailListRows(source, { loadingMore: followLoading.value, exhausted: noLoading.value, failed: loadError.value })
})
const unreadCount = computed(() => emailList.filter(item => item.unread === EmailUnreadEnum.UNREAD).length)

// 侧栏文件夹树的收件箱未读徽标（只有收件箱视图开启）
watch(unreadCount, value => {
  if (props.unreadBadge) uiStore.asideCount.email = Number(value) || 0
}, { immediate: true, flush: 'post' })
const searchKeyword = ref('')
const isFiltering = computed(() => Boolean(searchKeyword.value))

watch(
  () => props.searchQuery,
  value => {
    searchKeyword.value = value || ''
  },
  {immediate: true}
)

function resetFilters() {
  searchKeyword.value = ''
  emit('filters-reset')
}

function resetSearchOnly() {
  searchKeyword.value = ''
  emit('filters-reset')
}
const lastSyncedLabel = computed(() => {
  if (loading.value) return settingStore.lang === 'zh' ? '正在同步…' : 'Syncing…'
  if (loadError.value) return settingStore.lang === 'zh' ? '同步失败' : 'Sync failed'
  if (!lastSyncedAt.value) return settingStore.lang === 'zh' ? '尚未同步' : 'Not synced yet'
  const time = new Intl.DateTimeFormat(settingStore.lang === 'zh' ? 'zh-CN' : 'en', {hour: '2-digit', minute: '2-digit', hour12: false}).format(lastSyncedAt.value)
  return settingStore.lang === 'zh' ? `已同步 · ${time}` : `Synced · ${time}`
})

const filteredEmails = computed(() => {
  const keyword = searchKeyword.value.toLocaleLowerCase()
  return emailList.filter(item => {
    if (!keyword) return true
    return [item.name, item.sendEmail, item.subject, item.listText, item.text, item.code]
      .some(value => String(value || '').toLocaleLowerCase().includes(keyword))
  })
})

function cssPx(name, fallback) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const value = parseFloat(raw)
  return Number.isFinite(value) && value > 0 ? value : fallback
}

const itemHeight = computed(() => {
    if (props.rowHeight > 0) return props.rowHeight;
    // 与 .email-row / .email-container.has-summary 的 min-height 保持严格一致，
    // 否则虚拟列表定位会与实际行高错位
    if (props.type === 'all-email') {
      return isMobile.value ? 144 : 96;
    }
    // 与 CSS 的 --list-row-h 保持一致
    return cssPx('--list-row-h', 112);
})

watch(emailList, () => {
  updateHasScrollbar();
})

watch(scrollbarRef, () => {
  updateHasScrollbar();
})

// 强制刷新 (itemHeight 更改后虚拟滚动列表不会自己更新)
watch(itemHeight, () => {
  keyCount.value ++
})

// 监听是否到达底部
watch(() => arrivedState.bottom, (isBottom) => {
  if (isBottom && !loading.value && !loadError.value) {
    loadData();
  }
});

watch(
    () => emailList.map(item => item.checked),
    () => {
      checkedEmailCount.value = emailList.length
      if (emailList.length > 0) {
        updateCheckStatus();
      }
    },
    {deep: true}
);


watch(() => emailStore.deleteIds, () => {
  if (emailStore.deleteIds) {
    deleteEmail(emailStore.deleteIds)
  }
})

watch(() => emailStore.cancelStarEmailId, () => {
  emailList.forEach(email => {
    if (email.emailId === emailStore.cancelStarEmailId) {
      email.isStar = 0
    }
  })
})

watch(() => emailStore.addStarEmailId, () => {
  emailList.forEach(email => {
    if (email.emailId === emailStore.addStarEmailId) {
      email.isStar = 1
    }
  })
})

window.addEventListener('wheel', (event) => {
  if (dropdownShow.value) {
    dropdownRef.value.handleClose();
  }
})

function openReply(email) {
  const fullEmail = emailStore.detailMap[email.emailId]
  if (!fullEmail) return
  uiStore.writerRef.openReply(fullEmail)
}

function openForward(email) {
  const fullEmail = emailStore.detailMap[email.emailId]
  if (!fullEmail) return
  uiStore.writerRef.openForward(fullEmail)
}

function visibleChange(e) {
  dropdownShow.value = e;
  dropdownCloseLock.value = true;
  setTimeout(() => {
    dropdownCloseLock.value = false;
  },1500)

  if (!e && rightClickEmail.value.rightChecked) {
    rightClickEmail.value.rightChecked = false
  }
}

const handleContextmenu = (event, email) => {

  if (props.type === 'draft' || props.type === 'trash') {
    return
  }

  if (rightClickEmail.value.rightChecked) {
    rightClickEmail.value.rightChecked = false
  }

  const { clientX, clientY } = event
  position.value = DOMRect.fromRect({
    x: clientX,
    y: clientY,
  })
  event.preventDefault();
  dropdownRef.value?.handleOpen();

  rightClickEmail.value = email;
  rightClickEmail.value.rightChecked = true
}

function updateHasScrollbar() {
  nextTick(() => {
    const doc = document.querySelector('.virtual');
    if (doc) {
      if (doc.scrollHeight > doc.clientHeight) {
        timePaddingRight.value = '5px';
      } else {
        timePaddingRight.value = '15px'
      }
    }
  })
}

function getSkeletonRows() {
  if (emailList.length > 20) return skeletonRows = 20
  if (emailList.length === 0) return skeletonRows = 1
  skeletonRows = emailList.length
}

const accountShow = computed(() => {
  return uiStore.accountShow && settingStore.settings.manyEmail === 0
})

function starChange(email) {

  if (!email.isStar) {

    if (!props.allowStar) return;

    email.isStar = 1;
    props.starAdd(email.emailId).then(() => {
      email.isStar = 1;
      props.starSuccess(email)
    }).catch(e => {
      console.error(e)
      email.isStar = 0
    })
  } else {

    email.isStar = 0;
    props.starCancel(email.emailId).then(() => {
      email.isStar = 0;
      props.cancelSuccess?.(email)
    }).catch(e => {
      console.error(e)
      email.isStar = 1;
    })
  }
}

function changeAccountShow() {
  uiStore.accountShow = !uiStore.accountShow;
}

const handleRead = () => {
  const emailIds = getSelectedMailsIds();
  props.emailRead(emailIds);
  localRead(emailIds);
}

function emailRead(emailId) {
  props.emailRead([emailId])
  localRead([emailId]);
}

function localRead(emailIds) {
  emailIds.forEach(emailId => {
    const index = emailList.findIndex(email => email.emailId === emailId);
    if (index > -1) {
      emailList[index].unread = EmailUnreadEnum.READ;
      emailList[index].checked = false;
    }
  })
}

function rightDelete(emailId) {

  if (props.type === 'all-email') {
    ElMessageBox.confirm(t('delOneEmailConfirm'), {
      confirmButtonText: t('confirm'),
      cancelButtonText: t('cancel'),
      type: 'warning'
    }).then(() => {
      props.emailDelete([emailId]).then(() => {
        ElMessage({
          message: t('delSuccessMsg'),
          type: 'success',
          plain: true
        })
        emailStore.deleteIds = [emailId];
      })
    })
    return;
  }
  props.emailDelete([emailId]).then(() => {
    ElMessage({
      message: t('mailMovedToTrash'),
      type: 'success',
      plain: true
    })
    emailStore.deleteIds = [emailId];
  })
}

function handleSearch(type, value) {
  emit('right-search', type, value);
}

async function copyCode(code) {
  try {
    await navigator.clipboard.writeText(code);
    ElMessage({
      message: t('copySuccessMsg'),
      type: 'success',
      plain: true
    })
  } catch (err) {
    console.error(`${t('copyFailMsg')}:`, err);
    ElMessage({
      message: t('copyFailMsg'),
      type: 'error',
      plain: true
    })
  }
}

function handleDelete() {
  ElMessageBox.confirm(t(props.type === 'all-email' ? 'delOneEmailConfirm' : 'delEmailsConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {

    if (props.type === 'draft') {
      const draftIds = getSelectedDraftsIds();
      emit('delete-draft', draftIds);
      return;
    }

    const emailIds = getSelectedMailsIds();
    props.emailDelete(emailIds).then(() => {
      ElMessage({
        message: t(props.type === 'all-email' ? 'delSuccessMsg' : 'mailMovedToTrash'),
        type: 'success',
        plain: true
      })
      emailStore.deleteIds = emailIds;
    })
  })
}

function deleteEmail(emailIds) {
  emailIds.forEach(emailId => {
    emailList.forEach((item, index) => {
      if (emailId === item.emailId) {
        emailList.splice(index, 1);
      }
    })
  })
  if (emailList.length < queryParam.size && !noLoading.value) {
    getEmailList()
  }
}

function addItem(email) {

  const existIndex = emailList.findIndex(item => item.emailId === email.emailId)

  if (existIndex > -1) {
    return false;
  }

  email.formatCreateTime = fromNow(email.formatCreateTime);

  if (props.timeSort) {
    if (noLoading.value) {
      handleList([email]);
      emailList.push(email);
    }

    if (email.emailId > latestEmail.value?.emailId) {
      latestEmail.value = email
    }

    total.value++
    return true;
  }


  const index = emailList.findIndex(item => item.emailId < email.emailId)

  if (index !== -1) {
    handleList([email]);
    emailList.splice(index, 0, email);
  } else {
    if (noLoading.value) {
      handleList([email]);
      emailList.push(email);
    }
  }

  if (email.emailId > latestEmail.value?.emailId) {
    latestEmail.value = email
  }

  total.value++
  return true;
}

function handleCheckAllChange(val) {
  if (val) {
    let count = 0;
    emailList.forEach(item => {
      if (count < MAX_SELECT_COUNT) {
        item.checked = true;
        count++;
      } else {
        item.checked = false;
      }
    });
  } else {
    emailList.forEach(item => item.checked = false);
  }
  isIndeterminate.value = false;
}

// 获取选中的邮件列表id
function getSelectedMailsIds() {
  return emailList.filter(item => item.checked).map(item => item.emailId);
}

function getSelectedDraftsIds() {
  return emailList.filter(item => item.checked).map(item => item.draftId);
}

function updateCheckStatus() {
  const checkedCount = emailList.filter(item => item.checked).length;
  checkedEmailCount.value = checkedCount;
  const atMax = checkedCount >= MAX_SELECT_COUNT;
  checkAll.value = emailList.length > 0 && (checkedCount === emailList.length || atMax);
  isIndeterminate.value = checkedCount > 0 && !checkAll.value;
}

function jumpDetails(email) {

  if (dropdownShow.value) {
    dropdownRef.value.handleClose();
    return;
  }

  if (!dropdownCloseLock.value) {
    const sel = window.getSelection();
    if (sel.toString().trim()) {
      return
    }
  }
  emit('jump', email)
}


function getEmailList(refresh = false) {

  if (reqLock && !refresh) return Promise.resolve();

  const version = refresh ? ++requestVersion : requestVersion

  let emailId = emailList.length > 0 ? emailList.at(-1).emailId : 0;

  reqLock = true

  if (!refresh) {

    if (loading.value || noLoading.value) {
      reqLock = false
      return
    }

  } else {
    getSkeletonRows()
    emailId = 0
    loading.value = true
    scrollTop = 0
    // 立即清空，避免刷新/切换邮箱期间仍渲染上一个邮箱的邮件
    emailList.length = 0
    loadError.value = false
  }

  if (emailList.length === 0) {
    loading.value = true
  } else {
    followLoading.value = !refresh;
  }
  loadError.value = false
  let start = Date.now();

  return props.getEmailList(emailId, queryParam.size).then(async data => {
    if (version !== requestVersion) return
    let end = Date.now();
    let duration = end - start;
    if (duration < 300 && !emailId) {
        await sleep(300 - duration)
    }
    if (version !== requestVersion) return
    firstLoad.value = false

    let list = data.list.map(item => ({
      ...item,
      checked: false
    }));


    latestEmail.value = data.latestEmail

    handleList(list);
    emailList.push(...list);
    emit('list-loaded', emailList)
    if (refresh) scrollbarRef.value?.scrollTo(0);

    noLoading.value = data.list.length < queryParam.size;
    followLoading.value = data.list.length >= queryParam.size;

    total.value = data.total;
    lastSyncedAt.value = new Date();
    return true
  }).catch(() => {
    if (version !== requestVersion) return false
    firstLoad.value = false
    followLoading.value = false
    loadError.value = true
    return false
  }).finally(() => {
    if (version === requestVersion) {
      loading.value = false
      reqLock = false
    }
  })
}

function handleList(list) {
  list.forEach(email => {
    email.formatCreateTime = fromNow(email.createTime);
    email.test = t('received')
    const statusIconMap = {
      0: { icon: 'ic:round-mark-email-read', color: 'var(--success)', content: t('received') },
      1: { icon: 'bi:send-arrow-up-fill',  color: 'var(--brand-600)', content: settingStore.lang === 'zh' ? '待确认送达' : 'Delivery pending' },
      2: { icon: 'bi:send-check-fill',     color: 'var(--success)', content: settingStore.lang === 'zh' ? '已送达' : 'Delivered' },
      3: { icon: 'bi:send-x-fill',         color: 'var(--danger)', content: settingStore.lang === 'zh' ? '已退信' : 'Bounced' },
      8: { icon: 'bi:send-x-fill',         color: 'var(--danger)', content: t('sendFailMsg') },
      4: { icon: 'bi:send-exclamation-fill', color: 'var(--warning)', content: t('complained') },
      5: { icon: 'bi:send-arrow-up-fill',  color: 'var(--warning)', content: t('delayed') },
      7: { icon: 'ic:round-mark-email-read', color: 'var(--warning)', content: t('noRecipient') },
    };

    if (email.isDel) {
      email.isDelContent = t('selectDeleted');
    }
    email.statusIcon = statusIconMap[email.status];
  })
}

function refresh() {
  emit('refresh-before')
  if (props.skeleton) {
    scrollbarRef.value?.scrollTo(0)
  }
  return refreshList()
}

function refreshList() {
  checkAll.value = false;
  isIndeterminate.value = false;
  return getEmailList(true);
}

function loadData() {
  getEmailList()
}

</script>
<style lang="scss" scoped>

.email-container {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  padding: 0;
  font-size: 14px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  height: 100%;
}

.scroll {
  min-height: 0;
  margin: 0;
  height: 100%;
  overflow: hidden;

  .virtual {
    will-change: scroll-position;
  }

  .empty {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
  }

  .compact-empty {
    width: min(340px, calc(100% - 40px));
    display: flex;
    flex-direction: column;
    align-items: center;
    color: var(--text-3);
    text-align: center;

    > span {
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      color: var(--brand-500);
      border: 1px solid var(--border);
      border-radius: var(--r-lg);
      background: var(--surface-2);
    }

    strong { margin-top: 18px; color: var(--text); font-size: 18px; font-weight: 600; }
    p { margin: 8px 0 0; color: var(--text-2); font-size: 14px; line-height: 1.7; }

    .clear-filter {
      margin-top: 12px;
      padding: 7px 12px;
      color: var(--brand-600);
      border: 1px solid var(--border);
      border-radius: var(--r-md);
      background: var(--surface);
      cursor: pointer;
    }

    .clear-filter:hover { background: var(--brand-soft); border-color: var(--brand-500); }

    .compact-empty-actions { margin-top: 14px; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 8px; }
    .compact-empty-actions :deep(button) {
      min-height: 34px;
      padding: 0 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--text-2);
      border: 1px solid var(--border);
      border-radius: var(--r-md);
      background: var(--surface);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .compact-empty-actions :deep(button.primary) { color: #fff; border-color: var(--brand-600); background: var(--brand-600); }
  }

  .noLoading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 15px 0 0 0;
    color: var(--secondary-text-color);
  }

  .follow-loading {
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--loadding-background);
    height: 100%;
    width: 100%;
    position: absolute;
    z-index: 1;
    top: 0;
    left: 0;
  }

  .loading-show {
    transition: all 200ms ease 200ms;
    opacity: 1;
  }

  .loading-hide {
    pointer-events: none;
    transition: var(--loading-hide-transition);
    opacity: 0;
  }
}

:deep(.email-row) {
  display: flex;
  padding: 9px 14px 9px 0;
  justify-content: space-between;
  box-shadow: var(--header-actions-border);
  cursor: pointer;
  align-items: center;
  position: relative;
  transition: background .18s ease, box-shadow .18s ease, transform .18s ease;
  min-height: 84px;
  height:  auto;
  @media (max-width: 1366px) {
    min-height: 96px;
  }

  @media (pointer: coarse) {
    /* 触屏 */
    user-select: none;
  }
  &.all-email {
    min-height: 96px;
    height: auto;
    @media (max-width: 1366px) {
      height: 144px;
    }
  }
  .user-info {
    display: flex;
    flex-wrap: wrap;
    column-gap: 10px;
    margin-top: 5px;
    margin-bottom: 2px;
    color: var(--email-scroll-content-color);
    @media (max-width: 1366px) {
      flex-direction: column;
    }

    .user, .account {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      transition: all 300ms;
      line-height: 12px;
      max-width: 300px;
      min-width: 0;

      @media (max-width: 1223px) {
        max-width: 280px;
      }

      span:first-child {
        position: relative;
      }

      span:last-child {
        margin-left: 5px;
        position: relative;
        bottom: 5px;
      }
    }
  }

  .checkbox {
    display: flex;
    padding-left: 15px;
    padding-right: 12px;
    justify-content: center;
  }

  .all-email-checkbox {
    display: flex;
    padding-left: 15px;
    padding-right: 20px;
    justify-content: center;
    @media (min-width: 1367px) {
      justify-content: start;
      height: 100%;
      align-self: start;
      padding-bottom: 30px;
    }
  }

  .title-column {
    @media (max-width: 1366px) {
      grid-template-columns: 1fr !important;
      gap: 4px !important;
    }
  }

  .title {
    flex: 1;
    display: grid;
    grid-template-columns: 210px 1fr;
    @media (max-width: 1366px) {
      padding-right: 15px;
    }
    @media (max-width: 1366px) {
      grid-template-columns: 1fr;
      gap: 4px;
    }

    .email-sender {
      color: var(--el-text-color-primary);
      display: grid;
      grid-template-columns: auto 1fr auto;

      .email-status {
        display: flex;
        flex-direction: column;
        align-content: center;
        @media (max-width: 1366px) {
          flex-direction: row;
          gap: 5px;
        }
      }

      .name {
        display: grid;
        gap: 5px;
        grid-template-columns: auto 1fr;

        > span:last-child {
          display: flex;
          align-items: center;
        }

        @media (min-width: 1366px) {
          grid-template-columns: 1fr;
          > span:last-child {
            display: none;
          }
        }

        > span:first-child {
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .name-skeleton {
          width: 150px;
          height: 1rem;
          @media (max-width: 767px) {
            width: 130px;
          }
        }
      }

      .phone-time {
        font-weight: normal;
        font-size: 12px;
        @media (min-width: 1367px) {
          display: none;
        }
      }
    }

    .email-text-skeleton {
      .text-skeleton-one {
        width: 80%;
        height: 16px;
        @media (max-width: 1366px) {
          width: 40%;
        }
        @media (max-width: 767px) {
          width: 70%;
        }
      }

      .text-skeleton-two {
        width: min(300px, 100%);
        height: 16px;
        @media (min-width: 1367px) {
          display: none;
        }
        @media (max-width: 1366px) {
          width: 100%;
        }
      }
    }

    .email-text {
      display: grid;
      grid-template-columns: auto 1fr;
      @media (max-width: 1366px) {
        grid-template-columns: 1fr;
      }

      .email-subject {
        display: flex;
        align-items: center;
        gap: 6px;
        overflow: hidden;
        white-space: nowrap;
        min-width: 0;
        @media (min-width: 1367px) {
          padding-left: 5px;
        }
      }

      .code-tag {
        flex: 0 0 auto;
        max-width: 170px;
        height: 22px;
        padding: 0 7px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        border-radius: 6px;
        line-height: 22px;
        font-size: 12px;
        font-weight: 650;
        color: var(--success);
        background: color-mix(in srgb, var(--success) 12%, transparent);
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        cursor: pointer;
      }

      .subject-text {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        min-width: 0;
      }

      .email-content {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        padding-left: 10px;
        color: var(--email-scroll-content-color);
        @media (max-width: 1366px) {
          padding-left: 0;
          margin-top: 0;
        }
      }
    }
  }


  .email-right {
    text-align: right;
    font-size: 12px;
    white-space: nowrap;
    display: flex;
    padding-left: 15px;
    align-items: center;
    @media (max-width: 1366px) {
      display: none;
    }
  }

  .email-right-skeleton {
    @media (max-width: 1366px) {
      display: none;
    }
  }

  &:hover {
    background-color: var(--email-hover-background);
    z-index: 0;
    box-shadow: inset 2px 0 0 var(--brand-500);
  }

  &.right-checked,
  &.right-checked:hover {
    background-color: var(--email-right-click-background);
  }

  &.mail-selected,
  &.mail-selected:hover {
    background: var(--brand-soft);
    box-shadow: inset 2px 0 0 var(--brand-600);
  }

  /*&[data-checked="true"] {
    background-color: #c2dbff;
  }*/
}
.email-container.has-summary { grid-template-rows: auto minmax(0, 1fr); }

.inbox-panel-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}
.summary-status { min-width: 0; display: flex; align-items: center; justify-content: flex-end; gap: 7px; color: var(--text-3); font-size: 15px; }
.retry-load { padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--r-md); background: var(--surface); color: var(--brand-600); cursor: pointer; }
.sync-status.failed { color: var(--danger); }
.sync-status.failed i { background: var(--danger); box-shadow: none; }
.sync-status { display: inline-flex; align-items: center; gap: 6px; color: var(--text-mail-meta); font-size: 12px; white-space: nowrap; }
.sync-status i { width: 6px; height: 6px; border-radius: 50%; background: var(--brand-600); box-shadow: 0 0 0 3px var(--brand-soft); }
.summary-refresh, .search-clear { display: grid; place-items: center; padding: 0; color: var(--text-3); border: 0; background: transparent; cursor: pointer; }
.summary-refresh { width: 28px; height: 28px; border: 1px solid var(--border); border-radius: 8px; }
.summary-refresh:hover:not(:disabled), .search-clear:hover { color: var(--brand-600); background: var(--brand-soft); }
.summary-refresh:disabled { cursor: wait; opacity: .6; }
.summary-refresh .spinning { animation: summary-spin .75s linear infinite; }
@keyframes summary-spin { to { transform: rotate(360deg); } }
.inbox-search { min-width: 0; width: 100%; height: 34px; padding: 0 10px; display: flex; align-items: center; gap: 8px; color: var(--text-3); border: 1px solid var(--border); border-radius: var(--r-md); background: var(--surface-2); transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease), background var(--dur) var(--ease); }
.inbox-search:focus-within { border-color: var(--brand-500); background: var(--surface); box-shadow: 0 0 0 3px var(--brand-soft); }
.inbox-search input { min-width: 0; flex: 1; color: var(--text); background: transparent; font-size: 16px; }
.inbox-search input::placeholder { color: var(--text-3); }
.search-clear { width: 24px; height: 24px; flex: 0 0 24px; border-radius: 6px; }

:deep(.sender-avatar) {
  width: 32px;
  height: 32px;
  margin-right: 10px;
  flex: 0 0 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .02em;
}

:deep(.row-tags) { min-height: 20px; margin-top: 7px; display: flex; align-items: center; gap: 6px; overflow: hidden; }
:deep(.mail-badge) { height: 20px; padding: 0 6px; display: inline-flex; align-items: center; gap: 4px; color: var(--text-3); border-radius: var(--r-sm); background: var(--surface-3); font-size: 10.5px; font-weight: 500; white-space: nowrap; }
:deep(.mail-badge.code) { color: var(--brand-700); background: var(--brand-soft); }
:deep(.mail-badge.category) { color: var(--success); background: color-mix(in srgb, var(--success) 11%, var(--surface)); }
:deep(.mail-badge.replied) { color: var(--brand-700); background: var(--brand-soft); }

.email-container.has-summary :deep(.email-row) {
  align-items: flex-start;
  min-height: var(--list-row-h);
  padding: 9px 14px;
}
.email-container.has-summary :deep(.sender-avatar) { margin-top: 1px; }
.email-container.has-summary :deep(.title) { min-width: 0; display: block; }
.email-container.has-summary :deep(.email-sender) { display: flex; align-items: center; gap: 6px; }
.email-container.has-summary :deep(.email-sender .name) { min-width: 0; flex: 1; display: block; }
.email-container.has-summary :deep(.email-sender .name > span:first-child) { display: block; color: var(--text); font-size: var(--font-list-sender); line-height: 22px; }
.email-container.has-summary :deep(.email-sender .name > span:last-child) { display: none; }
.email-container.has-summary :deep(.phone-time) { display: block !important; flex: none; color: var(--text-mail-meta); font-size: var(--font-list-meta); line-height: 22px; }
.email-container.has-summary :deep(.summary-star) { width: 18px; height: 18px; flex: 0 0 18px; display: grid; place-items: center; padding: 0; color: var(--brand-600); background: transparent; border: 0; border-radius: var(--r-sm); cursor: pointer; }
.email-container.has-summary :deep(.summary-star:hover) { background: var(--surface-3); }
.email-container.has-summary :deep(.email-text) { display: block; min-width: 0; }
.email-container.has-summary :deep(.email-subject) { display: block; margin-top: 2px; padding: 0; color: var(--text); font-size: var(--font-list-subject); font-weight: 550; line-height: 22px; }
.email-container.has-summary :deep(.email-content) { display: block; margin-top: 3px; padding: 0; color: var(--text-mail-meta); font-size: var(--font-list-snippet); line-height: 20px; }
.email-container.has-summary :deep(.row-tags) { margin-top: 5px; min-height: 21px; }
.email-container.has-summary :deep(.mail-badge) { height: 21px; padding: 0 8px; font-size: var(--font-list-meta); }
.email-container.has-summary :deep(.email-right) { display: none; }
.email-container.has-summary :deep(.email-row.mail-selected) { background: var(--brand-soft); }
.email-container.has-summary :deep(.email-row:focus-visible) { outline: 2px solid var(--brand-500); outline-offset: -2px; }


.phone-star {
  display: none;
}

.pc-star {
  display: flex;
  width: 40px;
}

@media (max-width: 1366px) {
  .pc-star {
    display: none;
  }
  .phone-star {
    display: block;
    align-self: end;
    padding-right: 16px;
    padding-top: 8px;
  }
  .star-pd {
    padding-top: 6px !important;
  }
}

.email-time {
  padding-right: v-bind(timePaddingRight);
}

:deep(.el-scrollbar__view) {
  height: 100%;
}

.header-actions {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 15px;
  min-height: 50px;
  padding: 6px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  box-shadow: none;
  box-shadow: var(--header-actions-border);

  .header-left {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    position: relative;
    column-gap: 20px;
    row-gap: 8px;
    padding-left: 2px;
    color: var(--el-text-color-primary);;
  }

  .header-right {
    display: grid;
    grid-template-columns: auto auto;
    align-items: start;
    height: 100%;
    color: var(--el-text-color-primary);;

    .email-count {
      white-space: nowrap;
      margin-top: 6px;
    }
  }

  .icon {
    font-size: 18px;
    cursor: pointer;
  }

  .more-icon {
    margin-top: 8px;
    margin-left: 15px;
  }
}

.del-status {
  color: var(--el-color-info);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  bottom: 1px;
}



.right-dropdown-item {
  display: flex;
  gap: 10px;
}

:deep(.el-dropdown-menu__item:last-child) {
  padding-bottom: 10px;
}

:deep(.el-dropdown-menu__item:first-child) {
  padding-top: 10px;
}

:deep(.el-dropdown-menu__item) {
  padding-right: 14px;
  padding-left: 14px;
}

.unread {
  height: 6px;
  width: 6px;
  background: var(--el-color-primary);
  margin-bottom: 2px;
  margin-right: 5px;
  border-radius: 50%;
  display: inline-block;
  justify-content: center;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

</style>
