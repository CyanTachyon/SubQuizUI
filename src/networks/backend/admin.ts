import type {Slice} from "../../dataClasses/Slice.ts";
import type {PreparationGroupId, UserId} from "../../dataClasses/Ids.ts";
import {checkResponse} from "../utils/checkResponse.ts";
import {sendRequest, Target} from "../utils/sendRequest.ts";
import type {Permission} from "../../dataClasses/Permission.ts";

export interface AdminInfo
{
    user: UserId;
    permission: Permission;
}

const subjectAdminListUrl = '/admin/group/{group}/list';

export async function getGroupAdminList(group: PreparationGroupId, begin: number, count: number)
{
    return await checkResponse<Slice<AdminInfo>>(sendRequest({
        target: Target.BACKEND,
        url: subjectAdminListUrl,
        method: 'GET',
        params: {begin, count, group},
    }));
}

const userPermissionInGroupUrl = '/admin/group/{group}/user/{uid}';

export async function getUserPermissionInGroup(group: PreparationGroupId, uid: UserId)
{
    return await checkResponse<Permission>(sendRequest({
        target: Target.BACKEND,
        url: userPermissionInGroupUrl,
        method: 'GET',
        params: {group, uid},
    }));
}

export async function changeUserPermissionInGroup(group: PreparationGroupId, uid: UserId, permission: Permission)
{
    return await checkResponse(sendRequest({
        target: Target.BACKEND,
        url: userPermissionInGroupUrl,
        method: 'PUT',
        data: {'data': permission},
        params: {group, uid},
    }));
}

const globalAdminListUrl = '/admin/global/list';

export async function getGlobalAdminList(begin: number, count: number)
{
    return await checkResponse<Slice<AdminInfo>>(sendRequest({
        target: Target.BACKEND,
        url: globalAdminListUrl,
        method: 'GET',
        params: {begin, count},
    }));
}

const userPermissionGlobalUrl = '/admin/global/user/{uid}';

export async function changeUserPermissionGlobal(uid: UserId, permission: Permission)
{
    return await checkResponse(sendRequest({
        target: Target.BACKEND,
        url: userPermissionGlobalUrl,
        method: 'PUT',
        data: {'data': permission},
        params: {uid},
    }));
}