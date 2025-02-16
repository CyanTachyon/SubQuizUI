import {checkResponse} from "../utils/checkResponse.ts";
import type {SubjectId} from "../../dataClasses/Ids.ts";
import {sendRequest, Target} from "../utils/sendRequest.ts";
import type {Subject} from "../../dataClasses/Subject.ts";
import type { Slice } from "../../dataClasses/Slice.ts";

const newSubjectUrl = '/subject'
export async function newSubject(name: string, description: string)
{
    return await checkResponse<SubjectId>(sendRequest({
        target: Target.BACKEND,
        url: newSubjectUrl,
        method: 'POST',
        data: {name, description},
    }));
}

const getSubjectUrl = '/subject/{id}'
export async function getSubject(id: number)
{
    return await checkResponse<Subject>(sendRequest({
        target: Target.BACKEND,
        url: getSubjectUrl,
        method: 'GET',
        params: {id},
    }));
}

const modifySubjectUrl = '/subject/{id}'
export async function modifySubject(id: number, name: string, description: string)
{
    return await checkResponse<null>(sendRequest({
        target: Target.BACKEND,
        url: modifySubjectUrl,
        method: 'PUT',
        data: {name, description},
        params: {id},
    }));
}

const getSubjectListUrl = '/subject/list'
export async function getSubjectList(begin: number, count: number)
{
    return await checkResponse<Slice<Subject>>(sendRequest({
        target: Target.BACKEND,
        url: getSubjectListUrl,
        method: 'GET',
        params: {begin, count},
    }));
}