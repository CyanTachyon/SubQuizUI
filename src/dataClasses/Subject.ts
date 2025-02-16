import type {SubjectId} from "./Ids.ts";

export interface Subject
{
    id: SubjectId,
    name: string,
    description: string,
}