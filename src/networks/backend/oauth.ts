import {sendRequest, Target} from "../utils/sendRequest.ts";
import {checkResponse} from "../utils/checkResponse.ts";
import {useUser} from "../../stores/user.ts";
import { useNotification } from "../../stores/notification.ts";

const loginUrl = '/oauth/login'

export async function login(code: string)
{
    let res = await sendRequest<string>({
        target: Target.BACKEND,
        url: loginUrl,
        method: 'POST',
        withToken: false,
        data: {code},
    })
    useUser().login(res.data);
    checkResponse(Promise.resolve(res)).finally(() => useUser().reload());
}

const customLoginUrl = '/oauth/custom/login';

export async function customLogin(id: number, password: string)
{
    let res = await sendRequest<string>({
        target: Target.BACKEND,
        url: customLoginUrl,
        method: 'POST',
        withToken: false,
        data: {id, password},
    })
    useUser().login(res.data);
    if (res.code === 401)
    {
        useNotification().addError('用户ID或密码错误');
        throw new Error('用户ID或密码错误');
    }
    checkResponse(Promise.resolve(res)).finally(() => useUser().reload());
}
