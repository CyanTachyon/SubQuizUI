import type {KnowledgePointId, SectionTypeId} from "./Ids.ts";

export interface SectionType
{
    id: SectionTypeId,
    knowledgePoint: KnowledgePointId,
    name: string,
}