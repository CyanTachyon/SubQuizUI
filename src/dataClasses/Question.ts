export type AnswerType = boolean | number | number[] | any;
export type QuestionType = "single" | "multiple" | "judge" | "fill" | "essay";

type IsAny<T> = 0 extends (1 & T) ? true : false;
type IsExactlyNull<T> = [T] extends [null] ? true : false;
export type IsAnyOrNull<T> = IsExactlyNull<T> extends true ? true : IsAny<T>;

export type Question<
    Answer extends (AnswerType | null),
    UserAnswer extends (AnswerType | null),
    Analysis extends (any | null),
> = {
    description: any,
    options: any[],
    answer: Answer,
    userAnswer: UserAnswer,
    analysis: IsAnyOrNull<Analysis> extends true ? Analysis : never,
    type: QuestionType,
}