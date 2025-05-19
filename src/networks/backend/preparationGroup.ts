import type { PreparationGroupId, SubjectId } from "../../dataClasses/Ids";
import type { PreparationGroup } from "../../dataClasses/PreparationGroup";
import { checkResponse } from "../utils/checkResponse";
import { sendRequest, Target } from "../utils/sendRequest";

const preparationGroupListUrl = '/preparationGroup/list';

export async function getPreparationGroupList(subject: SubjectId)
{
    return await checkResponse<PreparationGroup[]>(sendRequest({
        target: Target.BACKEND,
        url: preparationGroupListUrl,
        method: 'GET',
        params: {subject},
    }));
}

const getPreparationGroupUrl = '/preparationGroup/{id}'
export async function getPreparationGroup(id: PreparationGroupId): Promise<PreparationGroup>
{
    return await checkResponse<PreparationGroup>(sendRequest({
        target: Target.BACKEND,
        url: getPreparationGroupUrl,
        method: 'GET',
        params: {id},
    }));
}

const preparationGroupUrl = '/preparationGroup'
export async function createPreparationGroup(preparationGroup: Omit<Omit<PreparationGroup, "id">, "time">)
{
    return await checkResponse<PreparationGroupId>(sendRequest({
        target: Target.BACKEND,
        url: preparationGroupUrl,
        method: 'POST',
        data: preparationGroup,
    }));
}

export async function updatePreparationGroup(preparationGroup: Omit<PreparationGroup, "time">)
{
    return await checkResponse<null>(sendRequest({
        target: Target.BACKEND,
        url: preparationGroupUrl,
        method: 'PUT',
        data: preparationGroup,
    }));
}