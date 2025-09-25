<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import AiDialog from '../../templates/chat/AiDialog.vue';

document.title = 'AI聊天分享 - SubQuiz';

const route = useRoute();
const chatId = String(route.params.id) || "unset";
const router = useRouter();
</script>
<template>
    <AiDialog :info="chatId" @new-chat="router.push('/ai/chat')" @chat-named="() => {}"/>
</template>