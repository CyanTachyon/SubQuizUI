<script lang="tsx" setup>
import { ref, nextTick } from 'vue';
import type { AnswerType } from '../dataClasses/Question';
import type { Section } from '../dataClasses/Section';
import { cancelChat, chatSSE, createChat, deleteChat, getChat, sendContent, type AiHistory, type AiMessage, type Model, type ModelInfo, type ToolDataInfo, } from '../networks/backend/ai';
import Input from '../components/Input.vue';
import { useNotification } from '../stores/notification';
import LoadingIcon from 'vue-material-design-icons/Loading.vue';
import { copyToClipboard, dialog } from '../utils/utils';
import ChevronRightIcon from 'vue-material-design-icons/ChevronRight.vue';
import ChevronDownIcon from 'vue-material-design-icons/ChevronDown.vue';
import type { Chat } from '../dataClasses/Chat';
import type { ChatId } from '../dataClasses/Ids';
import Loading from '../components/Loading.vue';
import QuizView from './QuizView.vue';
import Text from '../components/Text.vue';
import Card from '../components/Card.vue';
import { getAiModels } from '../networks/backend/ai';
import SelectMenu from '../components/SelectMenu.vue';
import { storageGet, storageSet } from '../utils/storage';
import { Capacitor } from '@capacitor/core';
import { TrashIcon } from '@heroicons/vue/16/solid';
import ContentCopyIcon from 'vue-material-design-icons/ContentCopy.vue';
import FileQuestionIcon from 'vue-material-design-icons/FileQuestion.vue';
import ToolsIcon from 'vue-material-design-icons/Tools.vue';
import Button from '../components/Button.vue';
import LightbulbOnIcon from 'vue-material-design-icons/LightbulbOn.vue';
import LightbulbOutlineIcon from 'vue-material-design-icons/LightbulbOutline.vue';
import { getThemes } from '../stores/theme';
import ToolDataShower from './ToolDataShower.vue';
import StopCircleOutlineIcon from "vue-material-design-icons/StopCircleOutline.vue";

export type DisplayMessage = AiMessage & {
    showReasoning: boolean;
};
export type AiInfo = Chat & {
    histories: (AiHistory & { messages: DisplayMessage[]})[]
    showAnswering: boolean;
    inAnswering: boolean;
};

const props = defineProps<{
    info: ChatId | Section<AnswerType, AnswerType, string>;
    onNewChat: (id: ChatId) => void;
    onChatNamed: (id: ChatId, title: string) => void;
}>();

const info = ref<AiInfo>();
const loading = ref(true);
const historiesContainer = ref<HTMLElement>();
const shouldAutoScroll = ref(true);

// 检查是否滚动到底部
const isScrolledToBottom = () => 
{
    if (!historiesContainer.value) return true;
    const { scrollTop, scrollHeight, clientHeight } = historiesContainer.value;
    return scrollTop + clientHeight >= scrollHeight - 5; // 5px tolerance
};

// 滚动到底部
const scrollToBottom = () => 
{
    if (!historiesContainer.value) return;
    nextTick(() => 
    {
        historiesContainer.value!.scrollTop = historiesContainer.value!.scrollHeight;
    });
};

// 处理滚动事件
const handleScroll = () => 
{
    shouldAutoScroll.value = isScrolledToBottom();
};

const onNamed = (title: string) => 
{
    if (!info.value || !info.value.id) return;

    let index = 0;
    const addChar = () =>
    {
        info.value.title = title.slice(0, index);
        props.onChatNamed(info.value.id, title.slice(0, index));
        index++;
        if (index <= title.length) setTimeout(addChar, 50);
        else
        {
            info.value.title = title;
            props.onChatNamed(info.value.id, title);
        }
    };
    addChar();
};

