<script setup lang="ts">
import { useUser } from "../stores/user.ts";
import { safeRedirect } from "../utils/redirect.ts";
import Image from "../components/Image.vue";
import StatusButton from "../components/StatusButton.vue";
import { connectUrl, Target } from "../networks/utils/sendRequest";

const { close } = defineProps<{
    close: () => void;
}>();

const user = useUser();

</script>

<template>
    <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem; padding-left: 3rem; padding-right: 3rem; --transition:static;">
        <h2>您还未绑定希悦账户</h2>

        <quiz-user-box class="box">
            <Image class="avatar" :src="user.avatar()"/>
            <quiz-username>{{ user.userName() }}</quiz-username>
        </quiz-user-box>
        <div style="display: flex;">
            <StatusButton @click="() => { close(); safeRedirect(connectUrl(Target.SSO_FRONTEND, '/info?intent=seiue&userId=' + user.userId())); }">
                绑定希悦
            </StatusButton>
            <StatusButton @click="() => { user.logout(); close(); safeRedirect(connectUrl(Target.FRONTEND, '/')) }">
                退出登陆
            </StatusButton>
        </div>
    </div>
</template>

<style lang="scss" scoped>
quiz-user-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    margin-left: -6px;
    margin-right: -6px;

    .avatar {
        min-width: 80px;
        max-width: 80px;
        min-height: 80px;
        max-height: 80px;
    }
    
    quiz-username {
        display: block;
        margin-top: 15px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex-grow: 1;
    }
}
</style>