<script setup lang="ts">

import Sidebar from "../templates/sidebar/Sidebar.vue";
import Loading from "../components/Loading.vue";
import {useRoute, useRouter} from "vue-router";
import {ref} from "vue";
import type {Slice} from "../dataClasses/Slice.ts";
import type {Quiz} from "../dataClasses/Quiz.ts";
import {getQuizHistories} from "../networks/backend/quiz.ts";
import Card from "../components/Card.vue";
import Pagination from "../components/Pagination.vue";
import { pushUrl } from "../utils/utils.ts";
import Text from "../components/Text.vue";

const route = useRoute();
const router = useRouter();
const page = ref(Number(route.query.page) || 1);
const count = 30;

document.title = '答题记录 - SubQuiz';

function getStart()
{
    return (page.value - 1) * count;
}

const data = ref(null as null | Slice<Quiz<number | null, number | null, string>>)

function gotoQuiz(q: Quiz<number | null, number | null, string>)
{
    if (q.finished) router.push('/analysis/' + q.id)
    else router.push('/quiz')
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
    return "" + date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
}

function handlePageChange(newPage: number)
{
    if (page.value !== newPage)
    {
        pushUrl('/history', {page: newPage.toString()});
        page.value = newPage;
    }
    getQuizHistories(getStart(), count).then(value => data.value = value);
}
handlePageChange(page.value)

function getTotalPage()
{
    return Math.ceil(data.value.totalSize / count) || 1;
}
</script>

<template>
    <Sidebar>
        <template v-if="data === null">
            <Loading class="loading"/>
        </template>
        <template v-else>
            <div class="quizzes-container">
                <div class="quizzes">
                    <template v-for="q in data.list">
                        <Card class="quiz" @click="gotoQuiz(q)">
                            <p class="title">{{ startTimeToString(q.time) }}</p>
                            <Text class="spacer"/>
                            <p>测试ID：{{ q.id }}</p>
                            <p>题目数量：{{ q.sections.length }}</p>
                            <p>测试状态：{{ q.finished ? '已完成' : '进行中' }}</p>
                            <p>答题用时：{{ durationToString(q.duration) }}</p>
                        </Card>
                    </template>
                    <Text v-if="data.list.length === 0" class="no-quizzes">暂无测试记录</Text>
                </div>
                <Pagination :count="getTotalPage()" :current="page" @change-page="handlePageChange" class="pagination"/>
            </div>
        </template>
    </Sidebar>
</template>

<style scoped lang="scss">
.loading {
    position: relative;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    height: 20%;
    width: 30%;
}

.quizzes-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;

    .no-quizzes {
        margin: 20px auto;
    }
}

.quizzes {
    margin: 20px 0 0 0;
    display: grid;
    flex-grow: 1;
    grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
    justify-content: start;
    /* align-items: start; */
    /* align-content: start; */
    overflow-y: auto;
    scrollbar-width: none;
    /* justify-content:space-between */
}

.quiz {
    padding: 15px 30px 30px 30px;
    cursor: pointer;
    height: 255px;
    max-width: 400px;
}

.title {
    font-size: 1.25em;
    margin-bottom: 0px;
    font-weight: bold;
}

.spacer {
    flex-grow: 1;
    border-bottom: 1px solid rgba(0, 0, 0, 0.2);
    height: 1px;
    min-height: 1px;
    max-height: 1px;
}

.pagination {
    width: calc(min(100%, 800px));
    margin: 20px auto;
}
</style>