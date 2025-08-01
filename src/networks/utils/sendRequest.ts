import type {ResponseBody} from "../../dataClasses/ResponseBody.ts";
import clientVersion from "../../../public/android_latest.json";
import { getToken } from "../../utils/utils.tsx";
import { checkResponse } from "./checkResponse.ts";
export enum Target
{
    EMPTY = 0,
    SSO_BACKEND = 1,
    SSO_FRONTEND = 2,
    CDN = 3,
    BACKEND = 4,
    FRONTEND = 5,
}

export function connectUrl(target: Target | undefined, url: string, params: Record<string, any> = {})
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
        else /*if (target === Target.FRONTEND)*/ rUrl = environment.frontend + url;
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
    data?: object;
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
        data.body = JSON.stringify(body);
        data.headers['Content-Type'] = 'application/json';
    }
    data.headers['Accept'] = '*/*';
    data.headers['Authorization'] = withToken ? `Bearer ${await getToken()}` : '';
    data.headers['X-Client-Version'] = clientVersion.versionCode;
    return fetch(url, data)
}