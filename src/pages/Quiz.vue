<script setup lang="ts">

import Loading from "../components/Loading.vue";
import {ref, watch} from "vue";
import type {Quiz} from "../dataClasses/Quiz.ts";
import Sidebar from "../templates/sidebar/Sidebar.vue";
import {newQuiz, saveQuiz} from "../networks/backend/quiz.ts";
import {useRoute, useRouter} from "vue-router";
import QuizView from "../templates/QuizView.vue";
import StatusButton from "../components/StatusButton.vue";
import debounce from "../utils/debounce.ts";
import {useNotificationStore} from "../stores/notification.ts";

const notificationStore = useNotificationStore()
const data = ref<null | Quiz<null, number | null, null>>(null)
const route = useRoute()
const router = useRouter()
const count = Number(route.query.count) || 10;
const subject = Number(route.query.subject) || undefined;

document.title = '测试 - SubQuiz';

newQuiz(count, subject).then(quiz => data.value = quiz, router.back)

function toUserAnswer(quiz: Quiz<any, any, any>): Record<number, (number | null)[]>
{
    let a: Record<number, (number | null)[]> = {}
    quiz.sections.forEach(section => a[section.id] = section.questions.map(it => it.userAnswer))
    return a
}


let autoSaveRunning = false

const save = debounce(async function (autoSave: boolean = false)
{
    if (autoSaveRunning) return;
    autoSaveRunning = true;
    try
    {
        await saveQuiz(data.value.id, toUserAnswer(data.value), !autoSave).then(() =>
        {
            if (!autoSave) router.push('/analysis/' + data.value.id);
        })
    }
    catch (error)
    {
        if (error instanceof Error) notificationStore.add({message: `保存失败：${error.message}`, type: "warning"})
        else notificationStore.add({message: `保存失败：${error}`, type: "warning"})
    }
    finally
    {
        autoSaveRunning = false;
    }
}, 1500)

watch(data, () => save(true), {deep: true})

</script>

<template>
    <Sidebar>
        <template v-if="data === null">
            <Loading class="loading"/>
        </template>
        <template v-else>
            <QuizView :quiz="data" :editable="true"/>
            <StatusButton class="submit" @click="save">Submit</StatusButton>
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