<script setup lang="ts">
import { useRoute } from 'vue-router';
import StatusButton from '../../components/StatusButton.vue';
import { safeRedirect } from '../../utils/redirect';

const route = useRoute();
const code = route.query.code as string | undefined;
const from = route.query.from as string | undefined;

document.title = '登录中... - SubQuiz';

let url = "subquiz://oauth";
if (code || from) url = url + "?";
if (code) url = url + "code=" + code + "&";
if (from) url = url + "from=" + from + "&";
if (code || from) url = url.slice(0, url.length-1);
safeRedirect(url, true);
</script>

<template>
    <a :href="url">
        <StatusButton class="status-button">
            返回应用
        </StatusButton>
    </a>
</template>

<style scoped lang="scss">
.status-button {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--color);
}
</style>