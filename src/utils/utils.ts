import { computed } from "vue";
import { Capacitor } from '@capacitor/core';
import { connectUrl, Target } from "../networks/utils/sendRequest.ts";
import { router } from "../main.ts";
import { safeRedirect } from "./redirect.ts";

export function getToken()
{
    return localStorage.getItem('token');
}
export function setToken(token: string | null)
{
    if (token !== null) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
}

export let token = computed({ get: getToken, set: setToken, });

export function tryLogin()
{
    tryOpenSSO('/oauth');
}

export function tryAuthorize()
{
    tryOpenSSO('/authorize/' + environment.ssoServiceId);
}

function tryOpenSSO(url: string)
{
    if (Capacitor.getPlatform() !== 'web') 
    {
        const callbackUrl = connectUrl(Target.FRONTEND, '/_app/login', { from: location.pathname });
        router.push(connectUrl(Target.EMPTY, '/_app/sso' + url, { from: callbackUrl }));
    }
    else 
    {
        const callbackUrl = connectUrl(Target.FRONTEND, '/login', { from: location.pathname });
        safeRedirect(connectUrl(Target.SSO_FRONTEND, url, { from: callbackUrl }));
    }
}

export function getUrlSearchParams(): Record<string, string>
{
    return Object.fromEntries(new URLSearchParams(location.search).entries());
}


/**
 * 设置当前的url，但是不触发vue router的跳转
 */
export function pushUrl(url: string = location.pathname, query: Record<string, string> = getUrlSearchParams())
{
    window.history.pushState({}, '', connectUrl(Target.EMPTY, url, query));
}

export function replaceUrl(url: string = location.pathname, query: Record<string, string> = getUrlSearchParams())
{
    window.history.replaceState({}, '', connectUrl(Target.EMPTY, url, query));
}


export function isLegacyAndroidApp()
{
    // 是否是老版本的安卓app，即1.0.2及以下的版本
    return Capacitor.getPlatform() === 'android' && window.location.hostname !== environment.androidHostname;
}