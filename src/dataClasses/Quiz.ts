import type { AnswerType } from "./Question.ts";
import type {Section} from "./Section.ts";

export interface Quiz<Answer extends AnswerType | null, UserAnswer extends AnswerType | null, Analysis extends string | null>
{
    id: number,
    user: number,
    time: number,
    duration: number | null,
    sections: Section<Answer, UserAnswer, Analysis>[],
    finished: boolean,
    correct: boolean[][] | null,
    tokenUsage: number | null,
}