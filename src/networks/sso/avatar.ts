import icon from '../../assets/icon.svg';

export function avatarUrl(id?: number)
{
    if (id) return environment.ssoBackend + "/avatar/" + id;
    else return icon;
}