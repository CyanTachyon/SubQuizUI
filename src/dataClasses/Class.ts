import type { ClassId, PreparationGroupId, UserId } from "./Ids";

export interface Class {
    id: ClassId;
    name: string;
    group: PreparationGroupId;
}

export interface ClassMember 
{
    user: UserId;
    seiue: Seiue;
}

export interface Seiue 
{
    studentId: string;
    realName: string;
    archived: boolean;
}

export type ClassWithMembers = Class & { members: ClassMember[] };