import http from '@/axios/index.js';

export function loginUserInfo(selectedAccountId) {
    return http.get('/my/loginUserInfo', {params: selectedAccountId ? {selectedAccountId} : {}})
}

export function resetPassword(password) {
    return http.put('/my/resetPassword', {password})
}

export function userDelete() {
    return http.delete('/my/delete')
}
