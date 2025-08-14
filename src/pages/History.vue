<script setup lang="ts">

import Loading from "../components/Loading.vue";
import { useRoute, useRouter } from "vue-router";
import { ref } from "vue";
import type { Slice } from "../dataClasses/Slice.ts";
import type { Quiz } from "../dataClasses/Quiz.ts";
import { getQuizHistories } from "../networks/backend/quiz.ts";
import Card from "../components/Card.vue";
import Pagination from "../components/Pagination.vue";
import { pushUrl } from "../utils/utils.tsx";
import Text from "../components/Text.vue";
import Spacer from "../components/Spacer.vue";
import type { AnswerType } from "../dataClasses/Question.ts";

const route = useRoute();
const router = useRouter();
const page = ref(Number(route.query.page) || 1);
const count = 30;

document.title = '答题记录 - SubQuiz';

function getStart()
{
    return (page.value - 1) * count;
}

const data = ref(null as null | Slice<Quiz<AnswerType | null, AnswerType | null, string>>);

function gotoQuiz(q: Quiz<AnswerType | null, AnswerType | null, string>)
{
    if (q.finished) router.push('/analysis/' + q.id);
    else router.push('/quiz');
}

function durationToString(duration: number | null)
{
    if (duration === null) return '测试进行中';
    let result = '';
    if (duration >= 3600 * 1000)
    {
        result += Math.floor(duration / (3600 * 1000)) + '小时';
        duration %= 3600 * 1000;
    }
    if (duration >= 60 * 1000)
    {
        result += Math.floor(duration / (60 * 1000)) + '分钟';
        duration %= 60 * 1000;
    }
    if (duration >= 1000)
    {
        result += Math.floor(duration / 1000) + '秒';
        duration %= 1000;
    }
    if (duration > 0)
    {
        result += duration + '毫秒';
    }
    return result;
}

function startTimeToString(time: number)
{
    const date = new Date(time);
    const padZero = (num: number) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}:${padZero(date.getSeconds())}`;
}

function handlePageChange(newPage: number)
{
    if (page.value !== newPage)
    {
        pushUrl('/history', { page: newPage.toString() });
        page.value = newPage;
    }
    getQuizHistories(getStart(), count).then(value => data.value = value);
}
handlePageChange(page.value);

function getTotalPage()
{
    return Math.ceil(data.value.totalSize / count) || 1;
}
</script>

<template>
    <Loading v-if="data === null"/>
    <quiz-quizzes-container v-else>
        <Text v-if="data.list.length === 0" class="no-quizzes">暂无测试记录</Text>
        <quiz-quizzes>
            <Card v-for="q in data.list" @click="gotoQuiz(q)" :max-tilt="5">
                <p class="title">{{ startTimeToString(q.time) }}</p>
                <Spacer />
                <p>测试ID：{{ q.id }}</p>
                <p>题目数量：{{ q.sections.length }}</p>
                <p>测试状态：{{ q.finished ? '已完成' : '进行中' }}</p>
                <p>答题用时：{{ durationToString(q.duration) }}</p>
            </Card>
        </quiz-quizzes>
        <Pagination :count="getTotalPage()" :current="page" @change-page="handlePageChange"/>
    </quiz-quizzes-container>
</template>

<style scoped lang="scss">

quiz-quizzes-container {
    display: block;
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;

    .no-quizzes {
        margin: 20px auto;
    }
}

quiz-quizzes {
    display: block;
    margin: 20px 0 0 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    justify-content: start;
    overflow-y: auto;
    scrollbar-width: none;
}

quiz-card {
    padding: 15px 30px 30px 30px;
    cursor: pointer;
    max-height: 300px;
    max-width: 400px;
}

.title {
    font-size: 1.25em;
    margin-bottom: 0px;
    font-weight: bold;
}

quiz-pagination {
    width: calc(min(100%, 800px));
    margin: auto auto 20px auto;
}
</style>