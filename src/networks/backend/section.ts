import type {SectionTypeId, SubjectId} from "../../dataClasses/Ids.ts";
import {checkResponse} from "../utils/checkResponse.ts";
import {sendRequest, Target} from "../utils/sendRequest.ts";
import type {SectionType} from "../../dataClasses/SectionType.ts";
import type {Section} from "../../dataClasses/Section.ts";
import type {Slice} from "../../dataClasses/Slice.ts";
import type { AnswerType } from "../../dataClasses/Question.ts";

const newSectionTypeUrl = "/section/type"
export function newSectionType(subject: SubjectId, name: string, description: string)
{
    return checkResponse<SectionTypeId>(sendRequest({
        target: Target.BACKEND,
        url: newSectionTypeUrl,
        method: 'POST',
        data: {subject, name, description},
    }));
}

const getSectionTypeUrl = "/section/type/{id}"
export function getSectionType(id: number)
{
    return checkResponse<SectionType>(sendRequest({
        target: Target.BACKEND,
        url: getSectionTypeUrl,
        method: 'GET',
        params: {id},
    }));
}

const modifySectionTypeUrl = "/section/type/{id}"
export function modifySectionType(id: number, subject: SubjectId, name: string, description: string)
{
    return checkResponse<null>(sendRequest({
        target: Target.BACKEND,
        url: modifySectionTypeUrl,
        method: 'PUT',
        data: {subject, name, description},
        params: {id},
    }));
}

const deleteSectionTypeUrl = "/section/type/{id}"
export function deleteSectionType(id: number)
{
    return checkResponse<null>(sendRequest({
        target: Target.BACKEND,
        url: deleteSectionTypeUrl,
        method: 'DELETE',
        params: {id},
    }));
}

const getSectionTypeListUrl = "/section/type/list"
export function getSectionTypeList(begin: number, count: number, subject?: SubjectId)
{
    return checkResponse<Slice<SectionType>>(sendRequest({
        target: Target.BACKEND,
        url: getSectionTypeListUrl,
        method: 'GET',
        params: {begin, count, subject},
    }));
}

const newSectionUrl = "/section"
export function newSection(section: Omit<Section<AnswerType, null, string>, 'id'>)
{
    return checkResponse<SectionTypeId>(sendRequest({
        target: Target.BACKEND,
        url: newSectionUrl,
        method: 'POST',
        data: section,
    }));
}

const getSectionUrl = "/section/{id}"
export function getSection(id: number)
{
    return checkResponse<Section<AnswerType, null, string>>(sendRequest({
        target: Target.BACKEND,
        url: getSectionUrl,
        method: 'GET',
        params: {id},
    }));
}

const modifySectionUrl = "/section/{id}"
export function modifySection(section: Section<AnswerType, null, string>)
{
    return checkResponse<null>(sendRequest({
        target: Target.BACKEND,
        url: modifySectionUrl,
        method: 'PUT',
        data: section,
        params: {id: section.id},
    }));
}

const deleteSectionUrl = "/section/{id}"
export function deleteSection(id: number)
{
    return checkResponse<null>(sendRequest({
        target: Target.BACKEND,
        url: deleteSectionUrl,
        method: 'DELETE',
        params: {id},
    }));
}

const getSectionListUrl = "/section/list"
export function getSectionList(begin: number, count: number, subject?: SubjectId, type?: SectionTypeId)
{
    return checkResponse<Slice<Section<AnswerType, null, string>>>(sendRequest({
        target: Target.BACKEND,
        url: getSectionListUrl,
        method: 'GET',
        params: {begin, count, subject, type},
    }));
}