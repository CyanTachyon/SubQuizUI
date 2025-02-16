export interface Question<Answer extends number | null, UserAnswer extends number | null, Analysis extends string | null>
{
    description: string,
    options: string[],
    answer: Answer,
    userAnswer: UserAnswer,
    analysis: Analysis,
}