<script setup lang="ts">
import Card from "../../components/Card.vue";
import { ref } from "vue";
import MenuOpenIcon from "vue-material-design-icons/MenuOpen.vue";
import MenuCloseIcon from "vue-material-design-icons/MenuClose.vue";
import LogoutIcon from "vue-material-design-icons/Logout.vue";
import LoginIcon from "vue-material-design-icons/Login.vue";
import ConsoleIcon from "vue-material-design-icons/Console.vue";
import HistoryIcon from "vue-material-design-icons/History.vue";
import BookshelfIcon from "vue-material-design-icons/Bookshelf.vue";
import InfoMationOutlineIcon from "vue-material-design-icons/InformationOutline.vue";
import AccountMultipleIcon from "vue-material-design-icons/AccountMultiple.vue";
import ShieldCrownOutlineIcon from "vue-material-design-icons/ShieldCrownOutline.vue";
import RobotExcitedOutlineIcon from "vue-material-design-icons/RobotExcitedOutline.vue";
import { createAnimationsController } from "../../utils/AnimationsController.ts";
import Button from "../../components/Button.vue";
import Image from "../../components/Image.vue";
import { useUser } from "../../stores/user.ts";
import { sleep } from "../../utils/sleep.ts";
import { tryLogin, tryOpenSSO } from "../../utils/utils.tsx";
import { useRouter } from "vue-router";
import SidebarItem from "./SidebarItem.vue";
import SettingIcon from "vue-material-design-icons/CogOutline.vue";
import Spacer from "../../components/Spacer.vue";
import { storageGet, storageSet } from "../../utils/storage.ts";

const open = ref(true);
const sidebarClassName = ref('');
(async () => 
{
    open.value = await storageGet('sidebar-open') !== 'false';
    sidebarClassName.value = open.value ? 'sidebar-opened' : 'sidebar-closed';
})();
const controller = createAnimationsController();
const router = useRouter();

function changeSidebarState()
{
    controller.push([
        () =>
        {
            open.value = !open.value;
            storageSet('sidebar-open', open.value.toString());
            sidebarClassName.value = open.value ? 'sidebar-open' : 'sidebar-close';
        },
        () => sleep(200),
        () => sidebarClassName.value = open.value ? 'sidebar-opened' : 'sidebar-closed',

    ], false);
}

function goto(path: string)
{
    router.push(path);
}

let user = useUser();

function gotoSSO()
{
    if (user.userId()) tryOpenSSO('/');
    else tryLogin();
}

</script>

<template>
    <quiz-sidebar-container>
        <Card :class="sidebarClassName" class="sidebar">
            <quiz-menu-title-box class="box" style="min-height: 80px; max-height: 80px;">
                <Button @click="changeSidebarState" class="menu-btn">
                    <MenuOpenIcon v-if="open" />
                    <MenuCloseIcon v-else />
                </Button>
                <quiz-menu-title @click="goto('/')">SubQuiz</quiz-menu-title>
            </quiz-menu-title-box>

            <quiz-center />

            <div class="sidebar-items">
                <SidebarItem @click="goto('/admin/subject/list')" :icon="BookshelfIcon" title="学科列表" />
                <SidebarItem @click="goto('/class')" :icon="AccountMultipleIcon" title="我的班级" />
                <SidebarItem @click="goto('/history')" :icon="HistoryIcon" title="答题记录" />
                <SidebarItem @click="goto('/ai')" :icon="RobotExcitedOutlineIcon" title="AI 助手" />
                <SidebarItem v-if="user.hasAdmin()" @click="goto('/admin/admins')" :icon="ShieldCrownOutlineIcon" title="全局管理" />
                <SidebarItem v-if="user.isRoot()" @click="goto('/terminal')" :icon="ConsoleIcon" title="控制台" />
                <SidebarItem @click="goto('/setting')" :icon="SettingIcon" title="系统设置" />
                <SidebarItem @click="goto('/about')" :icon="InfoMationOutlineIcon" title="关于项目" />
            </div>

            <Spacer />
            <quiz-user-box class="box" style="min-height: 76px; max-height: 76px;">
                <Image class="avatar" :src="user.avatar()" @click="gotoSSO" />
                <quiz-username-box>
                    <quiz-username>{{ user.userName() }}</quiz-username>
                    <quiz-user-id>{{ user.userId() ?? 'unknown' }}</quiz-user-id>
                </quiz-username-box>
                <quiz-logout-button>
                    <LogoutIcon v-if="user.userId()" class="logout-icon" @click="user.logout()" />
                    <LoginIcon v-else class="logout-icon" @click="tryLogin" />
                </quiz-logout-button>
            </quiz-user-box>
        </Card>

        <quiz-main-content>
            <slot />
        </quiz-main-content>
    </quiz-sidebar-container>
