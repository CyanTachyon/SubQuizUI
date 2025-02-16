<script setup lang="ts">
import {useRoute} from "vue-router";
import {ref} from "vue";
import type {Quiz} from "../dataClasses/Quiz.ts";
import {getQuizAnalysis} from "../networks/backend/quiz.ts";
import Sidebar from "../templates/sidebar/Sidebar.vue";
import Loading from "../components/Loading.vue";
import QuizView from "../templates/QuizView.vue";
import NotFound from "./NotFound.vue";

const route = useRoute();
const id = Number(route.params.id);
const data = ref<null | Quiz<number, number, string>>(null)
const notFound = ref(false)

document.title = '答题分析 - SubQuiz';

getQuizAnalysis(id).then(quiz => data.value = quiz, () =>
{
    notFound.value = true;
})

</script>

<template>
    <NotFound v-if="notFound"/>
    <Sidebar v-else>
        <template v-if="data === null">
            <Loading class="loading"/>
        </template>
        <template v-else>
            <QuizView :quiz="data" :editable="false"/>
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

.submit {
    display: block;
    margin: 20px auto;
}
</style>