import {sendRequest, Target} from "../utils/sendRequest.ts";
import {checkResponse} from "../utils/checkResponse.ts";
import {setToken} from "../../utils/utils.ts";
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
    let token = res.data;
    if (token) setToken(token);
    await checkResponse(Promise.resolve(res));
    let user = useUser()
    user.reload();
}