const onMessage = (message: AiMessage & { finished: boolean, banned: boolean }) => 
{
    if (info.value.histories[info.value.histories.length - 1].role !== 'assistant')
    {
        info.value.histories.push({
            role: 'assistant',
            messages: [],
        });
    }

    const last = info.value.histories[info.value.histories.length - 1] as AiHistory & { messages: DisplayMessage[] };

    if (message.tool_call || message.type)
    {
        if (last.messages.length) last.messages[last.messages.length - 1].showReasoning = false;
        last.messages.push({
            ...message,
            showReasoning: false,
        });
        return;
    }

    let lastMessage: DisplayMessage;
    if (last.messages.length <= 0 || last.messages[last.messages.length - 1].tool_call || last.messages[last.messages.length - 1].type)
    {
        // 新消息出现，收回上一个消息的思考过程
        if (last.messages.length) last.messages[last.messages.length - 1].showReasoning = false;
        lastMessage = {
            content: '',
            reasoning_content: '',
            showReasoning: true,
            type: null,
        };
        last.messages.push(lastMessage);
    }
    else
    {
        lastMessage = last.messages[last.messages.length - 1];
    }

    // 收到第一条正文时，收回思考过程
    if (message.content && !lastMessage.content) lastMessage.showReasoning = false;
    if (message.content) lastMessage.content += message.content;
    if (message.reasoning_content) lastMessage.reasoning_content += message.reasoning_content;

    if (message.banned) 
    {
        lastMessage.content = "对不起，该聊天无法继续";
        lastMessage.reasoning_content = '';
    }
    else if (message.finished) 
    {
        info.value.showAnswering = false;
    }

    if (shouldAutoScroll.value) {
        scrollToBottom();
    }
}

const init = async () => 
{
    if (typeof props.info === 'number' && props.info > 0)
    {
        const chat = await getChat(props.info);
        info.value = {
            ...chat,
            showAnswering: false,
            inAnswering: false,
            histories: chat.histories.map((history) => ({
                ...history,
                messages: history.messages.map((message) => ({
                    ...message,
                    showReasoning: false,
                })),
            })),
        }
    }
    else
    {
        info.value = {
            id: 0,
            section: typeof props.info === 'object' ? props.info : null,
            user: 0,
            title: '新建对话',
            hash: '',
            histories: [],
            showAnswering: false,
            inAnswering: false,
        };
    }

    if (!info.value.id) return;

    if (info.value.histories[info.value.histories.length - 1].role !== 'assistant')
    {
        info.value.histories.push({
            role: 'assistant',
            messages: []
        });
        info.value.showAnswering = true;
    }

    info.value.inAnswering = true;
    chatSSE(
        info.value.id,
        info.value.hash,
        onMessage,
        onNamed,
    ).finally(() => info.value.inAnswering = info.value.showAnswering = false);
};
init().then(() => { loading.value = false; nextTick(scrollToBottom); });

const input = ref('');

const model = ref<Model>('');
const models = ref<ModelInfo[]>([
    {
        model: '',
        displayName: "加载中...",
        toolable: false,
    }
]);

(async () => {
    models.value = await getAiModels();
    const savedModel = await storageGet('quiz-ai-model') as Model;
    if (models.value.some(m => m.model === savedModel))
    {
        model.value = savedModel;
    } 
    else
    {
        model.value = models.value[0].model;
    }
})();

function changeModel(newModel: Model)
{
    model.value = newModel;
    storageSet('quiz-ai-model', newModel);
}

