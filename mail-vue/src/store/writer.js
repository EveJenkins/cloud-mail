import { defineStore } from 'pinia'

export const useWriterStore = defineStore('writer', {
    state: () => ({
        sendRecipientRecord: [],
        contacts: [],
        quickPhrases: null,
        signatures: []
    }),
    persist: {
        pick: ['sendRecipientRecord', 'contacts', 'quickPhrases', 'signatures'],
    },
})
