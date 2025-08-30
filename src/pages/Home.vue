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

</script>

<template>
    <quiz-main-container>
        <Button v-if="!useUser().getToken()" class="custom-login" @click="router.push('/custom-login')">
            <LoginVariant />
            <span>自定义登陆</span>
        </Button>
        <Card :max-tilt="5" class="main">
            <p class="main-title">开始新的测试</p>
            <p class="title">学科</p>
            <Input :area="false" placeholder="Subject Name" type="text" :model-value="'未指定'" readonly @click="gotoSubject" />
            <p class="title">题目数量</p>
            <Input :area="false" placeholder="Section Count" type="number" v-model="count" />
            <Slider :min-value="0" :max-value="50" :step="1" v-model="count"/>
            <quiz-main-button-container>
                <Button @click="startQuiz">
                    开始测试
                </Button>
            </quiz-main-button-container>
        </Card>
    </quiz-main-container>
</template>

<style scoped lang="scss">


quiz-main-container {
    display: flex;
    height: 100%;
    width: 100%;
    justify-content: center;
    align-items: center;
    flex-direction: column;
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