<script lang="ts" setup>
import { computed, ref, onUnmounted, onMounted, watch } from 'vue';
import { getFileInfo, getFileUrl, getToolData, parseChatUrl, type ToolDataInfo } from '../../networks/backend/ai';
import { safeRedirect } from '../../utils/redirect';
import Button from '../../components/Button.vue';
import { copyToClipboard } from '../../utils/utils';
import html2canvas from 'html2canvas';
import { useNotification } from '../../stores/notification';
import Desmos from 'desmos';
import type { ChatId } from '../../dataClasses/Ids';

const { chat, type, path, close: close_, dataset, customInfo } = defineProps<{
    chat: ChatId,

    type?: string,
    path?: string,
    dataset?: ReturnType<typeof ref<{ [key: string]: Record<string, ToolDataInfo>; }>>,
    close?: () => void;

    customInfo?: ToolDataInfo;

    inline?: boolean;
}>();

const close = () => 
{
    if (close_) close_();
};



function getData(type: string, path: string): ToolDataInfo
{
    // 如果加载过，直接返回 
    if (dataset.value[type] && dataset.value[type][path])
    {
        return dataset.value[type][path];
    }
    // 如果是null, 表示在加载中，直接返回加载中提示
    if (dataset.value[type] && dataset.value[type][path] === null)
    {
        return { type: 'TEXT', value: '资源加载中...' };
    }
    // 否则，设置为加载中状态
    dataset.value[type] = dataset.value[type] || {};
    dataset.value[type][path] = null;
    getToolData(chat, type, path).then((data) =>
    {
        dataset.value[type][path] = data;
    });
    return { type: 'TEXT', value: '资源加载中...' };
}

const info = computed(() => 
{
    if (type && path && dataset) return getData(type, path);
    return customInfo;
});

const images = computed(() => 
{
    if (info.value.type === 'IMAGE') 
    {
        return info.value.value.split('\n').map((url) => parseChatUrl(chat, url.trim())).filter((url) => url);
    }
    return [];
});

const math = computed(() => 
{
    if (info.value.type === 'MATH') 
    {
        return JSON.parse(info.value.value);
    }
    return '';
});

const fileName = ref('');
const fileUrl = ref('');
const updateFileName = async() => 
{
    if (info.value.type === 'FILE') 
    {
        const uuid = info.value.value.trim();
        fileName.value = (await getFileInfo(chat, uuid)).name;
        fileUrl.value = getFileUrl(chat, uuid, true);
    }
    else 
    {
        fileName.value = '';
        fileUrl.value = '';
    }
};
watch(() => info.value.value, updateFileName, { immediate: true });

const desmos = ref<HTMLElement | null>(null);


const updateDesmos = () =>
{
    if (!desmos.value || !math.value) return;
    const mathD = math.value;
    console.log('Desmos data:', mathD);
    const elt = desmos.value;
    const cal = Desmos.GraphingCalculator(elt, {  });
    console.log(Desmos);
    cal.setMathBounds(mathD.bounds);
    mathD.expressions?.forEach((expr: any) => 
    {
        cal.setExpression(expr);
    });
    console.log(cal)
}

onMounted(updateDesmos);

const iframe = ref<HTMLIFrameElement | null>(null);
const iframeWrapper = ref<HTMLElement | null>(null);
const isResizing = ref(false);
const iframeSize = ref({ width: '100%', height: 'min(500px, 85vh)' });

let startX = 0;
let startY = 0;
let startWidth = 0;
let startHeight = 0;

const startResize = (e: MouseEvent | TouchEvent) => 
{
    if (!iframeWrapper.value) return;
    
    isResizing.value = true;
    if (e instanceof MouseEvent) 
    {
        startX = e.clientX;
        startY = e.clientY;
    } 
    else if (e instanceof TouchEvent) 
    {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }
    
    const rect = iframeWrapper.value.getBoundingClientRect();
    startWidth = rect.width;
    startHeight = rect.height;
    
    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);
    document.addEventListener('touchmove', doResize, { passive: false });
    document.addEventListener('touchend', stopResize);
    e.preventDefault();
};

const doResize = (e: MouseEvent | TouchEvent) => 
{
    if (!isResizing.value || !iframeWrapper.value) return;

    let clientX = 0;
    let clientY = 0;

    if (e instanceof MouseEvent) 
    {
        clientX = e.clientX;
        clientY = e.clientY;
    } 
    else if (e instanceof TouchEvent) 
    {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    }

    const deltaX = clientX - startX;
    const deltaY = clientY - startY;

    const newWidth = Math.max(200, startWidth + deltaX);
    const newHeight = Math.max(150, startHeight + deltaY);
    
    iframeSize.value = {
        width: `${newWidth}px`,
        height: `${newHeight}px`
    };
};

const stopResize = () => 
{
    isResizing.value = false;
    document.removeEventListener('mousemove', doResize);
    document.removeEventListener('mouseup', stopResize);
    document.removeEventListener('touchmove', doResize);
    document.removeEventListener('touchend', stopResize);
};

