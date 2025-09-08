import { ref } from 'vue';
import { storageGet, storageRemove, storageSet } from '../utils/storage';

const themeInfo = ref({
    useBlur: true,
    useGlass: true,
    useSolidColor: false,
    theme: 'unset' as 'light' | 'dark' | 'unset',
    background: '' as string,
    isDark: false as boolean,
    backgroundBlur: 0 as number,
    backgroundOverlay: {
        enabled: false,
        color: '#000000',
        opacity: 0.3
    } as { enabled: boolean; color: string; opacity: number; },
});

const actions = {
    initialize: async () =>
    {
        const savedTheme = await storageGet('theme');
        const savedBlur = await storageGet('theme-blur');
        const savedGlass = await storageGet('theme-glass');
        const savedBackground = await storageGet('background');
        const savedSolidColor = await storageGet('theme-solid-color');
        const savedBackgroundBlur = await storageGet('background-blur');
        const savedBackgroundOverlay = await storageGet('background-overlay');
        themeInfo.value.theme = savedTheme === 'dark' ? 'dark' : savedTheme === 'light' ? 'light' : 'unset';
        themeInfo.value.useBlur = (savedBlur ? savedBlur !== 'off' : true);
        themeInfo.value.useGlass = (savedGlass ? savedGlass !== 'off' : true);
        themeInfo.value.background = savedBackground || '';
        themeInfo.value.useSolidColor = (savedSolidColor ? savedSolidColor === 'on' : false);
        themeInfo.value.backgroundBlur = savedBackgroundBlur ? Number(savedBackgroundBlur) : 20;
        if (savedBackgroundOverlay)
        {
            try
            {
                themeInfo.value.backgroundOverlay = JSON.parse(savedBackgroundOverlay);
            } 
            catch
            {
                themeInfo.value.backgroundOverlay = { enabled: false, color: '#000000', opacity: 0.3 };
            }
        }
        actions.applyTheme();
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async () => 
        {
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
        actions.applyTheme();
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
        actions.applyTheme();
    },
    setSolidColor: (solidColor: 'on' | 'off') =>
    {
        if (solidColor === 'off')
        {
            storageRemove('theme-solid-color');
            themeInfo.value.useSolidColor = false;
        }
        else
        {
            storageSet('theme-solid-color', 'on');
            themeInfo.value.useSolidColor = true;
        }
        actions.applyTheme();
    },
    applyTheme: () =>
    {
        if (themeInfo.value.theme === 'dark' || (themeInfo.value.theme === 'unset' && window.matchMedia('(prefers-color-scheme: dark)').matches))
        {
            document.documentElement.setAttribute('quiz-theme', 'dark');
            document.documentElement.classList.add('dark');
            themeInfo.value.isDark = true;
        }
        else 
        {
            document.documentElement.removeAttribute('quiz-theme');
            document.documentElement.classList.remove('dark');
            themeInfo.value.isDark = false;
        }
        if (themeInfo.value.useSolidColor) document.documentElement.setAttribute('quiz-solid-color', 'true');
        else document.documentElement.removeAttribute('quiz-solid-color');
        if (themeInfo.value.background === '#') 
        {
            if (themeInfo.value.isDark)
                document.body.style.backgroundColor = '#151517';
            else
                document.body.style.backgroundColor = '#B9BABB';
            document.body.style.backgroundImage = 'none';
            document.body.style.removeProperty('--background-blur');
            document.body.classList.remove('has-background-blur');
            document.body.style.removeProperty('--background-overlay');
            document.body.classList.remove('has-background-overlay');
        }
        else
        {
            if (themeInfo.value.background)
            {
                document.body.style.backgroundImage = `url(${themeInfo.value.background})`;
            }
            else
            {
                document.body.style.backgroundImage = '';
            }

            if (themeInfo.value.backgroundBlur > 0)
            {
                document.body.style.setProperty('--background-blur', `${themeInfo.value.backgroundBlur}px`);
                document.body.classList.add('has-background-blur');
            }
            else
            {
                document.body.style.removeProperty('--background-blur');
                document.body.classList.remove('has-background-blur');
            }

            // 应用颜色叠加
            if (themeInfo.value.backgroundOverlay.enabled)
            {
                const overlayColor = themeInfo.value.backgroundOverlay.color;
                const overlayOpacity = themeInfo.value.backgroundOverlay.opacity;
                const rgba = hexToRgba(overlayColor, overlayOpacity);
                document.body.style.setProperty('--background-overlay', rgba);
                document.body.classList.add('has-background-overlay');
            } else
            {
                document.body.style.removeProperty('--background-overlay');
                document.body.classList.remove('has-background-overlay');
            }
        }
    },
    setBackground: (url: string | undefined) =>
    {
        if (url)
        {
            storageSet('background', url);
            themeInfo.value.background = url;
        }
        else
        {
            storageRemove('background');
            themeInfo.value.background = '';
        }
        actions.applyTheme();
    },
    chooseBackground: () => 
    {
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
                actions.setBackground(res);
            };
            reader.readAsDataURL(file);
        };
        input.click();
    },
    setBackgroundBlur: (blur: number) =>
    {
        themeInfo.value.backgroundBlur = Math.max(0, Math.min(25, blur));
        storageSet('background-blur', String(themeInfo.value.backgroundBlur));
        actions.applyTheme();
    },
    setBackgroundOverlay: (overlay: { enabled: boolean; color: string; opacity: number; }) =>
    {
        themeInfo.value.backgroundOverlay = {
            enabled: overlay.enabled,
            color: overlay.color,
            opacity: Math.max(0, Math.min(1, overlay.opacity))
        };
        storageSet('background-overlay', JSON.stringify(themeInfo.value.backgroundOverlay));
        actions.applyTheme();
    }
};

// 辅助函数：将十六进制颜色转换为 RGBA
function hexToRgba(hex: string, alpha: number): string
{
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const useTheme = () =>
{
    return actions;
};
export const getThemes = () =>
{
    return themeInfo.value;
};