</template>

<style scoped lang="scss">
/*** sidebar ***/

.sidebar {
    display: flex;
    flex-direction: column;
    height: calc(100% - 20px);
    margin-bottom: 7px;
    --sidebar-close-width: 80px;
    --sidebar-open-width: 200px;
}

.sidebar-items {
    display: flex;
    flex-direction: column;
    overflow: auto;
    scrollbar-width: none;
    margin: 0 -10px 0 -10px;
    padding: 10px;
}

quiz-main-content {
    width: 100%;
    height: 100%;
    overflow: auto;
    scrollbar-width: none;
    position: relative;
    --transition:default;
}

quiz-sidebar-container {
    height: 100%;
    width: 100%;
    display: flex;
    --transition:static;
}

@keyframes open-sidebar {
    from {
        width: var(--sidebar-close-width);
        min-width: var(--sidebar-close-width);
        max-width: var(--sidebar-close-width);
    }

    to {
        width: var(--sidebar-open-width);
        min-width: var(--sidebar-open-width);
        max-width: var(--sidebar-open-width);
    }
}

.sidebar-opened {
    width: var(--sidebar-open-width);
    min-width: var(--sidebar-open-width);
    max-width: var(--sidebar-open-width);
}

.sidebar-closed {
    width: var(--sidebar-close-width);
    min-width: var(--sidebar-close-width);
    max-width: var(--sidebar-close-width);
}

.sidebar-open {
    animation: open-sidebar 0.2s ease-in-out forwards;
}

.sidebar-close {
    animation: open-sidebar 0.2s ease-in-out reverse forwards;
}

quiz-center {
    flex-grow: 1;
}

/*** components ***/

.box {
    overflow: hidden;
    display: flex;
    height: fit-content;
}

quiz-menu-title-box {
    margin-left: -6px;
    margin-right: -6px;
    margin-top: -6px;
    padding: 6px;
    flex-direction: row-reverse;

    .menu-btn {
        position: relative;
        height: 48px;
        width: 50px;
        margin-left: 5px;
        margin-right: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding-left: 1.4rem;
    }

    quiz-menu-title {
        min-width: 125px;
        max-width: 125px;
        margin-top: auto;
        margin-bottom: auto;
        font-size: 25px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }
}

quiz-user-box {
    display: block;
    margin-left: -6px;
    margin-right: -6px;

    .avatar {
        min-width: 50px;
        max-width: 50px;
        min-height: 50px;
        max-height: 50px;
    }

    quiz-username-box {
        width: 85px;
        min-width: 85px;
        max-width: 85px;
        display: flex;
        flex-direction: column;

        quiz-username {
            display: block;
            margin-top: 15px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex-grow: 1;
        }

        quiz-user-id {
            display: block;
            margin-top: -2px;
            margin-bottom: 15px;
            opacity: 0.4;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: small;
            flex-grow: 1;
        }
    }

    quiz-logout-button {
        display: block;
        margin-top: auto;
        margin-bottom: auto;

        .logout-icon {
            cursor: pointer;
        }
    }
}
</style>