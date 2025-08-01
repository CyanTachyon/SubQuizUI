import { ref } from 'vue';
import { storageGet, storageRemove, storageSet } from '../utils/storage';

const themeInfo = ref({
    useBlur: true,
    useGlass: true,
    theme: 'unset' as 'light' | 'dark' | 'unset',
    background: '' as string,
    isDark: false as boolean,
});

const actions = {
    initialize: async () =>
    {
        const savedTheme = await storageGet('theme');
        const savedBlur = await storageGet('theme-blur');
        const savedGlass = await storageGet('theme-glass');
        const savedBackground = await storageGet('background');
        themeInfo.value.theme = savedTheme === 'dark' ? 'dark' : savedTheme === 'light' ? 'light' : 'unset';
        themeInfo.value.useBlur = !(savedBlur ? savedBlur === 'off' : false);
        themeInfo.value.useGlass = !(savedGlass ? savedGlass === 'off' : false);
        themeInfo.value.background = savedBackground || '';
        actions.applyTheme();
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async () => {
            if (await storageGet('theme') === 'unset') actions.applyTheme();
        });
    },
    setTheme: (theme: 'light' | 'dark' | 'unset') =>
    {
        themeInfo.value.theme = theme;
        if (theme === 'unset') storageRemove('theme');
        else storageSet('theme', theme);
        actions.applyTheme();
    },
    setBlur: (blur: 'on' | 'off') =>
    {
        if (blur === 'off')
        {
            storageSet('theme-blur', 'off');
            themeInfo.value.useBlur = false;
        }
        else
        {
            storageRemove('theme-blur');
            themeInfo.value.useBlur = true;
        }
    },
    setGlass: (glass: 'on' | 'off') =>
    {
        if (glass === 'off')
        {
            storageSet('theme-glass', 'off');
            themeInfo.value.useGlass = false;
        }
        else
        {
            storageRemove('theme-glass');
            themeInfo.value.useGlass = true;
        }
    },
    applyTheme: () =>
    {
        if (themeInfo.value.theme === 'dark' || (themeInfo.value.theme === 'unset' && window.matchMedia('(prefers-color-scheme: dark)').matches))
        {
            document.documentElement.setAttribute('quiz-theme', 'dark');
            themeInfo.value.isDark = true;
        }
        else 
        {
            document.documentElement.removeAttribute('quiz-theme');
            themeInfo.value.isDark = false;
        }
        if (themeInfo.value.background) document.body.style.backgroundImage = `url(${themeInfo.value.background})`;
        else document.body.style.backgroundImage = '';
    },
    changeBackground: () => 
    {
        if (themeInfo.value.background)
        {
            storageRemove('background');
            themeInfo.value.background = '';
            actions.applyTheme();
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (event) =>
        {
            const file = (event.target as HTMLInputElement).files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () =>
            {
                const res = reader.result as string;
                storageSet('background', res);
                themeInfo.value.background = res;
                actions.applyTheme();
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }
}
export const useTheme = () => {
    return actions;
}
export const getThemes = () => {
    return themeInfo.value;
};