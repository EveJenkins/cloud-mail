import { defineStore } from 'pinia'

export const useWriterStore = defineStore('writer', {
    state: () => ({
        sendRecipientRecord: [],
        contacts: [],
        quickPhrases: null
    }),
    persist: {
        pick: ['sendRecipientRecord', 'contacts', 'quickPhrases'],
    },
})
