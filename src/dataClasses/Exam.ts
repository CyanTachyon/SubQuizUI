import type { ClassId, ExamId, SectionId } from "./Ids";

export interface Exam 
{
    id: ExamId;
    clazz: ClassId;
    name: string;
    description: string;
    sections: SectionId[];
    available: boolean;
};