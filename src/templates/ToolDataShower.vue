<script lang="ts" setup>
import { computed, ref } from 'vue';
import { getToolData, type ToolDataInfo } from '../networks/backend/ai';
import { safeRedirect } from '../utils/redirect';
import Button from '../components/Button.vue';
import { copyToClipboard } from '../utils/utils';
import html2canvas from 'html2canvas';
import { useNotification } from '../stores/notification';

const { type, path, close, dataset, customInfo } = defineProps<{
    type?: string,
    path?: string,
    dataset?: ReturnType<typeof ref<{ [key: string]: Record<string, ToolDataInfo>; }>>,
    close?: () => void;

    customInfo?: ToolDataInfo;

    inline?: boolean;
}>();


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
    getToolData(type, path).then((data) =>
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

const iframe = ref<HTMLIFrameElement | null>(null);

const downloadImage = () =>
{
    if (!iframe.value) return;
    const iframeElement = iframe.value;
    const iframeDoc = iframeElement.contentDocument || iframeElement.contentWindow.document;
    html2canvas(iframeDoc.documentElement, {
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
            <span>{{info.value}}</span>
            <br />
            <br />
            <div style="display: flex;">
                <Button @click="close(); copyToClipboard(info.value);" style="margin-left: auto;">复制</Button>
                <Button @click="close(); safeRedirect(info.value, true);">打开</Button>
                <Button @click="close()">取消</Button>
            </div>
        </div>
        <div v-else-if="info.type === 'HTML'" style="display: inline; width: 100%;">
            <iframe :srcdoc="info.value" style="border: none; resize: vertical;" ref="iframe"></iframe>
            <Button style="margin-left: auto; right: 0;" @click="downloadImage">保存为图片</Button>
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
    max-height: 85vh;
    max-width: 85vw;
    overflow: auto;
    scrollbar-width: none;
}
.container-inline {
    padding: 10px;
    width: 100%;
    scrollbar-width: none;
    display: flex;
}

iframe {
    width: 100%;
    height: min(500px, 85vh);
    border: none;
    border-radius: 10px;
}
</style>