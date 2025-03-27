import {checkResponse, ResponseError} from "../utils/checkResponse.ts";
import type {Quiz} from "../../dataClasses/Quiz.ts";
import {sendRequest, Target} from "../utils/sendRequest.ts";
import type {Slice} from "../../dataClasses/Slice.ts";
import type {AnswerType} from "../../dataClasses/Question.ts";
const newQuizUrl = '/quiz/new';
export async function newQuiz(count: number, subjectId?: number)
{
    try
    {
        return await checkResponse<Quiz<null, null, null>>(sendRequest({
            target: Target.BACKEND,
            url: newQuizUrl,
            method: 'POST',
            params: {count, subjectId},
        }));
    }
    catch (e)
    {
        if (e instanceof ResponseError && e.response.code === 406) return e.response.data as Quiz<null, AnswerType | null, null>;
        throw e;
    }
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

const getQuizAnalysisUrl = '/quiz/{id}/analysis';
export async function getQuizAnalysis(id: number): Promise<Quiz<AnswerType, AnswerType, string> | null>
{
    return await checkResponse<Quiz<AnswerType, AnswerType, string> | null>(sendRequest({
        target: Target.BACKEND,
        url: getQuizAnalysisUrl,
        method: 'GET',
        params: {id},
    }));
}

const getQuizHistoryUrl = '/quiz/histories';
export async function getQuizHistories(begin: number, count: number)
{
    return await checkResponse<Slice<Quiz<AnswerType, AnswerType, string>>>(sendRequest({
        target: Target.BACKEND,
        url: getQuizHistoryUrl,
        method: 'GET',
        params: {begin, count},
    }));
}