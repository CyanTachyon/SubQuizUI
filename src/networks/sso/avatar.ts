import {useUser} from "../../stores/user.ts";

export function avatarUrl(id?: number)
{
    if (!id)
    {
        let user = useUser();
        id = user.user?.id;
    }
    if (id) return environment.ssoBackend + "/avatar/" + id;
    else return '';
}