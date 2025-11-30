<script setup lang="ts">
import { useRoute } from "vue-router";
import { onUnmounted, ref } from "vue";
import type { Quiz } from "../dataClasses/Quiz.ts";
import Loading from "../components/Loading.vue";
import QuizView from "../templates/QuizView.vue";
import NotFound from "./NotFound.vue";
import type { AnswerType } from "../dataClasses/Question.ts";
import { useNotification } from "../stores/notification.ts";
import { getQuiz } from "../networks/backend/quiz.ts";
import { router } from "../main.ts";

document.title = '答题分析 - SubQuiz';

const route = useRoute();
const id = Number(route.params.id);
const data = ref<null | Quiz<AnswerType, AnswerType, string>>(null);
const notFound = ref(false);

const notificationStore = useNotification();
let quit = false;
let notificationId = 0n;
let timeout;
function init()
{
    if (quit) return;
    getQuiz(id).then(quiz =>
    {
        if (quit) return;
        if (quiz !== null) 
        {
            // 如果 quiz 还没有结束，重定向到 quiz 页面
            if (!quiz.finished) 
            {
                router.replace('/quiz?id=' + id);
                return;
            }
            // quiz 存在且已经结束，显示分析页面
            data.value = quiz;
            notificationStore.remove(notificationId);
        }
        else 
        {
            // 如果接口成功，但 quiz 不存在，说明处于批改中，以3000ms为间隔重试
            if (notificationId === 0n)
            {
                notificationId = notificationStore.add({
                    message: '系统正在批阅试卷中...',
                    type: 'success',
                    timeout: -1,
                });
            }
            timeout = setTimeout(init, 3000);
        }
    }, () =>
    {
        notFound.value = true;
    });
}

init();

onUnmounted(() =>
{
    quit = true;
    clearTimeout(timeout);
    notificationStore.remove(notificationId);
})

</script>

<template>
    <NotFound v-if="notFound" />
    <Loading v-else-if="data === null"/>
    <QuizView v-else :ai="true" :model-value="data" :editable="false" showAnswerStatus/>
</template>

<style scoped lang="scss">
</style>