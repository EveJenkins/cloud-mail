import http from '@/axios/index.js';

export function emailList(accountId, emailId, timeSort, size, type, full, deleted = 0) {
    return http.get('/email/list', {params: {accountId, emailId, timeSort, size, type, full, deleted}})
}

export function emailThread(emailId) {
    return http.get('/email/thread', {params: {emailId}, noMsg: true})
}

export function emailDelete(emailIds) {
    return http.delete('/email/delete?emailIds=' + emailIds)
}

export function emailRestore(emailIds, accountId) {
    return http.put('/email/restore', {emailIds, accountId})
}

export function emailLatest(emailId, accountId) {
    return http.get('/email/latest', {params: {emailId, accountId}, noMsg: true, timeout: 35 * 1000})
}

export function emailRead(emailIds) {
    return http.put('/email/read', {emailIds})
}

export function emailSend(form,progress) {
    return http.post('/email/send', form,{
        onUploadProgress: (e) => {
            progress(e)
        },
        noMsg: true
    })
}

export function emailAiReply(emailId, tone, language, variant = false) {
    return http.post('/email/aiReply', {emailId, tone, language, variant}, {noMsg: true, timeout: 45 * 1000})
}

export function emailAiCompose(content, task, language) {
    return http.post('/email/aiCompose', {content, task, language}, {noMsg: true, timeout: 45 * 1000})
}
