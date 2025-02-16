import type {Slice} from "../../dataClasses/Slice.ts";
import type {SubjectId, UserId} from "../../dataClasses/Ids.ts";
import {checkResponse} from "../utils/checkResponse.ts";
import {sendRequest, Target} from "../utils/sendRequest.ts";
import type {Permission} from "../../dataClasses/Permission.ts";

export interface AdminInfo
{
    user: UserId;
    permission: Permission;
}

const subjectAdminListUrl = '/admin/subject/{sid}/list';

export async function getSubjectAdminList(sid: SubjectId, begin: number, count: number)
{
    return await checkResponse<Slice<AdminInfo>>(sendRequest({
        target: Target.BACKEND,
        url: subjectAdminListUrl,
        method: 'GET',
        params: {begin, count, sid},
    }));
}

const userPermissionInSubjectUrl = '/admin/subject/{sid}/user/{uid}';

export async function getUserPermissionInSubject(sid: SubjectId, uid: UserId)
{
    return await checkResponse<Permission>(sendRequest({
        target: Target.BACKEND,
        url: userPermissionInSubjectUrl,
        method: 'GET',
        params: {sid, uid},
    }));
}

export async function changeUserPermissionInSubject(sid: SubjectId, uid: UserId, permission: Permission)
{
    return await checkResponse(sendRequest({
        target: Target.BACKEND,
        url: userPermissionInSubjectUrl,
        method: 'PUT',
        data: {'data': permission},
        params: {sid, uid},
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