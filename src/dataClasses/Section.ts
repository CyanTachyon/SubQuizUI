import type {Question, AnswerType} from "./Question.ts";
import type {SectionId} from "./Ids.ts";

export interface Section<Answer extends AnswerType | null, UserAnswer extends AnswerType | null, Analysis extends string | null>
{
    id: SectionId,
    subject: number,
    type: number,
    description: string,
    questions: Question<Answer, UserAnswer, Analysis>[]
}