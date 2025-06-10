import type {ResponseBody} from "../../dataClasses/ResponseBody.ts";
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
    data.headers['Authorization'] = withToken ? `Bearer ${localStorage.getItem('token')}` : '';
    return fetch(url, data)
}