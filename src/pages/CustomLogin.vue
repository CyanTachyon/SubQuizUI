<script setup>
import { ref } from 'vue';
import Card from '../components/Card.vue';
import Input from '../components/Input.vue';
import Button from '../components/Button.vue';
import { customLogin } from '../networks/backend/oauth';
import { useRouter } from 'vue-router';

document.title = '自定义登录 - SubQuiz';

const id = ref(0);
const password = ref('');
const router = useRouter();

</script>

<template>
    <quiz-main-container>
        <Card :max-tilt="5">
            <form>
                <p class="main-title">自定义登录</p>
                <p class="title">用户ID</p>
                <Input :area="false" placeholder="用户ID" type="number" v-model="id" />
                <p class="title">密码</p>
                <Input :area="false" placeholder="密码" type="password" v-model="password" />
                <quiz-main-button-container>
                    <Button @click="customLogin(-id, password).then(() => router.push('/'))">登录</Button>
                </quiz-main-button-container>
            </form>
        </Card>
    </quiz-main-container>
</template>

<style lang="scss" scoped>
quiz-main-container {
    display: flex;
    height: 100%;
    width: 100%;
    justify-content: center;
    align-items: center;
    flex-direction: column;
}
quiz-main-button-container {
    display: flex;
    justify-content: center;
    margin-top: 20px;
}
.main-title {
    font-size: 1.5em;
    font-weight: bold;
    text-align: center;
    margin: 20px 0;
}

.title {
    margin: 10px;
}
</style>