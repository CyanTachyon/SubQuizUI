<script setup lang="tsx">
import { useTheme, getThemes } from '../stores/theme';
import Button from '../components/Button.vue';
import Switch from '../components/Switch.vue';
import Text from '../components/Text.vue';
import Card from '../components/Card.vue';
import Night from 'vue-material-design-icons/WeatherNight.vue';
import Sun from 'vue-material-design-icons/WeatherSunny.vue';
import Auto from 'vue-material-design-icons/Autorenew.vue';
import { useNotification } from '../stores/notification';
import { Capacitor } from '@capacitor/core';
import { ref } from 'vue';
import Input from '../components/Input.vue';
import Slider from '../components/Slider.vue';
import debounce from '../utils/debounce';
import currentVersion from '../../public/android_latest.json';
import { checkUpdate, CheckUpdateReason } from '../utils/utils';
import { storageGet, storageSet } from '../utils/storage';

document.title = '设置 - SubQuiz';

function isBackdropFilterSupported()
{
    if (typeof CSS !== 'undefined' && CSS.supports)
        return (CSS.supports('backdrop-filter', 'blur(15px)') || CSS.supports('-webkit-backdrop-filter', 'blur(15px)'));
    const testEl = document.createElement('div');
    (testEl.style as any).backdropFilter = 'blur(15px)';
    (testEl.style as any).webkitBackdropFilter = 'blur(15px)';
    return !!(testEl.style as any).backdropFilter || !!(testEl.style as any).webkitBackdropFilter;
}

function isUrlFilterSupported()
{
    if (typeof CSS !== 'undefined' && CSS.supports) return CSS.supports('filter', 'url("#test")');
    const svgNS = 'http://www.w3.org/2000/svg';
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.width = '0';
    container.style.height = '0';
    container.style.overflow = 'hidden';
    const svg = document.createElementNS(svgNS, 'svg');
    const filter = document.createElementNS(svgNS, 'filter');
    filter.setAttribute('id', 'test-filter-detection');
    svg.appendChild(filter);
    container.appendChild(svg);
    const testEl = document.createElement('div');
    testEl.style.filter = 'url("#test-filter-detection")';
    document.body.appendChild(container);
    document.body.appendChild(testEl);
    const isSupported = !!testEl.style.filter && getComputedStyle(testEl).filter.includes('url');
    document.body.removeChild(container);
    document.body.removeChild(testEl);
    return isSupported;
}

const theme = useTheme();
const notification = useNotification();

const themeOptions = [
    { value: 'light', label: '浅色模式', icon: Sun },
    { value: 'dark', label: '深色模式', icon: Night },
    { value: 'unset', label: '跟随系统', icon: Auto }
] as const;

const handleThemeChange = (newTheme: 'light' | 'dark' | 'unset') =>
{
    theme.setTheme(newTheme);
};

const handleBlurToggle = () =>
{
    theme.setBlur(getThemes().useBlur ? 'off' : 'on');
    if (!getThemes().useBlur) theme.setGlass('off');
    if (getThemes().useBlur) theme.setSolidColor('off');
    if (getThemes().useBlur && !isBackdropFilterSupported())
    {
        if (Capacitor.getPlatform() === 'web')
            notification.addError('您的浏览器可能不支持模糊效果，请使用支持的浏览器。');
        else
            notification.addError('您的设备过旧，可能不支持模糊效果');
    }
};

const handleGlassToggle = () =>
{
    theme.setGlass(getThemes().useGlass ? 'off' : 'on');
    if (getThemes().useGlass) theme.setBlur('on');
    if (getThemes().useGlass) theme.setSolidColor('off');
    if (getThemes().useGlass && !isUrlFilterSupported())
    {
        if (Capacitor.getPlatform() === 'web')
            notification.addError('您的浏览器可能不支持玻璃效果，请使用支持的浏览器。');
        else
            notification.addError('您的设备过旧，可能不支持玻璃效果');
    }
};

const handleSolidColorToggle = () =>
{
    theme.setSolidColor(getThemes().useSolidColor ? 'off' : 'on');
    if (getThemes().useSolidColor) 
    {
        theme.setBlur('off');
        theme.setGlass('off');
    }
}

// 背景增强设置相关函数
const handleBackgroundBlurChange = (blur: number) => {
    theme.setBackgroundBlur(blur);
};

const handleOverlayToggle = () => {
    const currentOverlay = getThemes().backgroundOverlay;
    theme.setBackgroundOverlay({
        ...currentOverlay,
        enabled: !currentOverlay.enabled
    });
};

const handleOverlayColorChange = (color: string) => {
    const currentOverlay = getThemes().backgroundOverlay;
    theme.setBackgroundOverlay({
        ...currentOverlay,
        color: color
    });
};

