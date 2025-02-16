import type {Question} from "./Question.ts";
import type {SectionId} from "./Ids.ts";

export interface Section<Answer extends number | null, UserAnswer extends number | null, Analysis extends string | null>
{
    id: SectionId,
    subject: number,
    type: number,
    description: string,
    questions: Question<Answer, UserAnswer, Analysis>[]
}