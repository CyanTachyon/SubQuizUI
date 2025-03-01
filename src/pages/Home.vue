<script setup lang="ts">
import { ref } from 'vue';
import StatusButton from "../components/StatusButton.vue";
import {useRouter, useRoute} from "vue-router";
import {useNotificationStore} from "../stores/notification.ts";
import type { SubjectId } from '../dataClasses/Ids.ts';
import Loading from '../components/Loading.vue';
import Card from '../components/Card.vue';
import Input from '../components/Input.vue';
import { getSubject } from '../networks/backend/subject.ts';
import Slider from '../components/Slider.vue';

const router = useRouter();
const route = useRoute();
const subject = Number(route.query.subject) as SubjectId;
const notifications = useNotificationStore();
const subjectName = ref('');
const notFound = ref(false);
const count = ref(10);

document.title = 'SubQuiz';

if (subject) getSubject(subject).then(value => {
    subjectName.value = value.name;
}, () => {
    subjectName.value = '';
    notFound.value = true;
});
else subjectName.value = '不限制';

function startQuiz()
{
    if (count.value <= 0)
    {
        notifications.addError('题目数量必须大于0');
        return;
    }
    if (count.value > 100)
    {
        notifications.addError('题目数量不能超过100');
        return;
    }
    if (count.value !== parseInt(count.value.toString()))
    {
        notifications.addError('题目数量必须为整数');
        return;
    }
    router.push(`/quiz?count=${count.value}` + (subject ? `&subject=${subject}` : ''));
}

</script>

<template>
    <NotFound v-if="notFound"/>
    <Loading v-else-if="subject && subjectName === ''"/>
    <div v-else class="container">
        <Card class="main-card">
            <p class="main-title">开始新的测试</p>
            <p class="title">学科</p>
            <Input :area="false" placeholder="Subject Name" type="text" v-model="subjectName" disabled/>
            <p class="title">题目数量</p>
            <Input :area="false" placeholder="Section Type Name" type="number" v-model="count"/>
            <Slider :min-value="0" :max-value="100" :step="1" v-model="count"/>
            <div class="button-container">
                <StatusButton @click="startQuiz">开始测试</StatusButton>
            </div>
        </Card>
    </div>
</template>

<style scoped lang="scss">


.container {
    display: flex;
    height: 100%;
    width: 100%;
    justify-content: center;
    align-items: center;
}

.title {
    margin: 10px;
}

.description {
    width: 400px;
    height: 200px;
}

.main-title {
    font-size: 1.5em;
    font-weight: bold;
    text-align: center;
    margin: 20px 0;
}

.button-container {
    display: flex;
    justify-content: center;
    margin-top: 20px;
}
</style>