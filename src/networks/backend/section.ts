import type {KnowledgePointId, SectionTypeId} from "../../dataClasses/Ids.ts";
import {checkResponse} from "../utils/checkResponse.ts";
import {sendRequest, Target} from "../utils/sendRequest.ts";
import type {SectionType} from "../../dataClasses/SectionType.ts";
import type {Section} from "../../dataClasses/Section.ts";
import type {Slice} from "../../dataClasses/Slice.ts";
import type { AnswerType } from "../../dataClasses/Question.ts";

const newSectionTypeUrl = "/section/type"
export function newSectionType(knowledgePoint: KnowledgePointId, name: string)
{
    return checkResponse<SectionTypeId>(sendRequest({
        target: Target.BACKEND,
        url: newSectionTypeUrl,
        method: 'POST',
        data: {knowledgePoint, name},
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

const modifySectionTypeUrl = "/section/type"
export function modifySectionType(id: number, knowledgePoint: KnowledgePointId, name: string)
{
    return checkResponse<null>(sendRequest({
        target: Target.BACKEND,
        url: modifySectionTypeUrl,
        method: 'PUT',
        data: {id, knowledgePoint, name},
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
export function getSectionTypeList(knowledge: KnowledgePointId)
{
    return checkResponse<SectionType[]>(sendRequest({
        target: Target.BACKEND,
        url: getSectionTypeListUrl,
        method: 'GET',
        params: {knowledge},
    }));
}

const newSectionUrl = "/section"
export function newSection(section: Omit<Section<AnswerType, null, any>, 'id'>)
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
    return checkResponse<Section<AnswerType, null, any>>(sendRequest({
        target: Target.BACKEND,
        url: getSectionUrl,
        method: 'GET',
        params: {id},
    }));
}

const modifySectionUrl = "/section"
export function modifySection(section: Section<AnswerType, null, string>)
{
    return checkResponse<null>(sendRequest({
        target: Target.BACKEND,
        url: modifySectionUrl,
        method: 'PUT',
        data: section,
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
export function getSectionList(begin: number, count: number, knowledge: KnowledgePointId, type?: SectionTypeId)
{
    return checkResponse<Slice<Section<AnswerType, null, string>>>(sendRequest({
        target: Target.BACKEND,
        url: getSectionListUrl,
        method: 'GET',
        params: {begin, count, knowledge, type},
    }));
}

const sectionImageUrl = "/section/{id}/image"

export function addSectionImage(sectionId: number, type: 'GIF' | 'JPEG' | 'PNG' | 'SVG' | 'XIcon', md5: string)
{
    return checkResponse<{
        uploadUrl: string | null,
        imageId: string
    }>(sendRequest({
        target: Target.BACKEND,
        url: sectionImageUrl,
        method: 'POST',
        params: {id: sectionId, type, md5},
    }));
}

export function removeSectionImage(sectionId: number, md5: string)
{
    return checkResponse<null>(sendRequest({
        target: Target.BACKEND,
        url: sectionImageUrl,
        method: 'DELETE',
        params: {id: sectionId, md5},
    }));
}

export function getSectionImages(sectionId: number)
{
    return checkResponse<string[]>(sendRequest({
        target: Target.BACKEND,
        url: sectionImageUrl,
        method: 'GET',
        params: {id: sectionId},
    }));
}