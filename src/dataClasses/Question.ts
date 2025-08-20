export type AnswerType = boolean | number | number[] | string;
export type QuestionType = "single" | "multiple" | "judge" | "fill" | "essay";
export interface Question<Answer extends (AnswerType | null), UserAnswer extends (AnswerType | null), Analysis extends (any | null)>
{
    description: any,
    options: any[],
    answer: Answer,
    userAnswer: UserAnswer,
    analysis: Analysis,
    type: QuestionType
}