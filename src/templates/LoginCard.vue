<script setup lang="ts">
import logo_light from "../assets/SubQuiz-icon-light-front.png";
import logo_dark from "../assets/SubQuiz-icon-dark-front.png";
import Button from "../components/Button.vue";
import Text from "../components/Text.vue";
import { forceSeiueLogin, ssoLogin } from "../utils/utils.tsx";
import { router } from "../main.ts";
import { getThemes } from "../stores/theme.ts";

const { onLogin } = defineProps<{ onLogin?: () => void }>();

</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 10px; align-items: center; padding: 100px 200px; width: fit-content; height: fit-content; max-width: 100%; max-height: 100%;">
        <img :src="getThemes().isDark ? logo_dark : logo_light" style="border-radius: 50%; width: 100px; height: 100px; object-fit: cover;" />
        <Text style="font-size: 2rem; font-weight: bold; margin: 50px 0; font-family: 'Maple Mono NF CN'; font-style: italic; min-width: max-content;">SubQuiz</Text>
        <Button @click="ssoLogin(); onLogin?.();" style="min-width: max-content;" down>登录</Button>
        <Button @click="forceSeiueLogin(); onLogin?.();" style="min-width: max-content;" down>使用希悦登录</Button>
        <Button @click="router.push('/custom-login'); onLogin?.();" style="min-width: max-content;" down>登录系统预置账户</Button>
    </div>
</template>