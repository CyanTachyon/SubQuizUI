import type { AnswerType } from "../../dataClasses/Question";
import type { Section } from "../../dataClasses/Section";
import { useNotificationStore } from "../../stores/notification";
import { connectUrl, request, Target } from "../utils/sendRequest";

export interface AiMessage 
{
    content: string | null;
    reasoning_content: string | null;
}

export type AiHistory = { role: 'user' | 'assistant'; } & AiMessage;

const askUrl = '/ai/ask';
export async function ask(
    model: 'BDFZ_HELPER' | 'QUIZ_AI',
    section: Section<AnswerType, AnswerType, string>,
    question: string,
    histories: AiHistory[],
    onMessage: (message: AiMessage) => void
)
{
    const req = await request(connectUrl(Target.BACKEND, askUrl), 'POST', {}, true, {
        section,
        content: question,
        history: histories,
        model
    })

    const reader = req.body.getReader();
    const decoder = new TextDecoder();

    while (true)
    {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        chunk.split(/\r?\n\r?\n/).filter(part => part.trim() !== '').forEach(block =>
        {
            const parts = block.split(/\n|\r/).filter(part => part.trim() !== '');
            let data = '';
            let event = '';
            for (const part of parts)
            {
                if (part.startsWith('data: ')) data += part.slice(6) + '\n';
                if (part.startsWith('event: ')) event += part.slice(7) + '\n';
            }
            if (data.endsWith('\n')) data = data.slice(0, -1);
            if (event.endsWith('\n')) event = event.slice(0, -1);
            if (event === 'message') try 
            { 
                onMessage(JSON.parse(data)); 
            } 
            catch (e) 
            { 
                useNotificationStore().addError(`Error parsing AI message`);
            }
        });
      }
}