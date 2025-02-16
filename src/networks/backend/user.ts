import type {BasicUserInfo, UserInfo} from "../../dataClasses/User.ts";
import {sendRequest, Target} from "../utils/sendRequest.ts";
import {checkResponse} from "../utils/checkResponse.ts";

const userInfoUrl = '/user/info/{uid}'

export async function getUserInfo(uid?: number): Promise<UserInfo | BasicUserInfo | null>
{
    if (!uid) uid = 0;
    return checkResponse(sendRequest<UserInfo | BasicUserInfo | null>({
        target: Target.BACKEND,
        url: userInfoUrl,
        method: 'GET',
        params: {uid},
    }), (res, defaultOnFail) =>
    {
        if (res.code === 404 || res.code === 401) return null;
        return defaultOnFail(res);
    });
}