<script setup lang="ts">
import { ref } from 'vue';
import Card from '../../components/Card.vue';
import Button from '../../components/Button.vue';
import { imageToText } from '../../networks/backend/ai';
import LoadingIcon from 'vue-material-design-icons/Loading.vue';
import { useNotification } from '../../stores/notification';
import ArrowLeftIcon from 'vue-material-design-icons/ArrowLeft.vue';
import ContentCopyIcon from 'vue-material-design-icons/ContentCopy.vue';
const img = ref('');

function selectImage() 
{
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event) =>
    {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => 
        {
            img.value = reader.result as string;
        };
        reader.readAsDataURL(file);
    };
    input.click();
    input.remove();
}

const res = ref('');
const md = ref(false);
const loading = ref(false);

function toText(markdown: boolean) 
{
    md.value = markdown;
    loading.value = true;
    imageToText(img.value, markdown, (message) =>
    {
        res.value = res.value + message;
    }).finally(() => {
        loading.value = false;
    });
}

function copy() 
{
    if (!res.value) useNotification().addWarning('没有内容可复制');
    else useNotification().addSuccess('已复制到剪贴板');
    navigator.clipboard.writeText(res.value);   
}

</script>

<template>
    <Card class="ai-image-card">
        <img :src="img" v-if="img && !res" />
        <Button @click="selectImage" v-if="!res" :disabled="loading">
            <span v-if="!loading">{{ img ? '更换图片' : '选择图片' }}</span>
            <div class="loading-icon" v-else>
                <LoadingIcon />
            </div>
        </Button>
        <div style="display: flex;" v-if="img && !loading && !res">
            <Button @click="toText(false)">识别为纯文本</Button>
            <Button @click="toText(true)">识别为富文本</Button>
        </div>
        <div v-if="res" style="max-width: calc(min(1024px, 100%)); height: 100%;">
            <div style="display: flex; min-width: 512px;">
                <Button @click="res = ''"  style="height: 44px; width: 44px; left: 0; margin-right: auto; display: flex; align-items: center; text-align: center; justify-content: center;">
                    <ArrowLeftIcon v-if="!loading"/>
                    <div class="loading-icon" v-else>
                        <LoadingIcon />
                    </div>
                </Button>
                <h2>识别结果</h2>
                <Button @click="copy" style="height: 44px; width: 44px; right: 0; margin-left: auto; display: flex; align-items: center; text-align: center; justify-content: center;">
                    <ContentCopyIcon v-if="!loading"/>
                    <div class="loading-icon" v-else>
                        <LoadingIcon />
                    </div>
                </Button>
            </div>
            <div style="padding: 13px;" v-markdown="{ content: res, markdown: md }"/>
        </div>
    </Card>
</template>

<style lang="scss" scoped>
.ai-image-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    gap: 1rem;
    height: calc(100% - 20px);
    margin-bottom: 7px;

    img {
        max-width: 80%;
        max-height: 50%;
        object-fit: contain;
        margin-bottom: 1rem;
    }

    h1 {
        font-size: 2rem;
        margin-bottom: 0.5rem;
    }

    p {
        font-size: 1.2rem;
        text-align: center;
        max-width: 600px;
    }
}

@keyframes loading {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.loading-icon {
    width: 1.5rem;
    height: 1.5rem;
    animation: loading 1s linear infinite;
}
</style>