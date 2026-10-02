import { defineStore } from 'pinia'

export const useAccountStore = defineStore('account', {
    state: () => ({
        currentAccountId: 0,
        currentAccount: {},
        preferredAccountId: 0,
        changeUserAccountName: ''
    }),
    actions: {
        selectAccount(account) {
            this.currentAccountId = account.accountId
            this.currentAccount = account
            this.preferredAccountId = account.accountId
        }
    },
    persist: {
        pick: ['preferredAccountId'],
    },
})
