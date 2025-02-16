import type {SectionTypeId, SubjectId} from "./Ids.ts";

export interface SectionType
{
    id: SectionTypeId,
    subject: SubjectId,
    name: string,
    description: string,
}