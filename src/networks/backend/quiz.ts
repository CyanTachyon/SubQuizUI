import {checkResponse} from "../utils/checkResponse.ts";
import type {Quiz} from "../../dataClasses/Quiz.ts";
import {sendRequest, Target} from "../utils/sendRequest.ts";
import type {Slice} from "../../dataClasses/Slice.ts";
import type {AnswerType} from "../../dataClasses/Question.ts";
import type { KnowledgePointId } from "../../dataClasses/Ids.ts";
const newQuizUrl = '/quiz/new';
export async function newQuiz(count: number, knowledgePoints: KnowledgePointId[] | null)
{
    return await checkResponse<Quiz<null, null, null>>(sendRequest({
        target: Target.BACKEND,
        url: newQuizUrl,
        method: 'POST',
        params: {count},
        data: knowledgePoints,
    }));
}

const saveQuizUrl = '/quiz/{id}/save';
export async function saveQuiz(id: number, data: Quiz<any, AnswerType | null, any>, finish: boolean = false)
{
    return await checkResponse<null>(sendRequest({
        target: Target.BACKEND,
        url: saveQuizUrl,
        method: 'PUT',
        data: data,
        params: {id, finish},
    }));
}

const getQuizUrl = '/quiz/{id}';
export async function getQuiz(id: number): Promise<Quiz<AnswerType | null, AnswerType | null, any | null> | null>
{
    return await checkResponse<Quiz<AnswerType | null, AnswerType | null, any | null> | null>(sendRequest({
        target: Target.BACKEND,
        url: getQuizUrl,
        method: 'GET',
        params: {id},
    }));
}

const getUnfinishedQuizzesUrl = '/quiz/unfinished';
export async function getUnfinishedQuizzes(): Promise<Quiz<null, AnswerType | null, null>[]>
{
    return await checkResponse<Quiz<null, AnswerType | null, null>[]>(sendRequest({
        target: Target.BACKEND,
        url: getUnfinishedQuizzesUrl,
        method: 'GET',
    }));
}

const getQuizHistoryUrl = '/quiz/histories';
export async function getQuizHistories(begin: number, count: number)
{
    return await checkResponse<Slice<Quiz<AnswerType | null, AnswerType | null, any | null>>>(sendRequest({
        target: Target.BACKEND,
        url: getQuizHistoryUrl,
        method: 'GET',
        params: {begin, count},
    }));
}