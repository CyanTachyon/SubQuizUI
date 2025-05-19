import type { Exam } from "../../dataClasses/Exam";
import { checkResponse } from "../utils/checkResponse";
import { sendRequest, Target } from "../utils/sendRequest";

const getExamsUrl = "/exam/group/{group}";

export function getExams(groupId: number)
{
    return checkResponse<Exam[]>(sendRequest({
        target: Target.BACKEND,
        url: getExamsUrl,
        method: 'GET',
        params: {group: groupId},
    }));
}

const newExamUrl = "/exam";

export function newExam(exam: Omit<Exam, 'id'>)
{
    return checkResponse<Exam>(sendRequest({
        target: Target.BACKEND,
        url: newExamUrl,
        method: 'POST',
        data: exam,
    }));
}

export function modifyExam(exam: Exam)
{
    return checkResponse<null>(sendRequest({
        target: Target.BACKEND,
        url: newExamUrl,
        method: 'PUT',
        data: exam,
    }));
}

const examImageUrl = "/exam/{id}/image"

export function addExamImage(examId: number, type: 'GIF' | 'JPEG' | 'PNG' | 'SVG' | 'XIcon', md5: string)
{
    return checkResponse<string | null>(sendRequest({
        target: Target.BACKEND,
        url: examImageUrl,
        method: 'POST',
        params: {id: examId, type, md5},
    }));
}

export function removeExamImage(examId: number, md5: string)
{
    return checkResponse<null>(sendRequest({
        target: Target.BACKEND,
        url: examImageUrl,
        method: 'DELETE',
        params: {id: examId, md5},
    }));
}

export function getExamImages(examId: number)
{
    return checkResponse<string[]>(sendRequest({
        target: Target.BACKEND,
        url: examImageUrl,
        method: 'GET',
        params: {id: examId},
    }));
}