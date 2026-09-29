import { defineStore } from 'pinia'
import { EmailUnreadEnum } from '@/enums/email-enum.js'

export const useEmailStore = defineStore('email', {
    state: () => ({
        deleteIds: 0,
        starScroll: null,
        emailScroll: null,
        cancelStarEmailId: 0,
        addStarEmailId: 0,
        contentData: {
            email: null,
            delType: null,
            showStar: true,
            showReply: true,
            showUnread: false
        },
        sendScroll: null,
        detailMap: {},
    }),
    persist: {
        pick: ['contentData'],
    },
    actions: {
        sameEmailIdentity(left, right) {
            if (!left || !right) return false
            if (left.emailId && right.emailId && Number(left.emailId) !== Number(right.emailId)) return false
            if ((left.accountId || right.accountId) && Number(left.accountId || 0) !== Number(right.accountId || 0)) return false
            if ((left.messageId || right.messageId) && String(left.messageId || '') !== String(right.messageId || '')) return false
            if (left.subject && right.subject && String(left.subject) !== String(right.subject)) return false
            if (left.sendEmail && right.sendEmail && String(left.sendEmail).toLowerCase() !== String(right.sendEmail).toLowerCase()) return false
            return true
        },
        clearContent() {
            this.contentData.email = null
            this.contentData.delType = null
            this.contentData.showUnread = false
        },
        fetchList(request) {
            return request(0).then(data => {
                request(1).then(fullData => {
                    const list = Array.isArray(fullData) ? fullData : fullData?.list
                    this.applyFullList(list)
                }).catch(e => {
                    console.error(e)
                })
                return data
            })
        },
        applyFullList(list) {
            if (!list?.length) return
            const currentId = this.contentData.email?.emailId
            for (const item of list) {
                if (!item?.emailId) continue
                if (!item.attList) item.attList = []
                // 完整列表可能早于「标已读」返回，避免把本地已读状态盖回未读
                const cached = this.detailMap[item.emailId]
                const prev = this.sameEmailIdentity(cached, item) ? cached : null
                const keepRead = prev?.unread === EmailUnreadEnum.READ
                    || (currentId === item.emailId && this.contentData.email?.unread === EmailUnreadEnum.READ)
                if (keepRead) {
                    item.unread = EmailUnreadEnum.READ
                }
                this.detailMap[item.emailId] = item
                if (currentId && item.emailId === currentId && this.sameEmailIdentity(this.contentData.email, item)) {
                    this.contentData.email = item
                }
            }
        },
        toContentEmail(email) {
            const id = email?.emailId
            if (id && this.detailMap[id] && this.sameEmailIdentity(email, this.detailMap[id])) {
                const detail = this.detailMap[id]
                if (detail.content || detail.text || !email?.listText) return detail
                return {
                    ...detail,
                    text: email.listText,
                }
            }
            return {
                ...email,
                emailId: id || 0,
                content: email?.content || '',
                // 完整正文异步加载期间先显示列表摘要，避免详情区短暂误报“正文为空”。
                text: email?.text || email?.listText || '',
                attList: [],
                recipient: email?.recipient || '[]',
            }
        },
        markListRead(emailId) {
            const scrolls = [this.emailScroll, this.starScroll, this.sendScroll]
            for (const scroll of scrolls) {
                const list = scroll?.emailList
                if (!list?.length) continue
                const item = list.find(e => e.emailId === emailId)
                if (item) item.unread = EmailUnreadEnum.READ
            }
        },
        markListReplied(emailId) {
            const scrolls = [this.emailScroll, this.starScroll]
            for (const scroll of scrolls) {
                const list = scroll?.emailList
                if (!list?.length) continue
                const item = list.find(e => e.emailId === emailId)
                if (item) item.hasReply = true
            }
            if (this.detailMap[emailId]) this.detailMap[emailId].hasReply = true
            if (this.contentData.email?.emailId === emailId) this.contentData.email.hasReply = true
        },
    },
})
