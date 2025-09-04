<script setup lang="ts">
import { ref } from 'vue';
import Button from "../components/Button.vue";
import { useRouter } from "vue-router";
import { useNotification } from "../stores/notification.ts";
import Card from '../components/Card.vue';
import Input from '../components/Input.vue';
import Slider from '../components/Slider.vue';
import LoginVariant from 'vue-material-design-icons/LoginVariant.vue';
import { useUser } from '../stores/user.ts';
import type { Quiz } from '../dataClasses/Quiz.ts';
import type { AnswerType } from '../dataClasses/Question.ts';
import { getUnfinishedQuizzes } from '../networks/backend/quiz.ts';
import Spacer from '../components/Spacer.vue';
import { phone } from '../main.ts';

document.title = 'SubQuiz';

const router = useRouter();
const notifications = useNotification();
const count = ref(10);

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
    router.push(`/quiz?count=${count.value}`);
}

function gotoSubject()
{
    router.push('/admin/subject/list');
}

const unfinishedQuizzes = ref<Quiz<null, AnswerType | null, null>[]>([]);
getUnfinishedQuizzes().then(value => unfinishedQuizzes.value = value);

function startTimeToString(time: number)
{
    const date = new Date(time);
    const padZero = (num: number) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}:${padZero(date.getSeconds())}`;
}
</script>

<template>
    <quiz-main-container :class="{ phone }">
        <quiz-main-left>
            <Button v-if="!useUser().getToken()" class="custom-login" @click="router.push('/custom-login')">
                <LoginVariant />
                <span>自定义登陆</span>
            </Button>
            <Card :max-tilt="5" class="main">
                <p class="main-title">开始新的测试</p>
                <p class="title">学科</p>
                <Input :area="false" placeholder="Subject Name" type="text" :model-value="'未指定'" readonly
                    @click="gotoSubject" />
                <p class="title">题目数量</p>
                <Input :area="false" placeholder="Section Count" type="number" v-model="count" />
                <Slider :min-value="0" :max-value="50" :step="1" v-model="count" />
                <quiz-main-button-container>
                    <Button @click="startQuiz">
                        开始测试
                    </Button>
                </quiz-main-button-container>
            </Card>
        </quiz-main-left>
        <Card class="main-right" v-if="unfinishedQuizzes.length > 0">
            <p class="title" style="margin-left: 20px;">未完成的测试</p>
            <Spacer class="spacer"/>
            <quiz-quizzes>
                <Card v-for="q in unfinishedQuizzes" :key="q.id" @click="router.push('/quiz?id=' + q.id)" :max-tilt="5" class="unfinished">
                    <p>{{ startTimeToString(q.time) }}</p>
                    <Spacer />
                    <p>测试ID：{{ q.id }}</p>
                    <p>题目数量：{{ q.sections.length }}</p>
                    <p>测试状态：{{ q.finished ? '已完成' : '进行中' }}</p>
                </Card>
            </quiz-quizzes>
        </Card>
    </quiz-main-container>
</template>

<style scoped lang="scss">

quiz-main-container {
    display: flex;
    flex-direction: row;
    height: 100%;
    width: 100%;
}

quiz-main-container.phone {
    flex-direction: column;
}

quiz-main-left {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
}

.main-right {
    display: flex;
    flex-direction: column;
    quiz-quizzes {
        overflow-y: scroll;
        scrollbar-width: none;
        flex-grow: 1;
    }
    .spacer {
        width: 296px;
    }
}

.phone .main-right {
    quiz-quizzes {
        display: flex;
        flex-direction: row;
    }
    .spacer {
        width: unset;
    }
}

.unfinished {
    padding: 15px 30px 30px 30px;
    cursor: pointer;
    width: 270px;
    min-width: 270px;
    max-width: 270px;
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

quiz-main-button-container {
    display: flex;
    justify-content: center;
    margin-top: 20px;
}

.main {
    margin: auto;
}

.custom-login {
    margin-left: auto;
}
</style>