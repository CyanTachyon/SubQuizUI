<script setup lang="ts">
import Button from "../../components/Button.vue";
import { safeRedirect } from "../../utils/redirect";
import { computed, ref } from "vue";
import { FileOpener } from '@capacitor-community/file-opener';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { useNotification } from "../../stores/notification";
import type { AndroidVersion } from "../../dataClasses/AndroidVersion";
import { isAiApp } from "../../utils/utils";

const { info } = defineProps<{info: AndroidVersion;}>();
const url = computed(() => isAiApp() ? info.aiUrl : info.url);

const downloadProgress = ref(0);
const downloading = ref(false);

document.title = '下载新版本 - SubQuiz';

const download = async () => {
    try {
        downloading.value = true;
        const fileName = `subquiz_${info.version}.apk`;
        const updateProgress = (progress) => {
            downloadProgress.value = progress;
        };
        
        await Filesystem.addListener('progress', (progress) => {
            updateProgress(progress.bytes / progress.contentLength);
        });

        const download = Filesystem.downloadFile({
            url: url.value,
            path: fileName,
            directory: Directory.Cache,
            progress: true,
        });

        useNotification().addSuccess("开始下载");

        const result = await download;
        
        useNotification().addSuccess("下载完成");

        try 
        {
            await FileOpener.open({
                filePath: result.path,
                contentType: 'application/vnd.android.package-archive',
            });
        }
        catch(e)
        {
            if (e.stack) useNotification().addError(e.stack);
            else useNotification().addError(e);
        }
        
        downloading.value = false;
    } 
    catch (error) 
    {
        console.error('下载或安装APK出错:', error);
        useNotification().addError('下载或安装APK出错, 将使用浏览器打开链接...');
        setTimeout(() => safeRedirect(url.value), 2000);
        downloading.value = false;
    }
}
</script>
<template>
    <quiz-main>
        <quiz-card>
            <h1>新版本可用</h1>
            <p>Version: {{ info.version }}</p>
            <Button class="btn" @click="download" :disabled="downloading"> 
                {{ downloading ? `下载中... ${(downloadProgress * 100).toFixed(1)}%` : '下载更新' }} 
            </Button>
            <quiz-progress v-if="downloading">
                <quiz-progress-bar :style="{ width: (downloadProgress * 100) + '%' }"/>
            </quiz-progress>
        </quiz-card>
    </quiz-main>  
</template>

<style scoped lang="scss">
quiz-main {
    display: block;
    position: absolute;
    top: 45%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    --transition: 'static';
}

.btn {
    margin-left: 0;
}

quiz-card {
    height: fit-content;
    padding: 10px 30px;
    margin-left: 15px;
}

h1 {
    font-size: 2em;
    margin-bottom: 20px;
}

quiz-progress {
    height: 5px;
    width: 100%;
    display: block;
    border-radius: 3px;
    overflow: hidden;
    quiz-progress-bar {
        height: 100%;
        display: block;
        background-color: #8cd1f0;
    }
}
</style>