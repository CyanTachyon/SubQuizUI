import type { PreparationGroupId, SubjectId } from "./Ids";

export interface PreparationGroup
{
    id: PreparationGroupId;
    subject: SubjectId;
    name: string;
    description: string;
    time: number;
}