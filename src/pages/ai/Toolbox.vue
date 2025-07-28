<script setup lang="ts">
import { useRouter } from "vue-router";
import Card from "../../components/Card.vue";
import { ChatBubbleLeftRightIcon, LanguageIcon, PhotoIcon } from "@heroicons/vue/16/solid";

const router = useRouter();
</script>

<template>
    <Card class="toolbox">
        <h1>SubQuiz AI 工具箱</h1>
        <p>这里是一些 AI 相关的工具和功能。</p>
        <div class="tools">
            <Card class="tool" :max-tilt="10" @click="router.push('/ai/chat')">
                <ChatBubbleLeftRightIcon style="height: 40px; width: 40px;"/>
                <span>AI 答疑</span>
            </Card>
            <Card class="tool" :max-tilt="10" @click="router.push('/ai/translate')">
                <LanguageIcon style="height: 40px; width: 40px;"/>
                <span>AI 翻译</span>
            </Card>
            <Card class="tool" :max-tilt="10" @click="router.push('/ai/image')">
                <PhotoIcon style="height: 40px; width: 40px;"/>
                <span>文字识别</span>
            </Card>
        </div>
    </Card>
</template>

<style lang="scss" scoped>
.toolbox {
    height: calc(100% - 20px);
    margin-bottom: 7px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    gap: 1rem;

    h1 {
        font-size: 2rem;
        margin-bottom: 0.5rem;
    }

    p {
        font-size: 1.2rem;
        text-align: center;
        max-width: 600px;
    }

    .tools {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        justify-content: center;

        .tool {
            cursor: pointer;
            width: 200px;
            height: 150px;
            display: flex;
            gap: 1rem;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
    }
}
</style>