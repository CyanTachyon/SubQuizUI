<script setup lang="ts">
import Card from "../../components/Card.vue";
import {ref} from "vue";
import MenuOpenIcon from "vue-material-design-icons/MenuOpen.vue";
import MenuCloseIcon from "vue-material-design-icons/MenuClose.vue";
import LogoutIcon from "vue-material-design-icons/Logout.vue";
import LoginIcon from "vue-material-design-icons/Login.vue";
import ConsoleIcon from "vue-material-design-icons/Console.vue";
import HistoryIcon from "vue-material-design-icons/History.vue";
import BookshelfIcon from "vue-material-design-icons/Bookshelf.vue";
import InfoMationOutlineIcon from "vue-material-design-icons/InformationOutline.vue";
import ShieldCrownOutlineIcon from "vue-material-design-icons/ShieldCrownOutline.vue";
import {createAnimationsController} from "../../utils/AnimationsController.ts";
import StatusButton from "../../components/StatusButton.vue";
import Image from "../../components/Image.vue";
import {safeRedirect} from "../../utils/redirect.ts";
import {useUser} from "../../stores/user.ts";
import {sleep} from "../../utils/sleep.ts";
import {tryLogin} from "../../utils/utils.ts";
import {useRouter} from "vue-router";
import SidebarItem from "./SidebarItem.vue";
import {Permission} from "../../dataClasses/Permission.ts";
import ThemeIcon from "vue-material-design-icons/ThemeLightDark.vue";
import {useThemeStore} from "../../stores/theme";
import Spacer from "../../components/Spacer.vue";
import { Capacitor } from "@capacitor/core";

let open = ref(localStorage.getItem('sidebar-open') !== 'false');
let sidebarClassName = ref(open.value ? 'sidebar-opened' : 'sidebar-closed');
let controller = createAnimationsController();
const router = useRouter();
const themeStore = useThemeStore();

function changeSidebarState()
{
    controller.push([
        () =>
        {
            open.value = !open.value;
            localStorage.setItem('sidebar-open', open.value.toString());
            sidebarClassName.value = open.value ? 'sidebar-open' : 'sidebar-close';
        },
        () => sleep(800),
        () => sidebarClassName.value = open.value ? 'sidebar-opened' : 'sidebar-closed',

    ], false)
}

function goto(path: string)
{
    router.push(path)
}

let user = useUser();

function gotoSSO()
{
    if (user.userId()) safeRedirect(environment.ssoFrontend)
    else tryLogin();
}

</script>

<template>
    <div class="sidebar-container">
        <Card :class="sidebarClassName" class="sidebar">
            <div class="box menu-title-box">
                <StatusButton @click="changeSidebarState" class="menu-btn">
                    <MenuOpenIcon v-if="open"/>
                    <MenuCloseIcon v-else/>
                </StatusButton>
                <div class="title" @click="goto('/')">SubQuiz</div>
            </div>

            <div id="center"/>

            <SidebarItem @click="goto('/admin/subject/list')" :icon="BookshelfIcon" title="学科列表"/>
            <SidebarItem @click="goto('/history')" :icon="HistoryIcon" title="答题记录"/>
            <SidebarItem v-if="user.hasAdmin()" @click="goto('/admin/admins')" :icon="ShieldCrownOutlineIcon" title="全局管理"/>
            <SidebarItem v-if="user.user?.permission === Permission.ROOT" @click="goto('/terminal')" :icon="ConsoleIcon" title="控制台"/>
            <SidebarItem v-if="Capacitor.getPlatform() === 'web'" @click="themeStore.toggleTheme" :icon="ThemeIcon" title="切换主题"/>
            <SidebarItem @click="goto('/about')" :icon="InfoMationOutlineIcon" title="关于项目"/>

            <Spacer/>
            <div class="box user-box">
                <Image class="avatar" :src="user.avatar()" @click="gotoSSO"/>
                <div class="username-box">
                    <div class="username">{{ user.userName() }}</div>
                    <div class="user-id">{{ user.userId() ?? 'unknown' }}</div>
                </div>
                <div class="logout-button">
                    <LogoutIcon v-if="user.userId()" class="logout-icon" @click="user.logout()"/>
                    <LoginIcon v-else class="logout-icon" @click="tryLogin"/>
                </div>
            </div>
        </Card>

        <div class="main-content">
            <slot></slot>
        </div>
    </div>
</template>

<style scoped lang="scss">

/*** sidebar ***/

.sidebar {
    display: flex;
    flex-direction: column;
    height: calc(100% - 20px);
    --sidebar-close-width: 80px;
    --sidebar-open-width: 200px;
}

.main-content {
    width: 100%;
    height: 100%;
    overflow: auto;
    scrollbar-width: none;
    position: relative;
    --transition:default;
}

.sidebar-container {
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
    animation: open-sidebar 0.8s ease-in-out forwards;
}

.sidebar-close {
    animation: open-sidebar 0.8s ease-in-out reverse forwards;
}

#center {
    flex-grow: 1;
}

/*** components ***/

.box {
    overflow: hidden;
    display: flex;
    height: fit-content;
}

.menu-title-box {
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

    .title {
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

.user-box {
    margin-left: -6px;
    margin-right: -6px;

    .avatar {
        min-width: 50px;
        max-width: 50px;
        min-height: 50px;
        max-height: 50px;
    }

    .username-box {
        width: 85px;
        min-width: 85px;
        max-width: 85px;
        display: flex;
        flex-direction: column;

        .username {
            margin-top: 15px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex-grow: 1;
        }

        .user-id {
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

    .logout-button {
        margin-top: auto;
        margin-bottom: auto;

        .logout-icon {
            cursor: pointer;
        }
    }
}
</style>