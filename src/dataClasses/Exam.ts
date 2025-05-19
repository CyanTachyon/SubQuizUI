import type { ExamId, PreparationGroupId } from "./Ids";
import type { AnswerType } from "./Question";
import type { Section } from "./Section";

export interface Exam 
{
    id: ExamId;
    group: PreparationGroupId;
    name: string;
    description: string;
    sections: Section<AnswerType, null, string>[];
    available: boolean;
};