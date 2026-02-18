<script setup lang="tsx">
import Card from "../../components/Card.vue";
import { onUnmounted, ref } from "vue";
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
import Button from "../../components/Button.vue";
import Image from "../../components/Image.vue";
import { useUser } from "../../stores/user.ts";
import { isAiApp, tryLogin, tryOpenSSO } from "../../utils/utils.tsx";
import { useRoute, useRouter } from "vue-router";
import SidebarItem from "./SidebarItem.vue";
import SettingIcon from "vue-material-design-icons/CogOutline.vue";
import Spacer from "../../components/Spacer.vue";
import { storageGet } from "../../utils/storage.ts";
import MenuIcon from "vue-material-design-icons/Menu.vue";
import { phone } from "../../main.ts";
import { getSidebars } from "../../stores/sidebar.ts";
import { ChatBubbleLeftRightIcon, LanguageIcon, PhotoIcon, DocumentTextIcon } from "@heroicons/vue/16/solid";
import { Capacitor } from "@capacitor/core";

const open = ref(!phone.value);
(async () => 
{
    if (!phone.value) open.value = await storageGet('sidebar-open') !== 'false';
})();
const router = useRouter();
const route = useRoute();

function changeSidebarState()
{
    open.value = !open.value;
}

function goto(path: string)
{
    router.push(path);
}

const user = useUser();

function gotoSSO()
{
    if (user.userId()) tryOpenSSO('/info');
    else tryLogin();
}

function closeSidebar()
{
    open.value = false;
    getSidebars().forEach((item) => item.open = false);
}

function itemClick()
{
    if (phone.value)
        closeSidebar();
}

const currentTime = ref('');

const id = setInterval(() => 
{
    //以 `上午/下午HH:mm:ss` 的格式显示当前时间
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const period = 
        hours < 6 ? '凌晨' :
        hours < 9 ? '早上' :
        hours < 12 ? '上午' :
        hours < 14 ? '中午' :
        hours < 18 ? '下午' :
        hours < 22 ? '晚上' : 
        '深夜';
    const displayHours = (hours % 12 || 12).toString().padStart(2, '0');
    currentTime.value = `${period}${displayHours}:${minutes}:${seconds}`;
}, 1000);

onUnmounted(() => 
{
    clearInterval(id);
});


let count = 0;

function onSettingClick()
{
    if (count < 3 || Capacitor.getPlatform() === 'web')
    {
        count++;
        setTimeout(() => count--, 500);
        goto('/setting');
    }
    else
    {
        const ele = document.createElement(`div`);
        ele.id = 'quiz-browser';
        ele.style.width = '100%';
        ele.style.minWidth = '100%';
        ele.style.maxWidth = '100%';
        ele.style.height = '100%';
        ele.style.minHeight = '100%';
        ele.style.maxHeight = '100%';
        ele.style.position = 'fixed';
        ele.style.top = '0';
        ele.style.left = '0';
        ele.style.zIndex = '2147483647';
        ele.style.display = 'flex';
        ele.style.flexDirection = 'column';
        ele.style.backgroundColor = '#fff';
        document.body.appendChild(ele);
        const header = document.createElement(`div`);
        header.style.width = '100%';
        header.style.height = '50px';
        header.style.backgroundColor = '#f0f0f0';
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.justifyContent = 'space-between';
        header.style.padding = '0 10px';
        ele.appendChild(header);
        const closeBtn = document.createElement(`button`);
        closeBtn.innerHTML = '关闭';
        closeBtn.style.minWidth = 'max-content';
        closeBtn.style.width = 'max-content';
        closeBtn.style.height = '30px';
        closeBtn.style.borderRadius = '15px';
        closeBtn.style.border = 'none';
        closeBtn.style.outline = 'none';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.backgroundColor = '#0078d4';
        closeBtn.style.color = 'white';
        closeBtn.style.marginRight = '10px';
        closeBtn.addEventListener('click', () => ele.remove());
        header.appendChild(closeBtn);
        const urlInput = document.createElement(`input`);
        urlInput.type = 'text';
        urlInput.id = 'urlInput';
        urlInput.style.width = '100%';
        urlInput.style.height = '30px';
        urlInput.style.borderRadius = '15px';
        urlInput.style.border = '1px solid #ccc';
        urlInput.style.outline = 'none';
        urlInput.style.padding = '0 10px';
        urlInput.value = 'https://www.tachyon.moe/posts/SubQuiz/';
        header.appendChild(urlInput);
        const loadBtn = document.createElement(`button`);
        loadBtn.innerHTML = '加载';
        loadBtn.style.minWidth = 'max-content';
        loadBtn.style.width = 'max-content';
        loadBtn.style.height = '30px';
        loadBtn.style.borderRadius = '15px';
        loadBtn.style.border = 'none';
        loadBtn.style.outline = 'none';
        loadBtn.style.cursor = 'pointer';
        loadBtn.style.backgroundColor = '#0078d4';
        loadBtn.style.color = 'white';
        loadBtn.style.marginLeft = '10px';
        header.appendChild(loadBtn);
        const iframe = document.createElement(`iframe`);
        iframe.style.width = '100%';
        iframe.style.height = 'calc(100% - 50px)';
        iframe.style.border = 'none';
        iframe.src = urlInput.value;
        ele.appendChild(iframe);
        loadBtn.addEventListener('click', () => iframe.src = urlInput.value);
        loadBtn.click();
    }
}