onUnmounted(() => {
    document.removeEventListener('mousemove', doResize);
    document.removeEventListener('mouseup', stopResize);
    document.removeEventListener('touchmove', doResize);
    document.removeEventListener('touchend', stopResize);
});

const downloadImage = () =>
{
    if (!iframe.value) return;
    const iframeElement = iframe.value;
    const iframeDoc = iframeElement.contentDocument || iframeElement.contentWindow.document;
    const ele = iframeDoc.documentElement;
    html2canvas(ele, {
        scale: 5,
    }).then((canvas) =>
    {
        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'screenshot.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        canvas.remove();
    }).catch((e) =>
    {
        console.error('截图失败:', e);
        useNotification().addError('截图失败');
    });
}

</script>
<template>
    <div :class="{'container': !inline, 'container-inline': !!inline}">
        <div v-if="info.type === 'MARKDOWN'" v-markdown="{ content: info.value, markdown: true }" />
        <div v-else-if="info.type === 'URL'" style="padding: 10px;">
            打开外部网站:
            <br />
            <br />
            <span>{{parseChatUrl(chat, info.value)}}</span>
            <br />
            <br />
            <div style="display: flex;">
                <Button @click="close(); copyToClipboard(parseChatUrl(chat, info.value));" style="margin-left: auto;">复制</Button>
                <Button @click="close(); safeRedirect(parseChatUrl(chat, info.value), true);">打开</Button>
                <Button @click="close()">取消</Button>
            </div>
        </div>
        <div v-else-if="info.type === 'HTML' || info.type === 'PAGE'" style="display: inline; width: 100%;">
            <div class="iframe-wrapper" ref="iframeWrapper" :style="{ height: iframeSize.height }">
                <iframe 
                    :srcdoc="info.type === 'HTML' ? info.value : undefined"
                    :src="info.type === 'PAGE' ? parseChatUrl(chat, info.value) : undefined" 
                    style="border: none;" 
                    ref="iframe"
                ></iframe>
                <div class="resize-handle" @mousedown="startResize" @touchstart="startResize" :class="{ 'dragging': isResizing }"></div>
            </div>
            <Button v-if="info.value.startsWith('<!--show-download-image-->')" style="margin-left: auto; right: 0;" @click="downloadImage">截取图片</Button>
        </div>
        <div v-else-if="info.type === 'FILE'">
            <Button @click="close(); safeRedirect(fileUrl)" style="margin-left: auto; right: 0;">
                下载文件 ({{ fileName }})
            </Button>
        </div>
        <div v-else-if="info.type === 'IMAGE'">
            <div v-if="images.length > 1" class="img-set scrollbar" style="overflow-x: auto; white-space: nowrap;">
                <img v-for="(image, index) in images" :key="index" :src="image" class="img" :style="{ marginRight: index < images.length - 1 ? '10px' : '0' }" />
            </div>
            <div v-else class="img">
                <img v-if="images.length === 1" :src="images[0]" class="img" />
            </div>
        </div>
        <div v-else-if="info.type === 'MATH'" style="display: inline; width: 100%;" class="math">
            <div class="iframe-wrapper" ref="iframeWrapper" :style="{ height: iframeSize.height }">
                <div ref="desmos" style="width: 100%; height: 100%;"></div>
                <div class="resize-handle" @mousedown="startResize" @touchstart="startResize" :class="{ 'dragging': isResizing }"></div>
            </div>
        </div>
        <div v-else-if="info.value">
            {{ info.value }}
        </div>
        <span v-else>正在加载资源...</span>
    </div>
</template>
<style lang="scss" scoped>
.container {
    padding: 10px;
    scrollbar-width: none;
    width: 100%;
    height: 100%;
    overflow-y: scroll;
}
.container-inline {
    padding: 10px;
    width: 100%;
    scrollbar-width: none;
    display: flex;
}

iframe {
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 10px;
}

.iframe-wrapper {
    position: relative;
    border-radius: 10px;
    overflow: hidden;
    resize: none;
    min-width: 200px;
    min-height: 150px;
}

.resize-handle {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 20px;
    height: 20px;
    background: linear-gradient(-45deg, transparent 0%, transparent 30%, #666 30%, #666 40%, transparent 40%, transparent 60%, #666 60%, #666 70%, transparent 70%);
    cursor: nw-resize;
    z-index: 10;
}
.resize-handle.dragging {
    width: 100%;
    height: 100%;
    opacity: 0;
}

.resize-handle:hover {
    background: linear-gradient(-45deg, transparent 0%, transparent 30%, #333 30%, #333 40%, transparent 40%, transparent 60%, #333 60%, #333 70%, transparent 70%);
}

.iframe-wrapper::after {
    display: none;
}

.img {
    max-width: 100%;
    height: auto; 
    display: inline-block;
    border-radius: 10px;
}
</style>