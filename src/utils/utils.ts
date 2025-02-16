import {computed} from "vue";
import {safeRedirect} from "./redirect.ts";
import {connectUrl, Target} from "../networks/utils/sendRequest.ts";

export function getToken()
{
    return localStorage.getItem('token');
}
export function setToken(token: string | null)
{
    console.log('set token', token);
    if (token !== null) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
}

export let token = computed({get: getToken, set: setToken,})

export function tryLogin()
{
    let from = connectUrl(Target.SELF, '/login', {from: location.pathname});
    safeRedirect(connectUrl(Target.SSO_FRONTEND, '/oauth', {from}));
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


