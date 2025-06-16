<script lang="tsx" setup>
import { ref, nextTick } from 'vue';
import type { AnswerType } from '../dataClasses/Question';
import type { Section } from '../dataClasses/Section';
import { chatSSE, createChat, getChat, sendContent, type AiHistory, type AiMessage, type Model } from '../networks/backend/ai';
import Input from '../components/Input.vue';
import { useNotificationStore } from '../stores/notification';
import LoadingIcon from 'vue-material-design-icons/Loading.vue';
import { dialog, getSectionBrief } from '../utils/utils';
import ChevronRightIcon from 'vue-material-design-icons/ChevronRight.vue';
import ChevronDownIcon from 'vue-material-design-icons/ChevronDown.vue';
import type { Chat } from '../dataClasses/Chat';
import type { ChatId } from '../dataClasses/Ids';
import Loading from '../components/Loading.vue';
import QuizView from './QuizView.vue';
import Text from '../components/Text.vue';

export type AiInfo = Chat & {
    histories: (AiHistory & { showReasoning: boolean; })[];
    showAnswering: boolean;
    inAnswering: boolean;
}

const props = defineProps<{
    info: ChatId | Section<AnswerType, AnswerType, string>;
    onNewChat: () => void;
}>();

const info = ref<AiInfo>();
const loading = ref(true);
const historiesContainer = ref<HTMLElement>();
const shouldAutoScroll = ref(true);

// 检查是否滚动到底部
const isScrolledToBottom = () => {
    if (!historiesContainer.value) return true;
    const { scrollTop, scrollHeight, clientHeight } = historiesContainer.value;
    return scrollTop + clientHeight >= scrollHeight - 5; // 5px tolerance
};

// 滚动到底部
const scrollToBottom = () => {
    if (!historiesContainer.value) return;
    nextTick(() => {
        historiesContainer.value!.scrollTop = historiesContainer.value!.scrollHeight;
    });
};

// 处理滚动事件
const handleScroll = () => {
    shouldAutoScroll.value = isScrolledToBottom();
};

const onMessage = (message: AiMessage & { finished: boolean, banned: boolean; }) => 
{
    if (info.value.histories[info.value.histories.length - 1].role !== 'assistant')
    {
        info.value.histories.push({
            role: 'assistant',
            reasoning_content: '',
            content: '',
            showReasoning: true,
        });
    }
    if (message.content) info.value.histories[info.value.histories.length - 1].content += message.content;
    if (message.reasoning_content) info.value.histories[info.value.histories.length - 1].reasoning_content += message.reasoning_content;

    if (message.banned) 
    {
        info.value.histories[info.value.histories.length - 1].content = "对不起，该聊天无法继续";
        info.value.histories[info.value.histories.length - 1].reasoning_content = '';
    }
    else if (message.finished) 
    {
        info.value.showAnswering = false;
    }

    if (shouldAutoScroll.value) {
        scrollToBottom();
    }
}

(async () => {
    if (typeof props.info === 'number' && props.info > 0)
    {
        const chat = await getChat(props.info);
        info.value = {
            ...chat,
            showAnswering: false,
            inAnswering: false,
            histories: chat.histories.map((history) => ({
                ...history,
                showReasoning: false,
            })),
        }
    }
    else
    {
        info.value = {
            id: 0,
            section: typeof props.info === 'object' ? props.info : null,
            user: 0,
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
            reasoning_content: '',
            content: '',
            showReasoning: true,
        });
    }

    info.value.showAnswering = true;
    info.value.inAnswering = true;
    chatSSE(
        info.value.id,
        info.value.hash,
        onMessage
    ).finally(() => info.value.inAnswering = info.value.showAnswering = false);
})().then(() => { loading.value = false; nextTick(scrollToBottom); });

const input = ref('');

const model = ref<Model>(localStorage.getItem('quiz-ai-model') as Model || 'BDFZ_HELPER');

function changeModel(newModel: Model)
{
    model.value = newModel;
    localStorage.setItem('quiz-ai-model', newModel);
}

function onSubmit(event: KeyboardEvent)
{
    if (event && event.shiftKey) return;
    event?.preventDefault();
    if (input.value.trim() === '' || info.value.showAnswering) return;
    else if (info.value.inAnswering) 
    {
        useNotificationStore().addError('请求正在处理中，请稍等片刻。');
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
        try { props.onNewChat(); } catch (e) {  }
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
            useNotificationStore().addError('发生冲突，请刷新页面重试。');
            info.value.showAnswering = false;
            return;
        }

    }

    info.value.histories.push({
        role: 'user',
        reasoning_content: null,
        content: input.value,
        showReasoning: true,
    });
    info.value.histories.push({
        role: 'assistant',
        reasoning_content: '',
        content: '',
        showReasoning: true,
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
        )
    }
    finally
    {
        info.value.showAnswering = false;
    }
})().finally(() => { info.value.inAnswering = false; });
}

