import type { UserInfo } from "../dataClasses/User.ts";
import { getUserInfo } from "../networks/backend/user.ts";
import { avatarUrl } from "../networks/sso/avatar.ts";
import { isAdmin, Permission } from "../dataClasses/Permission.ts";
import { ref } from 'vue';
import { InAppBrowser } from "@capgo/inappbrowser";
import { Capacitor } from "@capacitor/core";
import { storageGet, storageRemove, storageSet } from "../utils/storage.ts";

const user = ref(null as (UserInfo | null));
const token = ref<string | null>(null);

const actions = {
    reload: async () =>
    {
        if (!await storageGet('token'))
        {
            actions.logout();
            return;
        }
        token.value = await storageGet('token');
        getUserInfo().then(u => user.value = u as UserInfo);
    },
    logout: () =>
    {
        user.value = null;
        token.value = null;
        actions.login(null);
        if (Capacitor.getPlatform() !== 'web')
        {
            InAppBrowser.clearAllCookies();
            InAppBrowser.clearCache();
        }
    },
    userId: () =>
    {
        if (user.value === null) return null;
        return user.value.id as number;
    },
    avatar: () =>
    {
        return avatarUrl(actions.userId());
    },
    userName: () =>
    {
        if (user.value === null) return '未登录';
        return user.value.username as string;
    },
    hasAdmin: () =>
    {
        if (user.value === null) return false;
        return isAdmin(user.value.permission);
    },
    isRoot: () =>
    {
        if (user.value === null) return false;
        return user.value.permission === Permission.ROOT;
    },
    setUser: (u: UserInfo | string | null) =>
    {
        if (typeof u === 'string') actions.login(u);
        else if (u !== null) user.value = u;
        else actions.login(null);
    },
    getToken: () =>
    {
        return token.value;
    },
    login: async (token_: string | null) =>
    {
        if (token_ !== null) await storageSet('token', token_);
        else await storageRemove('token');
        token.value = token_;
    }
}

export const useUser = () => 
{
    return actions;
}