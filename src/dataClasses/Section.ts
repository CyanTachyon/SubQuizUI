import type {Question, AnswerType, IsAnyOrNull} from "./Question.ts";
import type {SectionId} from "./Ids.ts";

export interface Section<
    Answer extends (AnswerType | null), 
    UserAnswer extends (AnswerType | null), 
    Analysis extends (any | null),
>
{
    id: SectionId,
    type: number,
    description: any,
    weight: number,
    available: boolean,
    questions: IsAnyOrNull<Analysis> extends true ? Question<Answer, UserAnswer, Analysis>[] : never
}