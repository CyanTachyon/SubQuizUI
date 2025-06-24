import { setToken, token } from "../utils/utils.tsx";
import type { UserInfo } from "../dataClasses/User.ts";
import { getUserInfo } from "../networks/backend/user.ts";
import { avatarUrl } from "../networks/sso/avatar.ts";
import { isAdmin, Permission } from "../dataClasses/Permission.ts";
import { ref } from 'vue';

const user = ref(null as (UserInfo | null));

const actions = {
    reload: () =>
    {
        if (!token)
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
    setUser: (u: UserInfo | null) =>
    {
        user.value = u;
        if (u === null) setToken(null);
        else setToken(u.id.toString());
    }
}

export const useUser = () => 
{
    return actions;
}