import { setToken, getToken } from "../utils/utils.tsx";
import type { UserInfo } from "../dataClasses/User.ts";
import { getUserInfo } from "../networks/backend/user.ts";
import { avatarUrl } from "../networks/sso/avatar.ts";
import { isAdmin, Permission } from "../dataClasses/Permission.ts";
import { ref } from 'vue';
import { InAppBrowser } from "@capgo/inappbrowser";
import { Capacitor } from "@capacitor/core";

const user = ref(null as (UserInfo | null));

const actions = {
    reload: async () =>
    {
        if (!await getToken())
        {
            actions.logout();
            return;
        }
        getUserInfo().then(u => user.value = u as UserInfo);
    },
    logout: () =>
    {
        user.value = null;
        setToken(null);
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
        if (typeof u === 'string') setToken(u);
        else if (u !== null) user.value = u;
        else setToken(null);
    }
}

export const useUser = () => 
{
    return actions;
}