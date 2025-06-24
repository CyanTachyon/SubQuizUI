import type { Class, ClassWithMembers, Seiue } from "../../dataClasses/Class";
import type { ClassId, PreparationGroupId, UserId } from "../../dataClasses/Ids";
import type { Slice } from "../../dataClasses/Slice";
import { checkResponse } from "../utils/checkResponse";
import { sendRequest, Target } from "../utils/sendRequest";

const getClassListUrl = '/class/list';
export async function getClassList(userId: UserId | null, group: PreparationGroupId | null, begin: number, count: number)
{
    return await checkResponse<Slice<ClassWithMembers>>(sendRequest({
        target: Target.BACKEND,
        url: getClassListUrl,
        method: 'GET',
        params: { userId, group, begin, count },
    }));
}

const createClassUrl = '/class/create';
export async function createClass(name: string, group: PreparationGroupId | null)
{
    return await checkResponse<ClassId>(sendRequest({
        target: Target.BACKEND,
        url: createClassUrl,
        method: 'POST',
        data: { name, group },
    }));
}

const updateClassUrl = '/class';
export async function updateClass(clazz: Class)
{
    return await checkResponse<null>(sendRequest({
        target: Target.BACKEND,
        url: updateClassUrl,
        method: 'PUT',
        data: clazz,
    }));
}

const getClassUrl = '/class/{id}';
export async function getClass(id: ClassId)
{
    return await checkResponse<ClassWithMembers>(sendRequest({
        target: Target.BACKEND,
        url: getClassUrl,
        method: 'GET',
        params: { id },
    }));
}

const deleteClassUrl = '/class/{id}';
export async function deleteClass(id: ClassId)
{
    return await checkResponse<null>(sendRequest({
        target: Target.BACKEND,
        url: deleteClassUrl,
        method: 'DELETE',
        params: { id },
    }));
}

const addClassMembersUrl = '/class/{id}/members';
export async function addClassMembers(classId: ClassId, members: Seiue[])
{
    return await checkResponse<null>(sendRequest({
        target: Target.BACKEND,
        url: addClassMembersUrl,
        method: 'POST',
        params: { id: classId },
        data: members
    }));
}

const removeClassMembersUrl = '/class/{id}/members';
export async function removeClassMember(id: ClassId, studentId: string)
{
    return await checkResponse<null>(sendRequest({
        target: Target.BACKEND,
        url: removeClassMembersUrl,
        method: 'DELETE',
        params: { id, studentId },
    }));
}