import type {Permission} from "./Permission.ts";

export interface SeiueInfo
{
    studentId: string;
    realName: string;
    archived: boolean;
}

export interface UserInfo extends BasicUserInfo
{
    id: number;
    username: string;
    registerTime: bigint;
    permission: Permission;
    phone: string;
    email: string[];
    seiue: SeiueInfo[];
}

export interface BasicUserInfo
{
    id: number;
    username: string;
    registerTime: bigint;
    email: string[];
}