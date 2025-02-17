<template>
    <div class="notification-container">
        <TransitionGroup
                name="notification"
                tag="div"
                class="notifications-wrapper"
        >
            <div
                    v-for="notification in notificationStore.notifications"
                    :key="notification.id"
                    class="notification-item"
                    :class="[notification.type || 'info']"
            >
                {{ notification.message }}
            </div>
        </TransitionGroup>

        <main>
            <RouterView/>
        </main>
    </div>
</template>
<script setup lang="ts">
import {isNavigationFailure, useRouter} from "vue-router";
import {$appearDuration, useTransitionStore} from "./stores/transition.ts";
import {useUser} from "./stores/user.ts";
import {useNotificationStore} from "./stores/notification.ts";
import {useThemeStore} from './stores/theme'

const router = useRouter()
const store = useTransitionStore();

router.beforeEach((_, __, next) =>
{
    store.onLeave()
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
    const store = useTransitionStore();
    store.onEnter();
    return new Promise((resolve) =>
    {
        setTimeout(() =>
        {
            resolve(store.clear());
        }, $appearDuration);
    });
});

let user = useUser();
user.reload();

const notificationStore = useNotificationStore();
const themeStore = useThemeStore()
themeStore.initialize()
</script>
<style lang="scss">
:root {
    --bgcolor: #{$light-bgcolor};
    --color: #{$light-color};
    --up-shadow: #{$light-up-shadow};
    --down-shadow: #{$light-down-shadow};
    --border-color: #{$light-border-color};
}

[data-theme='dark'] {
    --bgcolor: #{$dark-bgcolor};
    --color: #{$dark-color};
    --up-shadow: #{$dark-up-shadow};
    --down-shadow: #{$dark-down-shadow};
    --border-color: #{$dark-border-color};
}

body {
    -webkit-user-select: none;
    user-select: none;
    background-color: var(--bgcolor);
    color: var(--color);
    transition: background-color 0.5s ease, color 0.5s ease;
}

main {
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100vw;
}

.notification-container {
    position: fixed;
    inset: 0;
}

.notifications-wrapper {
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

.notification-item {
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
.notification-item.info {
    background-color: #dbeafe;
    border-color: #93c5fd;
    color: #1e40af;
    box-shadow: 0px 0px 9px 2px #93c5fd;
}

.notification-item.success {
    background-color: #dcfce7;
    border-color: #86efac;
    color: #166534;
    box-shadow: 0px 0px 9px 2px #86efac;
}

.notification-item.warning {
    background-color: #fef3c7;
    border-color: #fcd34d;
    color: #854d0e;
    box-shadow: 0px 0px 9px 2px #fcd34d;
}

.notification-item.error {
    background-color: #fee2e2;
    border-color: #fca5a5;
    color: #991b1b;
    box-shadow: 0px 0px 9px 2px #fca5a5;
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