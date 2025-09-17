import type { ClassMember } from "../../dataClasses/Class";
import type { ClassId, PracticeId, QuizId } from "../../dataClasses/Ids";
import type { Practice } from "../../dataClasses/Practice";
import type { AnswerType } from "../../dataClasses/Question";
import type { Quiz } from "../../dataClasses/Quiz";
import type { Slice } from "../../dataClasses/Slice";
import { checkResponse } from "../utils/checkResponse";
import { sendRequest, Target } from "../utils/sendRequest";

const practiceUrl = '/practice';

export async function createPractice(practice: Omit<Practice, 'id'>)
{
    return await checkResponse<PracticeId>(sendRequest({
        target: Target.BACKEND,
        url: practiceUrl,
        method: 'POST',
        data: { ...practice, id: 0 },
    }));
}

export async function updatePractice(practice: Practice)
{
    return await checkResponse<null>(sendRequest({
        target: Target.BACKEND,
        url: practiceUrl,
        method: 'PUT',
        data: practice,
    }));
}

const getPracticesUrl = '/practice/list';

export async function getPractices(clazz: ClassId, begin: number, count: number)
{
    return await checkResponse<Slice<Practice>>(sendRequest({
        target: Target.BACKEND,
        url: getPracticesUrl,
        method: 'GET',
        params: {'class': clazz, begin, count},
    }));
}

const getUnfinishedPracticesUrl = '/practice/unfinished';

export async function getUnfinishedPractices()
{
    return await checkResponse<Practice[]>(sendRequest({
        target: Target.BACKEND,
        url: getUnfinishedPracticesUrl,
        method: 'GET',
    }));
}

const practiceIdUrl = '/practice/{id}';

interface GetPracticeResult
{
    practice: Practice;
    quizzes: Quiz<AnswerType | null, AnswerType | null, any | null>[];
    completed: boolean;
    users: {
        member: ClassMember;
        completed: boolean;
        accuracy: number | null;
    }[];
}

export async function getPractice(id: PracticeId)
{
    return await checkResponse<GetPracticeResult>(sendRequest({
        target: Target.BACKEND,
        url: practiceIdUrl,
        method: 'GET',
        params: {id},
    }));
}

export async function deletePractice(id: PracticeId)
{
    return await checkResponse<null>(sendRequest({
        target: Target.BACKEND,
        url: practiceIdUrl,
        method: 'DELETE',
        params: {id},
    }));
}

const startPracticeUrl = '/practice/{id}/start';

export async function startPractice(id: PracticeId)
{
    return await checkResponse<QuizId>(sendRequest({
        target: Target.BACKEND,
        url: startPracticeUrl,
        method: 'POST',
        params: {id},
    }));
}
