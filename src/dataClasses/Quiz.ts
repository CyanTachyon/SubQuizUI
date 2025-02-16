import type {Section} from "./Section.ts";

export interface Quiz<Answer extends (number | null), UserAnswer extends (number | null), Analysis extends (string | null)>
{
    id: number,
    user: number,
    time: number,
    duration: number | null,
    sections: Section<Answer, UserAnswer, Analysis>[],
    finished: boolean,
}