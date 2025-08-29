import type { Chat } from "../../dataClasses/Chat";
import type { ChatId } from "../../dataClasses/Ids";
import type { AnswerType } from "../../dataClasses/Question";
import type { Section } from "../../dataClasses/Section";
import type { Slice } from "../../dataClasses/Slice";
import { useNotification } from "../../stores/notification";
import { useUser } from "../../stores/user";
import { checkResponse } from "../utils/checkResponse";
import { connectUrl, sendRequest, sseRequest, Target } from "../utils/sendRequest";

export type ToolDataInfoType = 'MARKDOWN' | 'URL' | 'TEXT' | 'HTML' | 'FILE' | 'PAGE' | 'IMAGE' | 'MATH' | 'QUIZ';
export type AiMessage = {
    content?: Content;
    reasoning_content?: string;
    tool_call?: string;
    type?: null | ToolDataInfoType;
}
export type Content = (({
    type: 'text';
    text: string;
} | {
    type: 'image_url';
    image_url: {
        url: string;
    }
})[]) | string;
export type AiHistory = {
    role: 'assistant' | 'user';
    messages: AiMessage[];
};
export type Model = string;

function optimizeContent(content: Content): Content
{
    if (typeof content === 'string') return content;
    const optimized: Content = [];
    for (const c of content)
    {
        if (c.type === 'text')
        {
            if (optimized.length > 0 && optimized[optimized.length - 1].type === 'text')
                (optimized[optimized.length - 1] as { type: 'text'; text: string }).text += c.text;
            else optimized.push(c);
        }
        else
        {
            optimized.push(c);
        }
    }
    return optimized;
}

export function mergeContent(content0: Content, content1: Content): Content
{
    if (typeof content0 === 'string' || typeof content1 === 'string') return '' + content0 + content1;
    const merged: Content = [];
    if (typeof content0 === 'string') merged.push({ type: 'text', text: content0 });
    else merged.push(...content0);
    if (typeof content1 === 'string') merged.push({ type: 'text', text: content1 });
    else merged.push(...content1);
    return optimizeContent(merged);
}

export function getContentText(content: Content)
{
    if (typeof content === 'string') return content;
    return content.map(c => c.type === 'text' ? c.text : '').join('');
}

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

const deleteChatUrl = '/ai/chat/{chat}';
export async function deleteChat(chat: ChatId): Promise<void>
{
    return checkResponse<void>(sendRequest({
        target: Target.BACKEND,
        url: deleteChatUrl,
        method: 'DELETE',
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

export async function createChat(section: Section<AnswerType, AnswerType, string> | null, content: string, images: string[], model: Model)
{
    return checkResponse<ChatId>(sendRequest({
        target: Target.BACKEND,
        url: chatUrl,
        method: 'POST',
        data: {
            section,
            content,
            model,
            images,
        }
    }));
}

export async function sendContent(data: {chatId: number, content: string, images: string[], regenerate: boolean, model: Model, hash: string}): Promise<{hash: string, content: Content} | null>
{
    return checkResponse<{hash: string, content: Content} | null>(
        sendRequest({
            target: Target.BACKEND,
            url: chatUrl,
            method: 'PUT',
            data,
        }),
        (res, defaultOnFail) => {
            if (res.code === 409) return null;
            return defaultOnFail(res);
        }
    );
}

const cancelChatUrl = '/ai/chat/{chat}/cancel';
export async function cancelChat(chat: ChatId): Promise<void>
{
    return checkResponse<void>(sendRequest({
        target: Target.BACKEND,
        url: cancelChatUrl,
        method: 'POST',
        params: { chat }
    }));
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
    toolable: boolean;
}

const sseUrl = '/ai/chat/{chat}/sse';
export async function chatSSE(
    chat: ChatId,
    hash: string,
    onMessage: (message: AiMessage & {finished: boolean, banned: boolean}) => void,
    onChatNamed: (title: string) => void,
)
{
    await sseRequest({
        target: Target.BACKEND,
        url: sseUrl,
        params: { chat, hash },
        method: 'GET',
    }, (chunk) => 
    {
        const { event, data } = chunk;
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
            onMessage({ content: '', reasoning_content: '', type: null, finished: true, banned: false });
        }
        else if (event === 'banned')
        {
            onMessage({ content: '', reasoning_content: '', type: null, finished: true, banned: true });
        }
        else if (event === 'name')
        {
            onChatNamed(JSON.parse(data).name);
        }
    });
}

export interface ToolDataInfo
{
    type: ToolDataInfoType;
    value: string;
}

const getToolDataUrl = '/ai/chat/{chat}/toolData';
export async function getToolData(chat: ChatId, type: string, path: string): Promise<ToolDataInfo>
{
    return checkResponse<ToolDataInfo>(sendRequest({
        target: Target.BACKEND,
        url: getToolDataUrl,
        method: 'GET',
        params: { chat, type, path }
    }));
}

export interface FileInfo
{
    name: string;
    type: ToolDataInfoType;
}

const getFileInfoUrl = '/ai/chat/{chat}/file/{file}/info';
export async function getFileInfo(chat: ChatId, file: string): Promise<FileInfo>
{
    return checkResponse<FileInfo>(sendRequest({
        target: Target.BACKEND,
        url: getFileInfoUrl,
        method: 'GET',
        params: { chat, file }
    }));
}

export function getFileUrl(chat: ChatId, file: string, download: boolean = false): string
{
    return connectUrl(Target.BACKEND, '/ai/chat/{chat}/file/{file}/data', { chat, file, token: useUser().getToken(), download });
}

export function parseChatUrl(chat: ChatId, url: string): string
{
    if (url.startsWith('uuid:')) return getFileUrl(chat, url.substring(5));
    else return url;
}

const translateSSEUrl = '/ai/translate';
export async function translateSSE(
    text: string,
    lang0: string,
    lang1: string,
    twoWay: boolean,
    onMessage: (message: string) => void,
)
{
    await sseRequest({
        target: Target.BACKEND,
        url: translateSSEUrl,
        method: 'POST',
        data: { lang0, lang1, twoWay, text },
    }, (chunk) =>
    {
        const { event, data } = chunk;
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

const imageToTextUrl = '/ai/imageToText';
export async function imageToText(image: string, markdown: boolean, onMessage: (message: string) => void)
{
    await sseRequest({
        target: Target.BACKEND,
        url: imageToTextUrl,
        method: 'POST',
        data: { image, markdown },
    }, (chunk) =>
    {
        const { event, data } = chunk;
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