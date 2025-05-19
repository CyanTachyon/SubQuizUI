<script setup lang="ts">
import Card from "../components/Card.vue";
import StatusButton from "../components/StatusButton.vue";
import ChevronLeftIcon from "vue-material-design-icons/ChevronLeft.vue";
import { useRouter } from "vue-router";
import { safeRedirect } from "../utils/redirect.ts";
import { type Author, getAuthorInfo } from "../networks/backend/user.ts";
import { ref } from "vue";
import ChevronRightIcon from "vue-material-design-icons/ChevronRight.vue";
let router = useRouter();

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


</script>

<template>
    <quiz-about-main>
        <quiz-about-button-container>
            <StatusButton @click="goBack">
                <ChevronLeftIcon />Go Back
            </StatusButton>
            <StatusButton @click="gotoUpdateInfo">
                更新日志
                <ChevronRightIcon />
            </StatusButton>
        </quiz-about-button-container>
        <Card>
            <h1>SubQuiz</h1>
            <p>Version: {{ version }}</p>
            <p class="clickable" @click="goto(author.website)"> Author: {{ author.name }} </p>
            <p class="clickable" @click="goto(author.website)"> Website: {{ author.website }} </p>
            <p class="clickable" @click="goto(author.github)"> Github: {{ author.github }} </p>
            <p class="clickable" @click="goto('mailto:' + author.email)"> Email: {{ author.email }} </p>
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
    width: 500px;
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