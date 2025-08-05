import type { Chat } from "../../dataClasses/Chat";
import type { ChatId } from "../../dataClasses/Ids";
import type { AnswerType } from "../../dataClasses/Question";
import type { Section } from "../../dataClasses/Section";
import type { Slice } from "../../dataClasses/Slice";
import { useNotification } from "../../stores/notification";
import { checkResponse } from "../utils/checkResponse";
import { sendRequest, sseRequest, Target } from "../utils/sendRequest";

export type ToolDataInfoType = 'MARKDOWN' | 'URL' | 'TEXT' | 'HTML' | 'FILE' | 'PAGE' | 'IMAGE' | 'MATH';
export type AiMessage = {
    content?: string;
    reasoning_content?: string;
    tool_call?: string;
    type?: null | ToolDataInfoType;
}
export type AiHistory = {
    role: 'assistant' | 'user';
    messages: AiMessage[];
};
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

const sseUrl = '/ai/chat/sse';
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

const getToolDataUrl = '/ai/chat/toolData';
export async function getToolData(type: string, path: string): Promise<ToolDataInfo>
{
    return checkResponse<ToolDataInfo>(sendRequest({
        target: Target.BACKEND,
        url: getToolDataUrl,
        method: 'GET',
        params: { type, path }
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