<template>
    <TransitionGroup name="notification" tag="quiz-notifications-wrapper">
        <quiz-notification-item v-for="notification in getNotifications()" :key="notification.id" :class="[notification.type || 'info']">
            {{ notification.message }}
        </quiz-notification-item>
    </TransitionGroup>

    <main>
        <DownloadNewVersion v-if="versionInfo && Capacitor.getPlatform() === 'android'" :info="versionInfo" />
        <Sidebar v-else-if="route.meta.sidebar">
            <RouterView />
        </Sidebar>
        <RouterView v-else />
    </main>
</template>
<script setup lang="ts">
import { isNavigationFailure, useRoute, useRouter } from "vue-router";
import { $appearDuration, useTransitionActions } from "./stores/transition.ts";
import { useUser } from "./stores/user.ts";
import { getNotifications } from "./stores/notification.ts";
import { useTheme } from './stores/theme';
import Sidebar from "./templates/sidebar/Sidebar.vue";
import DownloadNewVersion from "./pages/_app/DownloadNewVersion.vue";
import { checkUpdate, versionInfo } from "./utils/utils";
import { Capacitor } from "@capacitor/core";

const router = useRouter();
const route = useRoute();
const transition = useTransitionActions();

router.beforeEach((_, __, next) =>
{
    transition.onLeave();
    return new Promise((resolve) =>
    {
        setTimeout(() =>
        {
            resolve(next());
        }, $appearDuration);
    });
});

router.afterEach((_, __, failure) =>
{
    if (isNavigationFailure(failure)) return;
    transition.onEnter();
    return new Promise((resolve) =>
    {
        setTimeout(() =>
        {
            resolve(transition.clear());
        }, $appearDuration);
    });
});

let user = useUser();
user.reload();

const theme = useTheme();
theme.initialize();
checkUpdate();
</script>
<style lang="scss">
body {
    -webkit-user-select: none;
    user-select: none;
    background-color: var(--bgcolor);
    color: var(--color);
}

main {
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
}

quiz-app {
    display: block;
    position: fixed;
    inset: 0;
    height: 100%;
    width: 100%;
}

quiz-notifications-wrapper {
    flex-direction: column-reverse;
    position: fixed;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    z-index: 9999;
    max-height: 100vh;
    min-width: 30vw;
    max-width: 30vw;
    overflow: visible;
}

quiz-notification-item {
    display: block;
    position: relative;
    padding: 0.5rem 1rem;
    min-width: 200px;
    text-align: center;
    border-radius: 0.375rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    background: white;
    border: 1px solid #e5e7eb;
    font-size: 0.875rem;
}

/* 通知类型颜色 */
quiz-notification-item.info {
    background-color: #dbeafe;
    border-color: #93c5fd;
    color: #1e40af;
    box-shadow: 0 0 9px 2px #93c5fd;
}

quiz-notification-item.success {
    background-color: #dcfce7;
    border-color: #86efac;
    color: #166534;
    box-shadow: 0 0 9px 2px #86efac;
}

quiz-notification-item.warning {
    background-color: #fef3c7;
    border-color: #fcd34d;
    color: #854d0e;
    box-shadow: 0 0 9px 2px #fcd34d;
}

quiz-notification-item.error {
    background-color: #fee2e2;
    border-color: #fca5a5;
    color: #991b1b;
    box-shadow: 0 0 9px 2px #fca5a5;
}

.notification-move {
    transition: all 0.3s ease;
}

.notification-enter-active {
    transition: all 0.3s ease;
}

.notification-leave-active {
    transition: all 0.3s ease;
}

.notification-enter-from {
    opacity: 0;
    transform: translateY(-30px);
}

.notification-leave-to {
    opacity: 0;
    transform: translateY(30px);
}
</style>