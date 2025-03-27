<script setup lang="ts">
import { Capacitor } from "@capacitor/core";
import CommonButton from "../../components/CommonButton.vue";
import { safeRedirect } from "../../utils/redirect";
import { ref } from "vue";
import { FileOpener } from '@capacitor-community/file-opener';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { useNotificationStore } from "../../stores/notification";
import { isLagcyAndroidApp } from "../../utils/utils";
import type { AndroidVersion } from "../../dataClasses/AndroidVersion";

const { info } = defineProps<{info: AndroidVersion;}>();

const downloadProgress = ref("0%");
const downloading = ref(false);

document.title = '下载新版本 - SubQuiz';

const download = async () => {
    if (Capacitor.getPlatform() !== 'android' || isLagcyAndroidApp())
    {
        safeRedirect(info.url);
        return;
    }

    try {
        downloading.value = true;
        const fileName = `subquiz_${info.version}.apk`;
        const updateProgress = (progress) => {
            downloadProgress.value = `${(progress * 100).toFixed(1)}%`;
        };
        
        await Filesystem.addListener('progress', (progress) => {
            updateProgress(progress.bytes / progress.contentLength);
        });

        const download = Filesystem.downloadFile({
            url: info.url,
            path: fileName,
            directory: Directory.Cache,
            progress: true,
        });

        useNotificationStore().addSuccess("开始下载");

        const result = await download;
        
        useNotificationStore().addSuccess("下载完成");

        try 
        {
            await FileOpener.open({
                filePath: result.path,
                contentType: 'application/vnd.android.package-archive',
            });
        }
        catch(e)
        {
            if (e.stack) useNotificationStore().addError(e.stack);
            else useNotificationStore().addError(e);
        }
        
        downloading.value = false;
    } 
    catch (error) 
    {
        console.error('下载或安装APK出错:', error);
        useNotificationStore().addError('下载或安装APK出错, 将使用浏览器打开链接...');
        setTimeout(() => {
            safeRedirect(info.url);
        }, 2000);
        downloading.value = false;
    }
}
</script>
<template>
   <div class="main">
        <Card class="card">
            <h1>新版本可用</h1>
            <p>Version: {{ info.version }}</p>
            <CommonButton class="btn" @click="download" :disabled="downloading"> 
                {{ downloading ? `下载中... ${downloadProgress}` : '下载更新' }} 
            </CommonButton>
        </Card>
    </div>  
</template>

<style scoped lang="scss">
.main {
    position: absolute;
    top: 45%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    --transition:static;
}

.btn {
    margin-left: 0;
}

.card {
    height: fit-content;
    padding: 10px 30px;
    margin-left: 15px;
}

h1 {
    font-size: 2em;
    margin-bottom: 20px;
}
</style>