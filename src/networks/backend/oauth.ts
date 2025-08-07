import {sendRequest, Target} from "../utils/sendRequest.ts";
import {checkResponse} from "../utils/checkResponse.ts";
import {useUser} from "../../stores/user.ts";

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