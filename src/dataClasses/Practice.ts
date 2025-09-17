import type { ClassId, KnowledgePointId, PracticeId } from "./Ids";

export interface Practice
{
    id: PracticeId,
    clazz: ClassId,
    name: string,
    description: string,
    available: boolean,
    knowledgePoints: KnowledgePointId[],
    sectionCount: number,
    accuracy: number,
    dueDate: number | null,
}