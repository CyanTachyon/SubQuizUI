<script lang="ts" setup>
import { ref } from 'vue';
import type { AnswerType } from '../dataClasses/Question';
import type { Section } from '../dataClasses/Section';
import { ask, type AiHistory } from '../networks/backend/ai';
import Input from '../components/Input.vue';
import { useNotificationStore } from '../stores/notification';
import LoadingIcon from 'vue-material-design-icons/Loading.vue';
import { getSectionBrief } from '../utils/utils';
import ChevronRightIcon from 'vue-material-design-icons/ChevronRight.vue';
import ChevronDownIcon from 'vue-material-design-icons/ChevronDown.vue';

export type AiInfo = {
    history: (AiHistory & {showReasoning: boolean})[];
    answering: boolean;
}

const { section } = defineProps<{
    section: Section<AnswerType, AnswerType, string>;
}>();

const info = defineModel<AiInfo>();

const input = ref('');

const model = ref('BDFZ_HELPER' as ('BDFZ_HELPER' | 'QUIZ_AI'));

function changeModel(newModel: 'BDFZ_HELPER' | 'QUIZ_AI')
{
    model.value = newModel;
}

function onSubmit(event: KeyboardEvent)
{
    if (event && event.shiftKey) return; // 忽略 Shift/Ctrl/Alt 键的 Enter
    event?.preventDefault();
    if (input.value.trim() === '' || info.value.answering) return;
    info.value.answering = true;

    const history0 = JSON.parse(JSON.stringify(info.value.history)) as AiHistory[];
    info.value.history.push({
        role: 'user',
        reasoning_content: null,
        content: input.value,
        showReasoning: true,
    });
    info.value.history.push({
        role: 'assistant',
        reasoning_content: '',
        content: '',
        showReasoning: true,
    });

    ask(
        model.value,
        section,
        input.value,
        history0,
        (response) => {
            if (response.content) info.value.history[info.value.history.length - 1].content += response.content;
            if (response.reasoning_content) info.value.history[info.value.history.length - 1].reasoning_content += response.reasoning_content;
        },
    ).catch(() => {
        useNotificationStore().addError('请求失败，请稍后再试。');
        info.value.history[info.value.history.length - 1].reasoning_content = '';
        info.value.history[info.value.history.length - 1].content = '请求失败，请稍后再试。';
    }).finally(() => {info.value.answering = false;});
    input.value = '';
}

</script>

<template>
    <div style="width: calc(85vw); height: calc(85vh); display: flex; flex-direction: column;">
        <div class="section">
            {{ getSectionBrief(section) }}
        </div>
        <div class="histories" :class="info.history.length === 0 ? 'empty' : ''">
            <div v-if="info.history.length === 0" class="message empty">
                <span>题目解析没看懂？向AI提问</span>
            </div>
            <div v-for="(item, index) in info.history" :key="index" class="message" :class="item.role">
                <div class="reasoning" v-if="item.reasoning_content">
                    <div class="reasoning-header" @click="item.showReasoning = !item.showReasoning">
                        <ChevronDownIcon v-if="item.showReasoning" class="icon" />
                        <ChevronRightIcon v-else class="icon" />
                        思考过程
                    </div>
                    <div v-markdown="{ markdown: true, content: item.reasoning_content, section: section.id }"
                        class="reasoning-content" v-if="item.showReasoning" />
                </div>
                <div class="content" v-if="item.content"
                    v-markdown="{ markdown: true, content: item.content, section: section.id }" />
                <div class="loading-icon" v-if="index === info.history.length - 1 && info.answering" :key="index">
                    <LoadingIcon />
                </div>
            </div>
            <div v-if="info.history.length > 0 && !info.answering" class="clear-history">
                <span @click="info.history = []">清空历史</span>
            </div>
        </div>
        <Input v-model="input" placeholder="向AI提问" :area="true" @keydown.enter="onSubmit" />
        <div class="bottom-bar">
            <span @click="changeModel('BDFZ_HELPER')" class="model-name" :class="model === 'BDFZ_HELPER' ? 'active' : ''">
                北大附中问答助手
            </span>
            <span @click="changeModel('QUIZ_AI')" class="model-name" :class="model === 'QUIZ_AI' ? 'active' : ''">
                Quiz AI
            </span>
            <span class="tip" v-if="model === 'QUIZ_AI'">
                *QuizAI 推理能力更强，但图片识别仍处于测试阶段
            </span>
            <span class="send" @click="onSubmit(null)">
                发送
            </span>
        </div>
    </div>
</template>

<style scoped lang="scss">
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
    span.model-name.active {
        background-color: rgba(98, 215, 123, 0.4);
    }
    span.tip {
        opacity: 0.7;
        margin-bottom: 0.5rem;
    }
    span.send {
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