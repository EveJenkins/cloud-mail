import { defineStore } from 'pinia'

export const useWriterStore = defineStore('writer', {
    state: () => ({
        sendRecipientRecord: [],
        contacts: []
    }),
    persist: {
        pick: ['sendRecipientRecord', 'contacts'],
    },
})
