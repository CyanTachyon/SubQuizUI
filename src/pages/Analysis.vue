<script setup lang="ts">
import { useRoute } from "vue-router";
import { onUnmounted, ref } from "vue";
import type { Quiz } from "../dataClasses/Quiz.ts";
import { getQuizAnalysis } from "../networks/backend/quiz.ts";
import Loading from "../components/Loading.vue";
import QuizView from "../templates/QuizView.vue";
import NotFound from "./NotFound.vue";
import type { AnswerType } from "../dataClasses/Question.ts";
import { useNotification } from "../stores/notification.ts";

const route = useRoute();
const id = Number(route.params.id);
const data = ref<null | Quiz<AnswerType, AnswerType, string>>(null);
const notFound = ref(false);

document.title = '答题分析 - SubQuiz';

const notificationStore = useNotification();
let quit = false;
let notificationId = 0n;
let timeout = 0;
function init()
{
    if (quit) return;
    getQuizAnalysis(id).then(quiz =>
    {
        if (quit) return;
        if (quiz !== null) 
        {
            data.value = quiz;
            notificationStore.remove(notificationId);
        }
        else 
        {
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
    <QuizView v-else :ai="true" :quiz="data" :editable="false" />
</template>

<style scoped lang="scss">
quiz-loading {
    position: relative;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    height: 20%;
    width: 30%;
}
</style>