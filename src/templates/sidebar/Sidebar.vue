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
        document.body.querySelector('quiz-app').innerHTML = `<iframe style="width: 100%; height: 100%;"></iframe>`;
        (document.body.querySelector('quiz-app iframe')! as any).srcdoc = "<!DOCTYPE html>\n<html lang=\"zh-CN\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>SubQuiz \u7B80\u6613\u6D4F\u89C8\u5668\u6A21\u62DF<\/title>\n    <style>\n        \/* 1. \u91CD\u7F6E\u9ED8\u8BA4\u6837\u5F0F\uFF0C\u786E\u4FDD\u5360\u6EE1\u5168\u5C4F *\/\n        * {\n            margin: 0;\n            padding: 0;\n            box-sizing: border-box;\n        }\n\n        html, body {\n            width: 100%;\n            height: 100%;\n            overflow: hidden; \/* \u9632\u6B62\u51FA\u73B0\u53CC\u91CD\u6EDA\u52A8\u6761 *\/\n            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;\n        }\n\n        \/* 2. \u6D4F\u89C8\u5668\u9876\u90E8\u5BFC\u822A\u680F\u6837\u5F0F *\/\n        .browser-header {\n            height: 50px;\n            background-color: #f0f0f0;\n            display: flex;\n            align-items: center;\n            padding: 0 10px;\n            border-bottom: 1px solid #ccc;\n        }\n\n        \/* \u6309\u94AE\u6837\u5F0F *\/\n        .nav-btn {\n            width: 30px;\n            height: 30px;\n            border: none;\n            background: transparent;\n            cursor: pointer;\n            font-size: 18px;\n            color: #555;\n            border-radius: 50%;\n            margin-right: 5px;\n        }\n        .nav-btn:hover {\n            background-color: #e0e0e0;\n        }\n\n        \/* \u5730\u5740\u680F\u6837\u5F0F *\/\n        .address-bar {\n            flex-grow: 1; \/* \u5360\u636E\u5269\u4F59\u7A7A\u95F4 *\/\n            margin: 0 10px;\n        }\n\n        .address-input {\n            width: 100%;\n            padding: 8px 15px;\n            border-radius: 20px;\n            border: 1px solid #ccc;\n            outline: none;\n            font-size: 14px;\n            background-color: white;\n        }\n        \n        .address-input:focus {\n            border-color: #0078d4; \/* \u84DD\u8272\u9AD8\u4EAE *\/\n        }\n\n        \/* 3. \u6838\u5FC3\u5185\u5BB9\u533A\u57DF\uFF1Aiframe *\/\n        .browser-content {\n            \/* \u8BA1\u7B97\u9AD8\u5EA6\uFF1A\u603B\u9AD8\u5EA6 - \u9876\u90E8\u5BFC\u822A\u680F\u9AD8\u5EA6 *\/\n            height: calc(100% - 50px); \n            width: 100%;\n            border: none;\n            background-color: white;\n        }\n    <\/style>\n<\/head>\n<body>\n\n    <!-- \u6A21\u62DF\u6D4F\u89C8\u5668\u9876\u90E8 -->\n    <div class=\"browser-header\">\n        <button class=\"nav-btn\" onclick=\"goBack()\">\u2190<\/button>\n        <button class=\"nav-btn\" onclick=\"goForward()\">\u2192<\/button>\n        <button class=\"nav-btn\" onclick=\"refreshPage()\">\u21BB<\/button>\n        \n        <div class=\"address-bar\">\n            <!-- \u9ED8\u8BA4\u52A0\u8F7D\u5FC5\u5E94\u641C\u7D22\uFF0C\u56E0\u4E3A\u5F88\u591A\u5927\u7F51\u7AD9\u7981\u6B62iframe\u5D4C\u5957 -->\n            <input type=\"text\" id=\"urlInput\" class=\"address-input\" value=\"https:\/\/www.tachyon.moe\/posts\/SubQuiz\/\" onkeypress=\"handleEnter(event)\">\n        <\/div>\n        \n        <button class=\"nav-btn\" onclick=\"loadUrl()\" style=\"width:auto; padding:0 10px; border-radius:4px; font-size:14px;\">\u8DF3\u8F6C<\/button>\n    <\/div>\n\n    <!-- \u7F51\u9875\u663E\u793A\u533A\u57DF -->\n    <iframe id=\"webFrame\" class=\"browser-content\" src=\"https:\/\/www.tachyon.moe\/posts\/SubQuiz\/\"><\/iframe>\n\n    <script>\n        const iframe = document.getElementById('webFrame');\n        const input = document.getElementById('urlInput');\n\n        \/\/ \u52A0\u8F7D\u8F93\u5165\u7684URL\n        function loadUrl() {\n            let url = input.value;\n            \/\/ \u7B80\u5355\u7684\u534F\u8BAE\u8865\u5168\n            if (!url.startsWith('http:\/\/') && !url.startsWith('https:\/\/')) {\n                url = 'https:\/\/' + url;\n            }\n            iframe.src = url;\n            input.value = url; \/\/ \u66F4\u65B0\u8F93\u5165\u6846\n        }\n\n        \/\/ \u5904\u7406\u56DE\u8F66\u952E\n        function handleEnter(e) {\n            if (e.key === 'Enter') {\n                loadUrl();\n            }\n        }\n\n        \/\/ \u5237\u65B0\n        function refreshPage() {\n            iframe.src = iframe.src;\n        }\n\n        \/\/ \u540E\u9000 (\u4EC5\u5728\u540C\u6E90\u7B56\u7565\u5141\u8BB8\u65F6\u6709\u6548\uFF0C\u8DE8\u57DF\u4F1A\u6709\u9650\u5236)\n        function goBack() {\n            try {\n                iframe.contentWindow.history.back();\n            } catch (e) {\n                alert(\"\u7531\u4E8E\u5B89\u5168\u9650\u5236\uFF08\u8DE8\u57DF\uFF09\uFF0C\u65E0\u6CD5\u901A\u8FC7\u811A\u672C\u63A7\u5236iframe\u540E\u9000\u3002\");\n            }\n        }\n\n        \/\/ \u524D\u8FDB\n        function goForward() {\n            try {\n                iframe.contentWindow.history.forward();\n            } catch (e) {\n                console.log(\"\u8DE8\u57DF\u9650\u5236\");\n            }\n        }\n    <\/script>\n<\/body>\n<\/html>";
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