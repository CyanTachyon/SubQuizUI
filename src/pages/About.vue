<script setup lang="ts">
import Card from "../components/Card.vue";
import StatusButton from "../components/StatusButton.vue";
import ChevronLeftIcon from "vue-material-design-icons/ChevronLeft.vue";
import {useRouter} from "vue-router";
import {safeRedirect} from "../utils/redirect.ts";
import {type Author, getAuthorInfo} from "../networks/backend/user.ts";
import {ref} from "vue";
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

const version = environment.version

function goto(url: string)
{
    safeRedirect(url, true)
}


</script>

<template>
    <div class="main">
        <div class="button-container">
            <StatusButton class="btn" @click="goBack">
                <ChevronLeftIcon/>Go Back
            </StatusButton>
            <StatusButton class="btn" @click="gotoUpdateInfo">
                更新日志<ChevronRightIcon/>
            </StatusButton>
        </div>
        <Card class="card">
            <h1>SubQuiz</h1>
            <p>Version: {{ version }}</p>
            <p class="clickable" @click="goto(author.website)"> Author: {{ author.name }} </p>
            <p class="clickable" @click="goto(author.website)"> Website: {{ author.website }} </p>
            <p class="clickable" @click="goto(author.github)"> Github: {{ author.github }} </p>
            <p class="clickable" @click="goto('mailto:' + author.email)"> Email: {{author.email}} </p>
        </Card>
    </div>
</template>

<style scoped lang="scss">
.main {
    position: absolute;
    top: 45%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 450px;
}

.btn {
    display: flex;
    margin-left: 15px;
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

.clickable {
    cursor: pointer;
}

.button-container {
    display: flex;
    justify-content: space-between; 
}

</style>