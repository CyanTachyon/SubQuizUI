<script setup lang="ts">
import {useRoute, useRouter} from "vue-router";
import {login} from "../networks/backend/oauth.ts";
import Loading from "../components/Loading.vue";
let route = useRoute()
let router = useRouter()
let code = route.query.code as string | undefined;
let from = route.query.from as string | undefined;

document.title = '登录 - SubQuiz';

function gotoFrom()
{
    if (from) router.push(from)
    else router.push('/')
}
if (code) login(code).finally(gotoFrom); else gotoFrom();
</script>

<template>
    <Loading class="main"/>
</template>

<style scoped lang="scss">
.main {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 50%;
    height: 50%;
}
</style>