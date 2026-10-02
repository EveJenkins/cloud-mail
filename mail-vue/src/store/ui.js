import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
    state: () => ({
        asideShow: !window.matchMedia('(max-width: 767px)').matches,
        accountShow: false,
        backgroundLoading: true,
        changeNotice: 0,
        writerRef: null,
        composeOpen: false,
        changePreview: 0,
        previewData: {},
        key: 0,
        dark: false,
        asideCount: {
            email: 0,
            send: 0,
            sysEmail: 0
        }
    }),
    actions: {
        showNotice() {
            this.changeNotice ++
        },
        previewNotice(data) {
            this.previewData = data
            this.changePreview ++
        }
    },
    persist: {
        pick: ['accountShow','dark'],
    },
})
