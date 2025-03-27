import {Capacitor} from '@capacitor/core'
import {defineStore} from 'pinia'

export const useThemeStore = defineStore('theme', {
    state: () => ({
        isDark: false
    }),
    actions: {
        initialize()
        {
            if (Capacitor.getPlatform() === 'web')
            {
                const savedTheme = localStorage.getItem('theme')
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                this.isDark = savedTheme ? savedTheme === 'dark' : prefersDark
                this.applyTheme()
            }
            else
            {
                const updateTheme = () => {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                    this.isDark = prefersDark
                    this.applyTheme();
                }
                updateTheme()
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme)
            }
        },
        toggleTheme()
        {
            this.isDark = !this.isDark
            this.applyTheme()
            if (Capacitor.getPlatform() === 'web')
            {
                localStorage.setItem('theme', this.isDark ? 'dark' : 'light')
            }
        },
        applyTheme()
        {
            if (this.isDark)
            {
                document.documentElement.setAttribute('data-theme', 'dark');
            }
            else
            {
                document.documentElement.removeAttribute('data-theme');
            }
        }
    }
})