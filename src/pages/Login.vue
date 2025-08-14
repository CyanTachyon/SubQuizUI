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
    try { useUser().reload(); } catch (e) { /* ignore */ }
    if (from && !from.startsWith("/login")) router.push(from);
    else router.push('/');
}
if (code) login(code).finally(gotoFrom);
else gotoFrom();
</script>

<template>
    <Loading/>
</template>

<style scoped lang="scss">
</style>