function isMobileDevice()
{
    if (Capacitor.getPlatform() !== 'web') return true;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function onSubmit(event: KeyboardEvent)
{
    if (event && (event.shiftKey || isMobileDevice())) return;
    event?.preventDefault();

    // 取消回答
    if (info.value.showAnswering && event === null)
    {
        cancelChat(info.value.id);
        return;
    }

    if (input.value.trim() === '' || info.value.showAnswering) return;
    else if (info.value.inAnswering) 
    {
        useNotification().addError('请求正在处理中，请稍等片刻。');
        return;
    }
    info.value.inAnswering = true;

    (async () => {
    
    if (!info.value.id)
    {
        const {id, user, hash} = await createChat(info.value.section, input.value, model.value)
        info.value.id = id;
        info.value.hash = hash;
        info.value.histories = [];
        info.value.user = user;
        props.onNewChat(id);
        return;
    }
    else 
    {
        const newHash = await sendContent(info.value.id, input.value, model.value, info.value.hash)
        if (newHash) 
        {
            info.value.hash = newHash;
        } 
        else 
        {
            useNotification().addError('发生冲突，请刷新页面重试。');
            info.value.showAnswering = false;
            return;
        }

    }

    info.value.histories.push({
        role: 'user',
        messages: [
            {
                content: input.value,
            }
        ]
    });
    info.value.histories.push({
        role: 'assistant',
        messages: []
    });
    input.value = '';

    // 发送消息后自动滚动到底部
    shouldAutoScroll.value = true;
    scrollToBottom();

    info.value.showAnswering = true;
    try 
    {
        await chatSSE(
            info.value.id,
            info.value.hash,  
            onMessage,
            onNamed,
        )
    }
    finally
    {
        info.value.showAnswering = false;
    }
    })().finally(() => 
    { 
        info.value.inAnswering = false; 
        if (
            info.value.histories.length > 0 && 
            info.value.histories[info.value.histories.length - 1].role === 'assistant' &&
            info.value.histories[info.value.histories.length - 1].messages.length === 0
        ) init();
    });
}

function openSection()
{
    if (!info.value.section) return;
    const close = dialog(<div style="overflow: auto; scrollbar-width: none; height: 85vh; width: 85vw;">
    <QuizView editable={false} quiz={({sections: [info.value.section], correct: null})}></QuizView>
    </div>, () => {close();});
}

function showIntelligentTips(isEnabled: boolean)
{
    if (isEnabled)
    {
        useNotification().addInfo('该模型支持高级功能！');
    } 
    else
    {
        useNotification().addWarning('该模型不支持高级功能, 建议切换到支持的模型以获得更好的体验。');
    }
}

const bdfzData = ref<{ [key: string]: Record<string, ToolDataInfo> }>({});

function parseHtml(ele: HTMLElement)
{
    ele.querySelectorAll('tool_data').forEach((toolDataEle: HTMLElement, index: number) =>
    {
        const path = toolDataEle.getAttribute('path');
        const type = toolDataEle.getAttribute('type');
        toolDataEle.innerHTML = '' + (index + 1);
        toolDataEle.classList.add('tool-data-link');
        if (path) toolDataEle.onclick = () =>
        {
            const close = dialog(<ToolDataShower type={type} path={path} dataset={bdfzData} close={() => close()} />, () => { close(); });
        }
    });
}

</script>

<template>
    <Card class="quiz-ai-dialog" :style="{ 
        '--pin-bgcolor': getThemes().isDark ? 'var(--glass-button-highlight-border)' : 'unset',
        '--pin-border-color': getThemes().isDark ? 'unset' : 'var(--glass-button-highlight-border)',
        '--pin-text-color': getThemes().isDark ? 'var(--color)' : 'var(--glass-button-highlight-border)',
    }">
        <Loading v-if="loading"></Loading>
        <template v-else>
            <div style="display: flex; align-items: center; justify-content: center; height: 60px; padding: 0 10px; font-size: 1.2rem; font-weight: bold; gap: 10px; position: relative; min-height: 60px;">
                {{ info?.title ?? '新建对话' }}
                <TrashIcon v-if="info?.id" @click="deleteChat(info?.id).then(() => onNewChat(0))" style="color: red; width: 20px; height: 20px; opacity: 0.7; cursor: pointer;" />
            </div>
            <Text class="section" v-if="info.section" @click="openSection">
                <FileQuestionIcon />
                点击查看题目内容
            </Text>
            <div @scroll="handleScroll" class="histories" :class="info.histories.length === 0 ? 'empty' : ''" ref="historiesContainer">
                <Text v-if="info.histories.length === 0" class="message empty">
                    <span>{{ info.section ? "题目解析没看懂？" : "在题目解析页面点击AI标识" }}向AI提问</span>
                </Text>
                <div class="message-box" :class="item.role" v-for="(item, index) in info.histories" :key="index" >
                    <Text class="message" :class="[item.role, index === info.histories.length - 1 && info.showAnswering ? 'answering' : 'done']">
                        <template v-for="msg in item.messages">
                            <div class="reasoning" v-if="msg.reasoning_content && msg.reasoning_content.trim()">
                                <Button class="header" style="cursor: pointer;" @click="msg.showReasoning = !msg.showReasoning">
                                    <ChevronDownIcon v-if="msg.showReasoning" class="icon" />
                                    <ChevronRightIcon v-else class="icon" />
                                    思考过程
                                </Button>
                                <Text v-markdown="{ markdown: true, content: msg.reasoning_content, section: info.section?.id, parseHtml }" class="reasoning-content" v-if="msg.showReasoning" />
                            </div>
                            <Text class="content" v-if="msg.content && msg.content.trim() && !msg.type" v-markdown="{ markdown: item.role === 'assistant', content: msg.content, section: info.section?.id, parseHtml }" />
                            <Button class="header" v-if="msg.tool_call" disabled>
                                <ToolsIcon class="icon" :size="20" style="margin-right: 4px;"/>
                                {{ msg.tool_call }}
                            </Button>
                            <ToolDataShower v-if="msg.type" :inline="true" :custom-info="{ type: msg.type, value: msg.content }"/>
                        </template>
                        <div class="loading-icon" style="margin: 0 10px;" v-if="index === info.histories.length - 1 && info.showAnswering" :key="index">
                            <LoadingIcon />
                        </div>
                    </Text>
                    <div v-if="index !== info.histories.length - 1 || !info.showAnswering" class="copy-button"> <ContentCopyIcon :size="20" class="icon" @click="copyToClipboard(item.messages.map(m => m.content).join('\n'))"/> </div>
                </div>
            </div>
            <Input v-model="input" placeholder="向AI提问" :area="true" @keydown.enter="onSubmit" />
            <Text class="bottom-bar">
                <SelectMenu :model-value="model" :options="models.map(m => ({ label: m.displayName, value: m.model }))" class="model-name" :placeholder="'选择模型'" @update:model-value="changeModel" :direction="'up'"/>
                <LightbulbOnIcon v-if="models.find(m => m.model === model)?.toolable" class="intelligent-icon" @click="showIntelligentTips(true)"/>
                <LightbulbOutlineIcon v-else class="intelligent-icon" @click="showIntelligentTips(false)"/>
                <span class="send" @click="onSubmit(null)">
                    <div v-if="info.showAnswering">
                        <StopCircleOutlineIcon class="icon" />
                    </div>
                    <div class="loading-icon" v-else-if="info.inAnswering">
                        <LoadingIcon />
                    </div>
                    <span v-else>发送</span>
                </span>
            </Text>
        </template>
    </Card>
