<script setup lang="ts">

import Loading from "../components/Loading.vue";
import { ref, watch } from "vue";
import type { Quiz } from "../dataClasses/Quiz.ts";
import { newQuiz, saveQuiz } from "../networks/backend/quiz.ts";
import { useRoute, useRouter } from "vue-router";
import QuizView from "../templates/QuizView.vue";
import debounce from "../utils/debounce.ts";
import { useNotificationStore } from "../stores/notification.ts";
import type { AnswerType } from "../dataClasses/Question.ts";
import type { KnowledgePointId } from "../dataClasses/Ids.ts";

const notificationStore = useNotificationStore();
const data = ref<null | Quiz<null, AnswerType | null, null>>(null);
const route = useRoute();
const router = useRouter();
const count = Number(route.query.count) || 10;
const kps: (null | (KnowledgePointId[])) = (() => {
    const kps = route.query.kp;
    let kps1: (null | (KnowledgePointId[])) = null;
    if (Array.isArray(kps)) kps1 = kps.map(Number).filter(Boolean);
    else if (typeof kps === 'string') kps1 = [Number(kps)].filter(Boolean);
    if (!kps1 || kps1.length === 0) kps1 = null;
    return kps1;
})();

document.title = '测试 - SubQuiz';

newQuiz(count, kps).then(quiz => data.value = quiz, router.back);

let submitted = false;

const save = async function (autoSave: boolean = false)
{
    if (submitted) return;
    if (!autoSave) submitted = true;
    try
    {
        await saveQuiz(data.value.id, data.value, !autoSave).then(() =>
        {
            if (!autoSave) router.push('/analysis/' + data.value.id);
        });
    }
    catch (error)
    {
        if (error instanceof Error) notificationStore.add({ message: `保存失败：${error.message}`, type: "warning" });
        else notificationStore.add({ message: `保存失败：${error}`, type: "warning" });
    }
};

const autoSave = debounce(() => save(true), 1500);

watch(data, () => autoSave(), { deep: true })

</script>

<template>
    <Loading v-if="data === null"/>
    <QuizView v-else :quiz="data" :editable="true" :submit="save"/>
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