const handleOverlayOpacityChange = (opacity: number) => {
    const currentOverlay = getThemes().backgroundOverlay;
    theme.setBackgroundOverlay({
        ...currentOverlay,
        opacity: opacity / 100
    });
};

// 检查是否为非纯色背景
const isCustomBackground = () => {
    return !getThemes().useSolidColor;
};

const scale = ref(1);
(async () => {
    scale.value = Number(await storageGet('scale')) || (Capacitor.getPlatform() === 'web' ? 1 : 0.8);
})();
const setScale = debounce((newScale: number) =>
{
    storageSet('scale', String(newScale));
    useNotification().addSuccess(`页面缩放已设置, ${Capacitor.getPlatform() === 'web' ? '刷新页面以应用更改。' : '请重启应用以应用更改。'}`);
}, 500);
const handleScaleChange = (newScale: number) =>
{
    if (!newScale) return;
    scale.value = newScale;
    if (newScale < 0.5 || newScale > 2.5) return;
    setScale(newScale);
};

</script>

<template>
    <div class="theme-page">
        <div class="theme-container">
            <Text>
                <h1 class="page-title">主题设置</h1>
            </Text>

            <!-- 主题选择 -->
            <Card style="padding: 10px 20px 20px 20px">
                <Text>
                    <h2 class="section-title">外观主题</h2>
                </Text>
                <div class="theme-options">
                    <Button v-for="option in themeOptions" :key="option.value" class="theme-option"
                        :down="getThemes().theme === option.value" @click="handleThemeChange(option.value)">
                        <component :is="option.icon" :size="50"></component>
                        <Text>
                            <span class="theme-label">{{ option.label }}</span>
                        </Text>
                    </Button>
                </div>
            </Card>

            <!-- 视觉效果 -->
            <Card style="padding: 10px 20px 20px 20px">
                <Text>
                    <h2 class="section-title">视觉效果</h2>
                </Text>

                <div class="effect-item">
                    <div class="effect-info">
                        <Text>
                            <div class="effect-name">模糊效果</div>
                            <div class="effect-description">启用背景模糊效果</div>
                        </Text>
                    </div>
                    <Switch :on="getThemes().useBlur" :onClick="handleBlurToggle" />
                </div>

                <div class="effect-item">
                    <div class="effect-info">
                        <Text>
                            <div class="effect-name">玻璃效果</div>
                            <div class="effect-description">启用玻璃扭曲效果</div>
                        </Text>
                    </div>
                    <Switch :on="getThemes().useGlass" :onClick="handleGlassToggle" />
                </div>

                <div class="effect-item">
                    <div class="effect-info">
                        <Text>
                            <div class="effect-name">扁平风格</div>
                            <div class="effect-description">启用扁平风格</div>
                        </Text>
                    </div>
                    <Switch :on="getThemes().useSolidColor" :onClick="handleSolidColorToggle" />
                </div>
            </Card>

            <Card style="padding: 10px 20px 20px 20px">
                <Text>
                    <h2 class="section-title">背景设置</h2>
                </Text>

                <div class="background-section">
                    <Text>
                        <p class="background-description">
                            {{ getThemes().background ? getThemes().background === '#' ? '当前使用纯色背景' : '当前使用自定义背景' : '当前使用默认背景' }}
                        </p>
                    </Text>

                    <div class="background-actions">
                        <Button @click="theme.setBackground('')">
                            使用默认背景
                        </Button>
                        <Button @click="theme.setBackground('#')">
                            使用纯色背景
                        </Button>
                        <Button @click="theme.chooseBackground()">
                            选择自定义背景
                        </Button>
                    </div>
                </div>
            </Card>

            <!-- 背景增强设置 -->
            <Card style="padding: 10px 20px 20px 20px" v-if="isCustomBackground()">
                <Text>
                    <h2 class="section-title">背景增强</h2>
                </Text>

                <!-- 背景模糊 -->
                <div class="effect-item">
                    <div class="effect-info">
                        <Text>
                            <div class="effect-name">背景模糊</div>
                            <div class="effect-description">为背景图片添加模糊效果</div>
                        </Text>
                    </div>
                    <div class="blur-controls">
                        <Input 
                            type="number" 
                            :modelValue="getThemes().backgroundBlur" 
                            @update:modelValue="handleBackgroundBlurChange"
                            style="width: 80px; margin-right: 10px;"
                        />
                        <Slider 
                            :minValue="0" 
                            :maxValue="25" 
                            :step="0.5"
                            :modelValue="getThemes().backgroundBlur" 
                            @update:modelValue="handleBackgroundBlurChange"
                            style="width: 150px;"
                        />
                    </div>
                </div>

                <!-- 颜色叠加 -->
                <div class="effect-item">
                    <div class="effect-info">
                        <Text>
                            <div class="effect-name">颜色叠加</div>
                            <div class="effect-description">在背景上添加颜色叠加层</div>
                        </Text>
                    </div>
                    <Switch :on="getThemes().backgroundOverlay.enabled" :onClick="handleOverlayToggle" />
                </div>

                <!-- 叠加颜色设置 -->
                <div class="effect-item" v-if="getThemes().backgroundOverlay.enabled">
                    <div class="effect-info">
                        <Text>
                            <div class="effect-name">叠加颜色</div>
                            <div class="effect-description">选择叠加层的颜色</div>
                        </Text>
                    </div>
                    <div class="color-picker-container">
                        <input 
                            type="color" 
                            :value="getThemes().backgroundOverlay.color"
                            @input="(e) => handleOverlayColorChange((e.target as HTMLInputElement).value)"
                            class="color-input"
                        />
                    </div>
                </div>

                <!-- 叠加透明度设置 -->
                <div class="effect-item" v-if="getThemes().backgroundOverlay.enabled">
                    <div class="effect-info">
                        <Text>
                            <div class="effect-name">叠加透明度</div>
                            <div class="effect-description">调整叠加层的透明度</div>
                        </Text>
                    </div>
                    <div class="opacity-controls">
                        <Input 
                            type="number" 
                            :modelValue="Math.round(getThemes().backgroundOverlay.opacity * 100)" 
                            @update:modelValue="handleOverlayOpacityChange"
                            :min="0"
                            :max="100"
                            style="width: 80px; margin-right: 10px;"
                        />
                        <Slider 
                            :minValue="0" 
                            :maxValue="100" 
                            :step="1"
                            :modelValue="getThemes().backgroundOverlay.opacity * 100" 
                            @update:modelValue="handleOverlayOpacityChange"
                            style="width: 150px;"
                        />
                    </div>
                </div>
            </Card>

            <Card style="padding: 10px 20px 20px 20px">
                <Text>
                    <h2 class="section-title">缩放控制</h2>
                </Text>

                <div class="background-section">
                    <Text>
                        <p class="background-description">
                            调整页面缩放
                        </p>
                    </Text>

                    <div class="background-actions">
                        <div style="width: calc(min(300px, 100%));">
                            <Input style="width: calc(100% - 20px);" type="number" :modelValue="~~(scale * 100)"
                                @update:modelValue="s => handleScaleChange(Number(s) / 100)" />
                            <Slider style="width: calc(100% - 20px);" :minValue="0.5" :maxValue="2.5" :step="0.01"
                                :modelValue="scale" @update:modelValue="handleScaleChange" />
                        </div>
                    </div>
                </div>
            </Card>

            <Card style="padding: 10px 20px 20px 20px" v-if="Capacitor.getPlatform() === 'android'">
                <Text>
                    <h2 class="section-title">检查更新</h2>
                </Text>

                <div class="background-section">
                    <Text>
                        <p class="background-description">
                            当前版本：{{ currentVersion.version }} (ID: {{ currentVersion.versionCode }})<br>
                        </p>
                    </Text>

                    <div class="background-actions">
                        <Button :onClick="() => checkUpdate(CheckUpdateReason.USER_ACTIVATED)">
                            检查更新
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    </div>
</template>

