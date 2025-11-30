import type { Chat } from "../../dataClasses/Chat";
import type { ChatId } from "../../dataClasses/Ids";
import type { AnswerType } from "../../dataClasses/Question";
import type { Section } from "../../dataClasses/Section";
import type { Slice } from "../../dataClasses/Slice";
import { useNotification } from "../../stores/notification";
import { useUser } from "../../stores/user";
import { checkResponse } from "../utils/checkResponse";
import { connectUrl, sendRequest, sseRequest, Target } from "../utils/sendRequest";

export type ToolDataInfoType = 'MARKDOWN' | 'URL' | 'TEXT' | 'HTML' | 'FILE' | 'PAGE' | 'IMAGE' | 'MATH' | 'QUIZ' | 'VIDEO';
export type AiMessage = {
    content?: Content;
    mark?: {
        id: string;
        label: string | null;
        showingType: ToolDataInfoType | null;
    };
}
export type Content = (({
    type: 'text';
    text: string;
} | {
    type: 'image_url';
    image_url: {
        url: string;
    }
} | {
    type: 'file';
    file: {
        filename: string;
        file_data: string;
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

export function isContentEmpty(content: Content): boolean
{
    if (!content) return true;
    if (typeof content === 'string') return !content.trim();
    return content.every(c => c.type === 'text' && !c.text.trim());
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

export async function createChat(data: {section: Section<AnswerType, AnswerType, string> | null, content: Content, model: Model, options: string[]})
{
    return checkResponse<ChatId>(sendRequest({
        target: Target.BACKEND,
        url: chatUrl,
        method: 'POST',
        data,
    }));
}

export async function sendContent(data: {chatId: ChatId, content: Content, regenerate: boolean, model: Model, hash: string, options: string[]}): Promise<{hash: string, content: Content} | null>
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

const getShareHashUrl = '/ai/chat/{chat}/share';
export async function getShareHash(chat: ChatId): Promise<string>
{
    return checkResponse<string>(sendRequest({
        target: Target.BACKEND,
        url: getShareHashUrl,
        method: 'GET',
        params: { chat }
    }));
}

const customModelUrl = '/ai/chat/customModel';
export interface CustomModelInfo
{
    model: string;
    url: string;
    toolable: boolean;
    imageable: boolean;
    key: string;
    customRequestParms: any;
}
export async function getCustomModel(): Promise<CustomModelInfo>
{
    return checkResponse<CustomModelInfo>(sendRequest({
        target: Target.BACKEND,
        url: customModelUrl,
        method: 'GET'
    }));
}

export async function setCustomModel(model: CustomModelInfo): Promise<void>
{
    return checkResponse<void>(sendRequest({
        target: Target.BACKEND,
        url: customModelUrl,
        method: 'PUT',
        data: model
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

const aiOptionsUrl = '/ai/chat/options';
export async function getAiOptions(model: Model): Promise<string[]>
{
    return checkResponse<string[]>(sendRequest({
        target: Target.BACKEND,
        url: aiOptionsUrl,
        method: 'GET',
        params: { model }
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
): Promise<boolean>
{
    let end = false;
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
            onMessage({ content: '', finished: true, banned: false });
        else if (event === 'banned')
            onMessage({ content: '', finished: true, banned: true });
        else if (event === 'name')
            onChatNamed(JSON.parse(data).name);
        else if (event === 'end')
            end = true;
    });
    return end;
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
    return connectUrl(Target.BACKEND, '/ai/chat/{chat}/file/{file}/data', { chat, file, token: useUser().getToken() || undefined, download });
}

export function parseChatUrl(chat: ChatId, url: string): string
{
    if (url.startsWith('uuid:')) return getFileUrl(chat, url.substring(5));
    else return url;
}

const getLibFilesUrl = '/ai/chat/lib/files';
/**
 * 获取自定义ai知识库中的全部文件
 * @returns 所有文件的path（例如：'a/b/c.txt'）
 */
export async function getLibFiles(): Promise<string[]>
{
    return checkResponse<string[]>(sendRequest({
        target: Target.BACKEND,
        url: getLibFilesUrl,
        method: 'GET'
    }));
}

const libFileUrl = '/ai/chat/lib/file';

/**
 * 获取自定义ai知识库中的文件
 * @param path 文件路径（例如：'a/b/c.txt'）
 * @returns 文件内容
 */
export async function getLibFile(path: string): Promise<string>
{
    return checkResponse<string>(sendRequest({
        target: Target.BACKEND,
        url: libFileUrl,
        method: 'GET',
        params: { path }
    }));
}

/**
 * 上传自定义ai知识库中的文件
 * @param path 文件路径（例如：'a/b/c.txt'）
 * @param file 文件内容
 */
export async function uploadLibFile(path: string, file: string): Promise<void>
{
    return checkResponse<void>(sendRequest({
        target: Target.BACKEND,
        url: libFileUrl,
        method: 'POST',
        params: { path },
        data: file,
    }));
}

/**
 * 删除自定义ai知识库中的文件
 * @param path 文件路径（例如：'a/b/c.txt'）
 */
export async function deleteLibFile(path: string): Promise<void>
{
    return checkResponse<void>(sendRequest({
        target: Target.BACKEND,
        url: libFileUrl,
        method: 'DELETE',
        params: { path }
    }));
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
        data: { lang0, lang1, twoWay, data: text },
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

const translateImageUrl = '/ai/translateImage';
export async function translateImage(
    image: string,
    lang0: string,
    lang1: string,
    twoWay: boolean,
)
{
    return (await checkResponse<{data: string}>(sendRequest({
        target: Target.BACKEND,
        url: translateImageUrl,
        method: 'POST',
        data: { lang0, lang1, twoWay, data: image },
    }))).data;
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

export interface EssayCorrection
{
    comment: string;
    p: Part[];
}

export interface Part
{
    // 原始文本
    original: string;
    // 修正后的文本
    result: string;
    // 评论
    comment: string;
    // 子节点
    children: Part[] | null;
}

const essayCorrectionUrl = '/ai/essayCorrection';
export async function essayCorrection(
    // 题目要求，支持文字或图片（base64，如data:image/png;base64,...）
    requirement: string,
    // 作文，支持文字或图片（base64，如data:image/png;base64,...）
    essay: string,
): Promise<{
    comment: string;
    p: Part[];
}>
{
    return checkResponse(sendRequest({
        target: Target.BACKEND,
        url: essayCorrectionUrl,
        method: 'POST',
        data: { requirement, essay },
    }));
}
