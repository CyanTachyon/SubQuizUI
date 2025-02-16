export enum Permission
{
    BANNED = 'BANNED',
    NORMAL = 'NORMAL',
    ADMIN = 'ADMIN',
    ROOT = 'ROOT',
}


export function isAdmin(permission: Permission): boolean
{
    return permission === Permission.ADMIN || permission === Permission.ROOT;
}

export function permissionFromNumber(permission: number): Permission
{
    switch (permission)
    {
        case 0:
            return Permission.BANNED;
        case 1:
            return Permission.NORMAL;
        case 2:
            return Permission.ADMIN;
        case 3:
            return Permission.ROOT;
        default:
            return Permission.NORMAL;
    }
}

export function permissionToNumber(permission: Permission): number
{
    switch (permission)
    {
        case Permission.BANNED:
            return 0;
        case Permission.NORMAL:
            return 1;
        case Permission.ADMIN:
            return 2;
        case Permission.ROOT:
            return 3;
        default:
            return 1;
    }
}  
