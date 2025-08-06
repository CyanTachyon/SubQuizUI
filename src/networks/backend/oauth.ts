import {sendRequest, Target} from "../utils/sendRequest.ts";
import {checkResponse} from "../utils/checkResponse.ts";
import {useUser} from "../../stores/user.ts";
import { setToken } from "../../utils/utils.tsx";

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
    setToken(res.data);
    checkResponse(Promise.resolve(res)).finally(() => useUser().reload());
}