</script>

<template>
    <quiz-sidebar-container :class="{ phone, 'open': open || getSidebars().some((item) => item.open) }">
        <div v-if="phone" class="sidebar-mask" @click="closeSidebar"/>
        <Card v-if="phone" class="sidebar-header">
            <MenuIcon @click="changeSidebarState" style="cursor: pointer;"/>
            <component v-for="item in getSidebars()" :key="item.id" :is="item.icon" @click="item.open = !item.open" style="cursor: pointer;"/>
            <span style="margin-left: auto;">{{ currentTime }}</span>
        </Card>
        <Card :class="{open, phone}" class="sidebar">
            <quiz-menu-title-box class="box" style="min-height: 80px; max-height: 80px;">
                <Button v-if="!phone" @click="changeSidebarState" class="menu-btn">
                    <MenuOpenIcon v-if="open || phone" />
                    <MenuCloseIcon v-else />
                </Button>
                <quiz-menu-title @click="itemClick(); goto('/')">SubQuiz</quiz-menu-title>
            </quiz-menu-title-box>

            <quiz-center />

            <div class="sidebar-items">
                <template v-if="!isAiApp()">
                    <SidebarItem @click="itemClick(); goto('/admin/subject/list')" :icon="BookshelfIcon" title="学科列表" :down="route.path.startsWith('/admin/subject') || route.path.startsWith('/admin/group')"/>
                    <SidebarItem @click="itemClick(); goto('/class')" :icon="AccountMultipleIcon" title="我的班级" :down="route.path === '/class'"/>
                    <SidebarItem @click="itemClick(); goto('/history')" :icon="HistoryIcon" title="答题记录" :down="route.path === '/history'"/>
                    <SidebarItem @click="itemClick(); goto('/ai')" :icon="RobotExcitedOutlineIcon" title="AI 助手" :down="route.path.startsWith('/ai')"/>
                </template>
                <template v-else>
                    <SidebarItem @click="itemClick(); goto('/')" :icon="ChatBubbleLeftRightIcon" title="AI 聊天" :down="route.path === '/' || route.path === '/ai/chat'"/>
                    <SidebarItem @click="itemClick(); goto('/ai/translate')" :icon="LanguageIcon" title="AI 翻译" :down="route.path === '/ai/translate'" />
                    <SidebarItem @click="itemClick(); goto('/ai/essay-correction')" :icon="DocumentTextIcon" title="作文批改" :down="route.path === '/ai/essay-correction'" />
                    <SidebarItem @click="itemClick(); goto('/ai/image')" :icon="PhotoIcon" title="文字识别" :down="route.path === '/ai/image'" />
                </template>

                <SidebarItem v-if="user.hasAdmin()" @click="itemClick(); goto('/admin/admins')" :icon="ShieldCrownOutlineIcon" title="全局管理" :down="route.path === '/admin/admins'" />
                <SidebarItem v-if="user.isRoot()" @click="itemClick(); goto('/terminal')" :icon="ConsoleIcon" title="控制台" :down="route.path === '/terminal'" />
                <SidebarItem @click="itemClick(); onSettingClick()" :icon="SettingIcon" title="系统设置" :down="route.path === '/setting'" />
                <SidebarItem @click="itemClick(); goto('/about')" :icon="InfoMationOutlineIcon" title="关于项目" :down="route.path === '/about' || route.path === '/update-info'" />
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
        <component v-for="item in getSidebars()" :key="item.id" :is="item.sidebar" class="sidebar-sidebar" :class="{ open: item.open }" @item-click="itemClick"/>
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
    transition: width 0.2s ease-in-out, transform 0.2s ease-in-out;
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
    overflow-x: hidden;
    overflow-y: hidden;
    scrollbar-width: none;
    position: relative;
    --transition: 'default';
}

quiz-sidebar-container {
    position: relative;
    height: 100%;
    width: 100%;
    display: flex;
    --transition: 'static';
}

quiz-sidebar-container.phone {
    flex-direction: column;

    &.open .sidebar-mask {
        background-color: rgba(0, 0, 0, 0.5);
        pointer-events: unset;
    }
    
    .sidebar-mask {
        z-index: calc($sidebar-z-index - 1);
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        transition: background-color 0.2s ease-in-out;
    }

    .sidebar {
        position: absolute;
        z-index: $sidebar-z-index;
        width: var(--sidebar-open-width);
    }

    .sidebar.open {
        transform: translateX(0);
    }

    .sidebar:not(.open) {
        transform: translateX(-215px);
    }

    .sidebar-header {
        padding-left: 13px;
        margin-bottom: 0;
        margin-top: 10px;
        height: 44px;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 10px;
    }
}

.sidebar-sidebar {
    position: absolute;
    z-index: $sidebar-z-index;
    width: var(--sidebar-open-width);
}

.sidebar-sidebar.open {
    transform: translateX(0);
}

.sidebar-sidebar:not(.open) {
    transform: translateX(-215px);
}

.sidebar.open:not(.phone) {
    width: var(--sidebar-open-width);
}

.sidebar:not(.open):not(.phone) {
    width: var(--sidebar-close-width);
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

.phone .box {
    justify-content: center;
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
        padding-left: 20px;
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
        font-family: 'Maple Mono NF CN';
        font-style: italic;
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