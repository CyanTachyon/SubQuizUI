import type { KnowledgePointId, PreparationGroupId } from "../../dataClasses/Ids";
import type { KnowledgePoint } from "../../dataClasses/KnowledgePoint";
import { checkResponse } from "../utils/checkResponse";
import { sendRequest, Target } from "../utils/sendRequest";

export interface KnowledgePointTree
{
    info: KnowledgePoint;
    children: KnowledgePointTree[];
}

const getKnowledgePointListUrl = '/knowledgePoint/list/{group}'

export async function getKnowledgePointList(group: PreparationGroupId)
{
    return await checkResponse<KnowledgePointTree[]>(sendRequest({
        target: Target.BACKEND,
        url: getKnowledgePointListUrl,
        method: 'GET',
        params: {group},
    }));
}

const getKnowledgePointUrl = '/knowledgePoint/{id}'

export async function getKnowledgePoint(id: KnowledgePointId): Promise<KnowledgePoint>
{
    return await checkResponse<KnowledgePoint>(sendRequest({
        target: Target.BACKEND,
        url: getKnowledgePointUrl,
        method: 'GET',
        params: {id},
    }));
}

export async function deleteKnowledgePoint(id: KnowledgePointId)
{
    return await checkResponse<null>(sendRequest({
        target: Target.BACKEND,
        url: getKnowledgePointUrl,
        method: 'DELETE',
        params: {id},
    }));
}

const knowledgePointUrl = '/knowledgePoint'

export async function createKnowledgePoint(knowledgePoint: Omit<KnowledgePoint, 'id'>)
{
    return await checkResponse<KnowledgePoint>(sendRequest({
        target: Target.BACKEND,
        url: knowledgePointUrl,
        method: 'POST',
        data: knowledgePoint,
    }));
}

export async function updateKnowledgePoint(knowledgePoint: KnowledgePoint)
{
    return await checkResponse<KnowledgePoint>(sendRequest({
        target: Target.BACKEND,
        url: knowledgePointUrl,
        method: 'PUT',
        data: knowledgePoint,
    }));
}