import type { KnowledgePointId, PreparationGroupId } from "./Ids";

export interface KnowledgePoint
{
    id: KnowledgePointId;
    group: PreparationGroupId;
    name: string;
    folder: boolean;
    father: KnowledgePointId | null;
}