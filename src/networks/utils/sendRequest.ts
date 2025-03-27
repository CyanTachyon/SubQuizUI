import { Capacitor } from "@capacitor/core";
import type {ResponseBody} from "../../dataClasses/ResponseBody.ts";
export enum Target
{
    EMPTY = 0,
    SSO_BACKEND = 1,
    SSO_FRONTEND = 2,
    BACKEND = 3,
    FRONTEND = 4,
}

export function connectUrl(target: Target | undefined, url: string, params: Record<string, string> = {})
{

    let rUrl: string;
    if (!target) rUrl = url;
    else
    {
        if (!url.startsWith('/')) url = '/' + url;
        if (target === Target.SSO_BACKEND) rUrl = environment.ssoBackend + url;
        else if (target === Target.SSO_FRONTEND) rUrl = environment.ssoFrontend + url;
        else if (target === Target.BACKEND) rUrl = Capacitor.getPlatform() === 'web' ? environment.backend + url : environment.androidBackend + url;
        else /*if (target === Target.FRONTEND)*/ rUrl = environment.frontend + url;
    }

    if (params)
    {
        rUrl += '?';
        for (let key in params)
        {
            let rValue = params[key];
            if (rValue === undefined) continue;
            if (rUrl.indexOf(`{${key}}`) !== -1)
            {
                rUrl = rUrl.replace(`{${key}}`, params[key]);
                continue;
            }
            let encodedKey = encodeURIComponent(key);
            let encodedValue = encodeURIComponent(`${rValue}`);
            rUrl += `${encodedKey}=${encodedValue}&`;
        }
        rUrl = rUrl.slice(0, -1);
    }
    return rUrl;
}

export interface RequestData
{
    target?: Target;
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    params?: Record<string, any>;
    withToken?: boolean;
    data?: object;
}

export async function sendRequest<DATA>(data: RequestData): Promise<ResponseBody<DATA>>
{
    if (data.params === undefined) data.params = {};
    if (data.withToken === undefined) data.withToken = true;

    return request<ResponseBody<DATA>>(
        connectUrl(data.target, data.url, data.params),
        data.method,
        {
            'Authorization': data.withToken ? `Bearer ${localStorage.getItem('token')}` : '',
            'Content-Type': 'application/json',
            'Accept': '*/*',
        },
        data.data
    )
}

export async function request<T>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    headers: Record<string, string>,
    body: object | undefined
): Promise<T>
{
    let data: RequestInit = {
        method: method,
        headers: headers,
    }
    if (body) data.body = JSON.stringify(body);
    return fetch(url, data).then(response => response.json() as Promise<T>);
}