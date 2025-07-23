import type { Chat } from "../../dataClasses/Chat";
import type { ChatId } from "../../dataClasses/Ids";
import type { AnswerType } from "../../dataClasses/Question";
import type { Section } from "../../dataClasses/Section";
import type { Slice } from "../../dataClasses/Slice";
import { useNotification } from "../../stores/notification";
import { checkResponse } from "../utils/checkResponse";
import { connectUrl, request, sendRequest, Target } from "../utils/sendRequest";

export interface AiMessage 
{
    content: string | null;
    reasoning_content: string | null;
}

export type AiHistory = { role: 'user' | 'assistant'; } & AiMessage;
export type Model = string;

const getChatUrl = '/ai/chat/{chat}';

export async function getChat(chat: ChatId): Promise<Chat>
{
    return checkResponse<Chat>(sendRequest({
        target: Target.BACKEND,
        url: getChatUrl,
        method: 'GET',
        params: { chat }
    }));
}

const chatUrl = '/ai/chat';

export async function getChatList(begin: number, count: number): Promise<Slice<Chat>>
{
    return checkResponse(sendRequest({
        target: Target.BACKEND,
        url: chatUrl,
        method: 'GET',
        params: { begin, count }
    }));
}

export async function createChat(section: Section<AnswerType, AnswerType, string> | null, content: string, model: Model)
{
    return checkResponse<Chat>(sendRequest({
        target: Target.BACKEND,
        url: chatUrl,
        method: 'POST',
        data: {
            section,
            content,
            model
        }
    }));
}

export async function sendContent(chatId: number, content: string, model: Model, hash: string): Promise<string | null>
{
    return checkResponse<string | null>(
        sendRequest({
            target: Target.BACKEND,
            url: chatUrl,
            method: 'PUT',
            data: {
                chatId,
                content,
                model,
                hash,
            }
        }),
        (res, defaultOnFail) => {
            if (res.code === 409) return null;
            return defaultOnFail(res);
        }
    );
}

const aiModelsUrl = '/ai/chat/models';
export async function getAiModels(): Promise<ModelInfo[]>
{
    return checkResponse<ModelInfo[]>(sendRequest({
        target: Target.BACKEND,
        url: aiModelsUrl,
        method: 'GET'
    }));
}

export interface ModelInfo
{
    model: Model;
    displayName: string;
    description: string;
}

const sseUrl = '/ai/chat/sse';
export async function chatSSE(
    chat: ChatId,
    hash: string,
    onMessage: (message: AiMessage & {finished: boolean, banned: boolean}) => void
)
{
    const req = await request(connectUrl(Target.BACKEND, sseUrl, { chat, hash }), 'GET', {}, true, undefined);

    let ok = req.headers.get('Content-Type')?.startsWith('text/event-stream');
    if (!ok) return checkResponse(req.json());

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
                useNotification().addError(`Error parsing AI message`);
            }
            else if (event === 'finished')
            {
                onMessage({ content: null, reasoning_content: null, finished: true, banned: false });
            }
            else if (event === 'banned')
            {
                onMessage({ content: null, reasoning_content: null, finished: true, banned: true });
            }
        });
    }
}

const translateSSEUrl = '/ai/translate';
export async function translateSSE(
    text: string,
    onMessage: (message: string) => void,
)
{
    const req = await request(connectUrl(Target.BACKEND, translateSSEUrl), 'POST', {}, true, { text });

    let ok = req.headers.get('Content-Type')?.startsWith('text/event-stream');
    if (!ok) return checkResponse(req.json());

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
                onMessage(JSON.parse(data).text);
            }
            catch (e) 
            {
                useNotification().addError(`Error parsing AI message`);
            }
        });
    }
}