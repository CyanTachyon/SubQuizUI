<script setup lang="ts">
import logo from "../assets/icon_round.svg";
import Button from "../components/Button.vue";
import Text from "../components/Text.vue";
import { ssoLogin } from "../utils/utils.tsx";
import { router } from "../main.ts";

const { onLogin } = defineProps<{ onLogin?: () => void }>();

</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 10px; align-items: center; padding: 100px 200px; min-width: fit-content; min-height: fit-content;">
        <img :src="logo" style="border-radius: 50%; width: 100px; height: 100px; object-fit: cover;" />
        <Text style="font-size: 2rem; font-weight: bold; margin: 50px 0; font-family: 'Maple Mono NF CN'; font-style: italic;">SubQuiz</Text>
        <Button @click="ssoLogin(); onLogin?.();">登陆</Button>
        <Button @click="router.push('/custom-login'); onLogin?.();">登陆系统预置账户</Button>
    </div>
</template>