</template>

<style scoped lang="scss">
quiz-loading {
    position: relative;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    height: 20%;
    width: 30%;
}

.quiz-ai-dialog {
    height: calc(100% - 20px);
    margin-bottom: 6px;
    display: flex;
    flex-direction: column;
}

.section {
    display: flex;
    height: fit-content;
    min-height: fit-content;
    max-height: fit-content;
    width: fit-content;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    margin: 10px;
    margin-left: auto;
    margin-right: auto;
    background-color: rgba(127, 120, 154, 0.4);
    overflow: auto;
    scrollbar-width: none;
    cursor: pointer;
    top: 0;
    position: sticky;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
}

.histories {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    overflow: auto;
    scrollbar-width: none;
}

.histories.empty {
    justify-content: center;
    align-items: center;
    font-size: 1.2rem;
}

.clear-history {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-grow: 1;

    span {
        cursor: pointer;
        bottom: 0;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        margin: 10px;
        background-color: rgba(206, 75, 67, 0.4);
        margin-top: auto;
        bottom: 0;
    }
}

.input {
    resize: none;
    height: 4rem;
    min-height: 4rem;
}

.message-box {
    margin: 10px;
    .copy-button {
        display: flex;
        .icon {
            opacity: 0.5;
            cursor: pointer;
            margin: 3px 0 3px 0;
            padding: 4px;
            border-radius: 8px;
            transition: background-color 0.2s ease;
            &:hover {
                background-color: var(--glass-button-hover-background);
            }
            &:active {
                opacity: 1;
            }
        }
    }
    .message {
        width: fit-content;
        max-width: 100%;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;

        .header {
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: 0;
            gap: 3px;

            .icon {
                margin: -3px;
                margin-right: 2px;
            }
        }

        .reasoning {

            .reasoning-content {
                border-left: gray 3px solid;
                margin-left: 3px;
                margin-bottom: 1rem;
                padding-left: 1rem;

                -webkit-user-select: text;
                user-select: text;
            }
        }
        .content {
            -webkit-user-select: text;
            user-select: text;
        }
    }
}

