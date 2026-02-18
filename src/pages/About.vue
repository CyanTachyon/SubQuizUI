<script setup lang="ts">
import Card from "../components/Card.vue";
import Button from "../components/Button.vue";
import ChevronLeftIcon from "vue-material-design-icons/ChevronLeft.vue";
import { useRouter } from "vue-router";
import { safeRedirect } from "../utils/redirect.ts";
import { type Author, getAuthorInfo } from "../networks/backend/user.ts";
import { ref } from "vue";
import ChevronRightIcon from "vue-material-design-icons/ChevronRight.vue";
import { isAiApp } from "../utils/utils.tsx";
import type { AndroidVersion } from "../dataClasses/AndroidVersion.ts";
import { useNotification } from "../stores/notification.ts";

document.title = '关于 - SubQuiz';

const router = useRouter();

const author = ref({
    name: 'unknown',
    email: 'unknown',
    website: 'unknown',
    github: 'unknown',
} as Author);

getAuthorInfo().then(info => author.value = info);

document.title = '关于 - SubQuiz';

function goBack()
{
    router.back();
}

function gotoUpdateInfo()
{
    router.push('/update-info');
}

const version = environment.version;

function goto(url: string)
{
    safeRedirect(url, true);
}

async function downloadApk(ai: boolean)
{
    try
    {
        let r1 = await fetch(environment.frontend + '/android_latest.json' + `?timestamp=${Date.now()}`, { cache: "reload", });
        let res = (await r1.json()) as AndroidVersion;
        let url = ai ? res.aiUrl : res.url;
        console.log(url);
        safeRedirect(url, true);
    }
    catch (e)
    {
        console.error(e);
        useNotification().addError("无法获取APK信息");
    }
}

</script>

<template>
    <quiz-about-main>
        <quiz-about-button-container>
            <Button @click="goBack">
                <ChevronLeftIcon />Go Back
            </Button>
            <Button @click="gotoUpdateInfo">
                更新日志
                <ChevronRightIcon />
            </Button>
        </quiz-about-button-container>
        <Card :max-tilt="5">
            <h1 v-if="!isAiApp()" style="font-style: italic;">SubQuiz</h1>
            <h1 v-else style="font-style: italic;">SubQuizAI</h1>
            <p>Version: {{ version }}</p>
            <p class="clickable" @click="goto(author.website)"> Author: {{ author.name }} </p>
            <p class="clickable" @click="goto(author.website)"> Website: {{ author.website }} </p>
            <p class="clickable" @click="goto(author.github)"> Github: {{ author.github }} </p>
            <p class="clickable" @click="goto('mailto:' + author.email)"> Email: {{ author.email }} </p>
            <div style="display: flex; gap: 15px;">
                <Button @click="downloadApk(false)">
                    下载SubQuiz.apk
                </Button>
                <Button @click="downloadApk(true)">
                    下载SubQuizAI.apk
                </Button>
            </div>
        </Card>
    </quiz-about-main>
</template>

<style scoped lang="scss">
quiz-about-main {
    display: block;
    position: absolute;
    top: 45%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 550px;
}
quiz-about-main * {
    font-family: 'Maple Mono NF CN';
}

quiz-button {
    display: flex;
    margin-left: 15px;
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

.clickable {
    cursor: pointer;
}

quiz-about-button-container {
    display: flex;
    justify-content: space-between;
}
</style>