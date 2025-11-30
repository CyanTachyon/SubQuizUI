import type {ResponseBody} from "../../dataClasses/ResponseBody.ts";
import clientVersion from "../../../public/android_latest.json";
import { checkResponse } from "./checkResponse.ts";
import { useUser } from "../../stores/user.ts";
import { useNotification } from "../../stores/notification.ts";
import { sleep } from "../../utils/sleep.ts";
import { Capacitor } from "@capacitor/core";
export enum Target
{
    EMPTY = 0,
    SSO_BACKEND = 1,
    SSO_FRONTEND = 2,
    CDN = 3,
    BACKEND = 4,
    FRONTEND = 5,
}

export function connectUrl(target: Target | string | undefined, url: string, params: Record<string, any> = {})
{

    let rUrl: string;
    if (!target) rUrl = url;
    else
    {
        if (!url.startsWith('/')) url = '/' + url;
        if (target === Target.SSO_BACKEND) rUrl = environment.ssoBackend + url;
        else if (target === Target.SSO_FRONTEND) rUrl = environment.ssoFrontend + url;
        else if (target === Target.CDN) rUrl = environment.cdn + url;
        else if (target === Target.BACKEND) rUrl = environment.backend + url;
        else if (target === Target.FRONTEND) 
        {
            if (Capacitor.getPlatform() === 'web') rUrl = location.origin + url;
            else rUrl = environment.frontend + url;
        }
        else rUrl = target + url;
    }

    if (Object.keys(params).length > 0)
    {
        if (rUrl.indexOf('?') !== -1) rUrl += '&';
        else rUrl += '?';
        for (let key in params)
        {
            let rValue = params[key];
            if (rValue === undefined) continue;
            if (rUrl.indexOf(`{${key}}`) !== -1)
            {
                rUrl = rUrl.replace(`{${key}}`, encodeURIComponent(`${rValue}`));
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
    data?: any;
}

export async function sendRequest<DATA>(data: RequestData): Promise<ResponseBody<DATA>>
{
    if (data.params === undefined) data.params = {};
    if (data.withToken === undefined) data.withToken = true;

    return request(
        connectUrl(data.target, data.url, data.params),
        data.method,
        {},
        data.withToken,
        data.data
    ).then(response => response.json() as Promise<ResponseBody<DATA>>)
}

export interface SseChunk
{
    event: string;
    data: string;
}
export async function sseRequest(
    data: RequestData,
    onMessage: (chunk: SseChunk) => void
) 
{
    if (data.params === undefined) data.params = {};
    if (data.withToken === undefined) data.withToken = true;
    const req = await request(connectUrl(data.target, data.url, data.params), data.method, {}, data.withToken, data.data);

    let ok = req.headers.get('Content-Type')?.startsWith('text/event-stream');
    if (!ok) return checkResponse(req.json());

    const reader = req.body.getReader();
    const decoder = new TextDecoder();
    const onChunk = chunk =>
    {
        const parts = chunk.split(/\n|\r/).filter(part => part.trim() !== '');
        let data = '';
        let event = '';
        for (const part of parts)
        {
            if (part.startsWith('data: ')) 
            {
                if (data.length > 0) data += '\n';
                data += part.slice(6);
            }
            if (part.startsWith('event: '))
            {
                if (event.length > 0) event += '\n';
                event += part.slice(7);
            }
        }
        onMessage({ event, data });
    };

    let last = '';

    while (true)
    {
        const { value, done } = await reader.read();
        if (done) 
        {
            if (last) onChunk(last);
            break;
        }

        const decoded = last + decoder.decode(value);
        const chunks = decoded.split(/\r?\n\r?\n/);
        last = chunks.pop() || '';
        chunks.filter(part => part.trim() !== '').forEach(onChunk);
    }    
}

let networkErrorId = 0n;
export async function request(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    headers: Record<string, string>,
    withToken: boolean = true,
    body: object | undefined
): Promise<Response>
{
    let data: RequestInit = {
        method: method,
        headers: headers,
    }
    if (body !== undefined) 
    {
        data.body = typeof body === 'string' ? body : JSON.stringify(body);
        data.headers['Content-Type'] = 'application/json';
    }
    data.headers['Accept'] = '*/*';
    data.headers['Authorization'] = withToken && useUser().getToken() ? `Bearer ${useUser().getToken()}` : '';
    data.headers['X-Client-Version'] = clientVersion.versionCode;
    while (true)
    {
        try
        {
            return await fetch(url, data);
        }
        catch (e)
        {
            console.error(e);
            let id = 0n;
            if (networkErrorId === 0n) id = useNotification().add({
                message: `网络错误，请检查网络连接`,
                type: 'error',
                timeout: 1200,
            });
            if (id) networkErrorId = id;
            console.log(networkErrorId);
            await sleep(1000);
            if (networkErrorId === id) networkErrorId = 0n;
        }
    }
}