<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useNotification } from '../../stores/notification';

const route = useRoute();
const code = route.query.code as string | undefined;

document.title = '登录成功... - SubQuiz';

try
{
    // @ts-ignore
    window.mobileApp.postMessage({ detail: { code: code } });
    // @ts-ignore
    useNotification().addSuccess(`${window.mobileApp}`)
}
catch (error)
{
    useNotification().addError(error);
}

</script>

<template>
    <div>
        正在处理登录信息...
    </div>
</template>

<style scoped lang="scss">
quiz-button {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--color);
}
</style>