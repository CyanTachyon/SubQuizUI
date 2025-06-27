import { ref } from 'vue';

const themeInfo = ref({
    useBlur: true,
    useGlass: true,
    theme: 'unset' as 'light' | 'dark' | 'unset',
    background: '' as string
});

const actions = {
    initialize: () =>
    {
        const savedTheme = localStorage.getItem('theme');
        const savedBlur = localStorage.getItem('theme-blur');
        const savedGlass = localStorage.getItem('theme-glass');
        const savedBackground = localStorage.getItem('background');
        themeInfo.value.theme = savedTheme === 'dark' ? 'dark' : savedTheme === 'light' ? 'light' : 'unset';
        themeInfo.value.useBlur = !(savedBlur ? savedBlur === 'off' : false);
        themeInfo.value.useGlass = !(savedGlass ? savedGlass === 'off' : false);
        themeInfo.value.background = savedBackground || '';
        actions.applyTheme();
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (localStorage.getItem('theme') === 'unset') actions.applyTheme();
        });
    },
    setTheme: (theme: 'light' | 'dark' | 'unset') =>
    {
        themeInfo.value.theme = theme;
        if (theme === 'unset') localStorage.removeItem('theme');
        else localStorage.setItem('theme', theme);
        actions.applyTheme();
    },
    setBlur: (blur: 'on' | 'off') =>
    {
        if (blur === 'off')
        {
            localStorage.setItem('theme-blur', 'off');
            themeInfo.value.useBlur = false;
        }
        else
        {
            localStorage.removeItem('theme-blur');
            themeInfo.value.useBlur = true;
        }
    },
    setGlass: (glass: 'on' | 'off') =>
    {
        if (glass === 'off')
        {
            localStorage.setItem('theme-glass', 'off');
            themeInfo.value.useGlass = false;
        }
        else
        {
            localStorage.removeItem('theme-glass');
            themeInfo.value.useGlass = true;
        }
    },
    applyTheme: () =>
    {
        if (themeInfo.value.theme === 'dark' || (themeInfo.value.theme === 'unset' && window.matchMedia('(prefers-color-scheme: dark)').matches))
            document.documentElement.setAttribute('quiz-theme', 'dark');
        else 
            document.documentElement.removeAttribute('quiz-theme');
        if (themeInfo.value.background) document.body.style.backgroundImage = `url(${themeInfo.value.background})`;
        else document.body.style.backgroundImage = '';
    },
    changeBackground: () => 
    {
        if (themeInfo.value.background)
        {
            localStorage.removeItem('background');
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
                localStorage.setItem('background', res);
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