function openSection()
{
    if (!info.value.section) return;
    const close = dialog(<div style="overflow: auto; scrollbar-width: none; height: 85vh; width: 85vw;">
    <QuizView editable={false} quiz={({sections: [info.value.section], correct: null})}></QuizView>
    </div>, () => {close();});
}

</script>

<template>
    <div v-if="loading">
        <Loading />
    </div>
    <div v-else style="display: flex; flex-direction: column;">
        <Text class="section" v-if="info.section" @click="openSection">
            {{ getSectionBrief(info.section) }}
        </Text>
        <div @scroll="handleScroll" class="histories" :class="info.histories.length === 0 ? 'empty' : ''" ref="historiesContainer">
            <Text v-if="info.histories.length === 0" class="message empty">
                <span>{{ info.section ? "题目解析没看懂？" : "在题目解析页面点击AI标识" }}向AI提问</span>
            </Text>
            <Text v-for="(item, index) in info.histories" :key="index" class="message" :class="item.role">
                <div class="reasoning" v-if="item.reasoning_content">
                    <div class="reasoning-header" @click="item.showReasoning = !item.showReasoning">
                        <ChevronDownIcon v-if="item.showReasoning" class="icon" />
                        <ChevronRightIcon v-else class="icon" />
                        思考过程
                    </div>
                    <div v-markdown="{ markdown: true, content: item.reasoning_content, section: info.section?.id }"
                        class="reasoning-content" v-if="item.showReasoning" />
                </div>
                <div class="content" v-if="item.content"
                    v-markdown="{ markdown: true, content: item.content, section: info.section?.id }" />
                <div class="loading-icon" v-if="index === info.histories.length - 1 && info.showAnswering" :key="index">
                    <LoadingIcon />
                </div>
            </Text>
        </div>
        <Input v-model="input" placeholder="向AI提问" :area="true" @keydown.enter="onSubmit" />
        <Text class="bottom-bar">
            <span @click="changeModel('BDFZ_HELPER')" class="model-name bdfz-helper" :class="model === 'BDFZ_HELPER' ? 'active' : ''">
                北大附中问答助手
            </span>
            <span @click="changeModel('QUIZ_AI')" class="model-name quiz-ai" :class="model === 'QUIZ_AI' ? 'active' : ''">
                Quiz AI
            </span>
            <span class="tip" v-if="model === 'QUIZ_AI'">
                *QuizAI 推理能力更强，但图片识别仍处于测试阶段
            </span>
            <span class="send" @click="onSubmit(null)">
                发送
            </span>
        </Text>
    </div>
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

.section {
    display: flex;
    max-height: 20%;
    height: fit-content;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    margin: 10px;
    background-color: rgba(127, 120, 154, 0.4);
    overflow: auto;
    scrollbar-width: none;
    cursor: pointer;
    top: 0;
    position: sticky;
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

.message {
    width: fit-content;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    margin: 10px;

    -webkit-user-select: text;
    user-select: text;
}

.message.user {
    align-self: flex-end;
    background-color: rgba(96, 178, 139, 0.2);
    right: 0;
    margin-left: auto;
    max-width: 75%;
}

.message.assistant {
    align-self: flex-start;
    background-color: rgba(69, 175, 195, 0.2);
    left: 0;
    margin-right: auto;
    max-width: 95%;
}

.reasoning {
    .reasoning-header {
        cursor: pointer;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        margin: 10px 10px 10px 0;
        width: fit-content;
        font-weight: bold;
        background-color: rgba(125, 125, 125, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;

        .icon {
            margin: -3px;
        }
    }

    .reasoning-content {
        border-left: gray 3px solid;
        margin-left: 3px;
        margin-bottom: 1rem;
        padding-left: 1rem;
    }
}

.bottom-bar {
    display: flex;
    justify-content: start;
    align-items: center;
    height: 60px;
    min-height: 60px;
    max-height: 60px;

    span.model-name {
        cursor: pointer;
        bottom: 0;
        padding: 0.5rem 1rem;
        border-radius: 1rem;
        margin: 10px;
        border: 1px solid rgba(98, 215, 123, 0.4);
        background-color: transparent;
        margin-top: auto;
    }
    span.model-name.bdfz-helper {
        width: 165px;
        min-width: 165px;
        max-width: 165px;
    }
    span.model-name.quiz-ai {
        width: 105px;
        min-width: 105px;
        max-width: 105px;
    }
    span.model-name.active {
        background-color: rgba(98, 215, 123, 0.4);
    }
    span.tip {
        opacity: 0.7;
        height: 100%;
        overflow: hidden;
        display: flex;
        align-items: center;
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
</style>