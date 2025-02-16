import {defineStore} from 'pinia';
import {setToken, token} from "../utils/utils.ts";
import type {UserInfo} from "../dataClasses/User.ts";
import {getUserInfo} from "../networks/backend/user.ts";
import {avatarUrl} from "../networks/sso/avatar.ts";
import SubIT_icon from '../assets/SubIT_icon.png';
import {isAdmin} from "../dataClasses/Permission.ts";

export const useUser = defineStore('user', {
    state: () => ({
        user: null as (UserInfo | null),
    }),
    actions: {
        reload()
        {
            if (!token)
            {
                this.logout();
                return;
            }
            getUserInfo().then(user => this.user = user as UserInfo);
        },
        logout()
        {
            this.user = null;
            setToken(null);
        },
        userId()
        {
            if (this.user === null) return null;
            return this.user.id as number;
        },
        avatar()
        {
            let id = this.userId();
            if (!id) return SubIT_icon;
            return avatarUrl(id);
        },
        userName()
        {
            if (this.user === null) return '未登录';
            return this.user.username as string
        },
        hasAdmin()
        {
            if (this.user === null) return false;
            return isAdmin(this.user.permission);
        }
    }
});