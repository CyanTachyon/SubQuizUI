import { computed, createApp, ref } from "vue";
import { Capacitor } from '@capacitor/core';
import { connectUrl, Target } from "../networks/utils/sendRequest.ts";
import { router } from "../main.ts";
import { safeRedirect } from "./redirect.ts";
import Dialog from "@/components/Dialog.vue";
import Input from "@/components/Input.vue";
import type { JSX } from "vue/jsx-runtime";
import RealNameRequired from "@/templates/RealNameRequired.vue";

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
    tryOpenSSO('/oauth?needAuthorize=' + environment.ssoServiceId);
}

export function tryBindSeiue()
{
    const close = dialog(<RealNameRequired close={ () => { close(); } }/>);
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

export function dialog(
    innerHtml: JSX.Element | string,
    onClose: () => void = () => {},
)
{
    if (typeof innerHtml === 'string') innerHtml = <div innerHTML={innerHtml}></div>;
    const container = document.createElement('div');
    container.id = 'quiz-dialog-' + Math.random().toString(36).substring(2, 15);
    document.body.appendChild(container);

    const open = ref(true);
    const app = createApp({
        render()
        {
            return <Dialog open={open.value} onClose={onClose}>{innerHtml}</Dialog>;
        }
    });
    app.mount(container);
    return () =>
    {
        open.value = false;
        app.unmount();
        document.body.removeChild(container);
    };
}

export function inputDialog(
    content: JSX.Element,
    submit: (value: string) => void,
    cancel?: () => void
)
{
    const input = ref<string | null>(null);
    const close = dialog(
        <form autocomplete="off" onSubmit={ (event) => { event.preventDefault(); submit(input.value); close(); } }>
            { content }
            <Input placeholder="Enter here" v-model={ input.value } class="dialog-input"/>
        </form>,
        cancel ? cancel : (() => close()),
    )
    return close;
}