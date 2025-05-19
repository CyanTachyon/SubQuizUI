<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { login } from "../networks/backend/oauth.ts";
import Loading from "../components/Loading.vue";
import { useUser } from "../stores/user.ts";
let route = useRoute();
let router = useRouter();
let code = route.query.code as (string | undefined);
let from = route.query.from as (string | undefined);

document.title = '登录 - SubQuiz';

function gotoFrom()
{
    useUser().reload();
    if (from && !from.startsWith("/login")) router.push(from);
    else router.push('/');
}
if (code) login(code).then(gotoFrom, (e) =>
{
    if (e.response && (e.response.code === 417 || e.response.code === 401)) return;
    gotoFrom();
});
else gotoFrom();
</script>

<template>
    <Loading/>
</template>

<style scoped lang="scss">
quiz-loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 50%;
    height: 50%;
}
</style>