import type {ResponseBody} from "../../dataClasses/ResponseBody.ts";
import {safeRedirect} from "../../utils/redirect.ts";
import {connectUrl, Target} from "./sendRequest.ts";
import {tryLogin} from "../../utils/utils.ts";
import {useNotificationStore} from "../../stores/notification.ts";

export class ResponseError extends Error
{
    response: ResponseBody<any>;

    constructor(response: ResponseBody<any>)
    {
        super(response.message);
        this.response = response;
    }
}

export function success<DATA>(response: ResponseBody<DATA>)
{
    return response.code >= 200 && response.code < 300;
}

function defaultOnFail<T>(response: ResponseBody<T>): T
{
    if (response.code === 417)
    {
        safeRedirect(connectUrl(Target.SSO_FRONTEND, '/authorize/' + environment.ssoServiceId, {from: location.href}));
    }
    else if (response.code === 401)
    {
        tryLogin();
    }
    let error = new ResponseError(response);
    const notifications = useNotificationStore()
    notifications.add({
        type: 'error',
        message: `错误：${response.message}`,
    })
    throw error;
}

export async function checkResponse<DATA>(
    response_: Promise<ResponseBody<DATA>>,
    onFail: (
        response: ResponseBody<DATA>,
        defaultOnFail: (response: ResponseBody<DATA>) => DATA,
    ) => (DATA | Promise<DATA>) = defaultOnFail,
): Promise<DATA>
{
    let response: ResponseBody<DATA>
    try
    {
        response = await response_
    }
    catch (e)
    {
        const notifications = useNotificationStore()
        if (e instanceof Error) notifications.add({type: 'error', message: `错误：${e.message}`})
        else notifications.add({type: 'error', message: `错误：${e}`})
        throw e
    }
    if (success(response)) return response.data as DATA;
    return onFail(response, defaultOnFail);
}