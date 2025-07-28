import type { AiHistory } from "../networks/backend/ai";
import type { ChatId } from "./Ids";
import type { AnswerType } from "./Question";
import type { Section } from "./Section";

export interface Chat
{
    id: ChatId;
    user: number;
    title: string;
    section: Section<AnswerType, AnswerType, string> | null;
    histories: AiHistory[];
    hash: string;
}