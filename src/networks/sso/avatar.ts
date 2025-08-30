import icon from '../../assets/icon.svg';

export function avatarUrl(id?: number)
{
    if (id > 0) return environment.ssoBackend + "/avatar/" + id;
    else return icon;
}