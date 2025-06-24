import type { Exam } from "../../dataClasses/Exam";
import type { ExamId } from "../../dataClasses/Ids";
import type { AnswerType } from "../../dataClasses/Question";
import type { Quiz } from "../../dataClasses/Quiz";
import { checkResponse, ResponseError } from "../utils/checkResponse";
import { sendRequest, Target } from "../utils/sendRequest";

const getExamsUrl = "/exam/class/{class}";

export async function getExams(classId: number)
{
    return await checkResponse<Exam[]>(sendRequest({
        target: Target.BACKEND,
        url: getExamsUrl,
        method: 'GET',
        params: {class: classId},
    }));
}

const examUrl = "/exam";

export async function newExam(exam: Omit<Exam, 'id'>)
{
    return await checkResponse<ExamId>(sendRequest({
        target: Target.BACKEND,
        url: examUrl,
        method: 'POST',
        data: exam,
    }));
}

export async function modifyExam(exam: Exam)
{
    return await checkResponse<null>(sendRequest({
        target: Target.BACKEND,
        url: examUrl,
        method: 'PUT',
        data: exam,
    }));
}

const getExamUrl = "/exam/{id}";
export async function getExam(id: number)
{
    return await checkResponse<Exam>(sendRequest({
        target: Target.BACKEND,
        url: getExamUrl,
        method: 'GET',
        params: {id},
    }));
}

const deleteExamUrl = "/exam/{id}";
export async function deleteExam(id: number)
{
    return await checkResponse<null>(sendRequest({
        target: Target.BACKEND,
        url: deleteExamUrl,
        method: 'DELETE',
        params: {id},
    }));
}

const startExamUrl = "/exam/{id}/start";
export async function startExam(id: number)
{
    try
    {
        return await checkResponse<Quiz<null, null, null>>(sendRequest({
            target: Target.BACKEND,
            url: `${startExamUrl}`,
            method: 'POST',
            params: { id },
        }));
    }
    catch (e)
    {
        if (e instanceof ResponseError && e.response.code === 406) return e.response.data as Quiz<null, AnswerType | null, null>;
        throw e;
    }
}