<style scoped lang="scss">
.theme-page {
    min-height: 100%;
    height: 100%;
    width: 100%;
    padding: 20px;
    display: flex;
    justify-content: center;
    overflow-y: auto;
    scrollbar-width: none;
}

.theme-container {
    max-width: 800px;
    width: 100%;
    height: fit-content;
}

.page-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--primary-text);
    margin-bottom: 2rem;
    text-align: center;
}

.section-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--primary-text);
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: 13px;
}

.theme-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
}

.theme-option {
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    max-width: 100%;
}

.theme-label {
    font-size: 1rem;
   
    color: var(--primary-text);
    text-align: center;
}

.effect-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid var(--glass-card-border);
    margin-left: 13px;
    margin-right: 13px;

    &:last-child {
        border-bottom: none;
    }
}

.effect-info {
    flex: 1;
}

.effect-name {
    font-size: 1.1rem;
   
    color: var(--primary-text);
    margin-bottom: 4px;
}

.effect-description {
    font-size: 0.9rem;
    color: var(--secondary-text);
}

.background-section {
    text-align: center;
}

.background-description {
    font-size: 1rem;
    color: var(--secondary-text);
    margin-bottom: 20px;
}

.background-actions {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.blur-controls,
.opacity-controls {
    display: flex;
    align-items: center;
    gap: 10px;
}

.color-picker-container {
    display: flex;
    align-items: center;
}

.color-input {
    width: 50px;
    height: 35px;
    border: 2px solid var(--glass-card-border);
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
    transition: border-color 0.2s ease;
}

.color-input:hover {
    border-color: var(--primary-color);
}
</style>