.message-box.user {
    margin-left: auto;
    max-width: 75%;
    .copy-button {
        .icon {
            right: 0; 
            margin-left: auto;
        }
    }
}

.message.user {
    right: 0;
    margin-left: auto;
    align-self: flex-end;
    background-color: rgba(69, 175, 195, 0.2);

    .content {
        white-space: pre-wrap;
    }
}

.message-box.assistant {
    max-width: 100%;
    right: 0;
    &::before {
        content: 'SubQuiz AI';
        font-size: 1.5rem;
        font-weight: bolder;
        margin: 18px;
        margin-bottom: -20px;
        font-family: 'Maple Mono NF CN';
        font-style: italic;
    }
    .message {
        padding-bottom: 0;
        padding-top: 0;
        width: unset;
        right: 0;
        &::before, &.done::after {
            content: '';
            border-bottom: 1px solid var(--color);
            opacity: 0.2;
            width: 100%;
            height: 2px;
            display: block;
            margin: 10px 0 5px 0;
        }
    }
    .copy-button {
        margin: 0;
        .icon {
            margin: 0;
            margin-left: 15px;
        }
    }
}

.message.assistant {
    left: 0;
    margin-right: auto;
    align-self: flex-start;
    .content {
        margin-left: 3px;
    }
}

.bottom-bar {
    display: flex;
    justify-content: start;
    align-items: center;
    height: 60px;
    min-height: 60px;
    max-height: 60px;

    .model-name {
        width: 181px;
        min-width: 181px;
        max-width: 181px;
    }
    .intelligent-icon {
        cursor: pointer;
        // color: rgba(86, 135, 247, 0.8);
        color: var(--glass-button-highlight-border);
    }
    span.send {
        width: 64px;
        min-width: 64px;
        max-width: 64px;
        cursor: pointer;
        bottom: 0;
        padding: 0.5rem 1rem;
        border-radius: 1rem;
        margin: 10px 10px 10px auto;
        right: 0;
        background-color: rgba(76, 107, 190, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
    }
}

@keyframes loading {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.loading-icon {
    width: 1.5rem;
    height: 1.5rem;
    animation: loading 1s linear infinite;
}

:deep(.tool-data-link) {
    background-color: var(--pin-bgcolor);
    border: 2px solid var(--pin-border-color);
    color: var(--pin-text-color);
    display: inline-flex;
    width: 1.25rem;
    height: 1.25rem;
    justify-content: center;
    align-items: center;
    font-size: 0.8rem;
    border-radius: 0.40rem;
    cursor: pointer;
    user-select: none;
    margin-left: 5px;
    margin-right: 5px;
}
</style>