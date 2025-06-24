import { Capacitor } from '@capacitor/core';
import { ref } from 'vue';

const isDark = ref(false);

const actions = {
    initialize: () =>
    {
        if (Capacitor.getPlatform() === 'web')
        {
            const savedTheme = localStorage.getItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            isDark.value = savedTheme ? savedTheme === 'dark' : prefersDark;
            actions.applyTheme();
        }
        else
        {
            const updateTheme = () =>
            {
                isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
                actions.applyTheme();
            };
            updateTheme();
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme);
        }
    },
    toggleTheme: () =>
    {
        isDark.value = !isDark.value;
        actions.applyTheme();
        if (Capacitor.getPlatform() === 'web')
        {
            localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
        }
    },
    applyTheme: () =>
    {
        if (isDark.value)
        {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
        else
        {
            document.documentElement.removeAttribute('data-theme');
        }
    }
}
export const useTheme = () => {
    return actions;
}