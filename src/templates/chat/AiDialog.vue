<script lang="tsx" setup>
import { ref, nextTick, computed } from 'vue';
import type { AnswerType } from '../../dataClasses/Question';
import type { Section } from '../../dataClasses/Section';
import { cancelChat, chatSSE, createChat, deleteChat, getChat, getContentText, mergeContent, parseChatUrl, sendContent, type AiHistory, type AiMessage, type Model, type ModelInfo, type ToolDataInfo, } from '../../networks/backend/ai';
import Input from '../../components/Input.vue';
import { useNotification } from '../../stores/notification';
import LoadingIcon from 'vue-material-design-icons/Loading.vue';
import { copyToClipboard, dialog, pickImage } from '../../utils/utils';
import ChevronRightIcon from 'vue-material-design-icons/ChevronRight.vue';
import ChevronDownIcon from 'vue-material-design-icons/ChevronDown.vue';
import type { Chat } from '../../dataClasses/Chat';
import type { ChatId } from '../../dataClasses/Ids';
import Loading from '../../components/Loading.vue';
import QuizView from '../QuizView.vue';
import Text from '../../components/Text.vue';
import Card from '../../components/Card.vue';
import { getAiModels } from '../../networks/backend/ai';
import SelectMenu from '../../components/SelectMenu.vue';
import { storageGet, storageSet } from '../../utils/storage';
import { Capacitor } from '@capacitor/core';
import { TrashIcon } from '@heroicons/vue/16/solid';
import ImageOutlineIcon from 'vue-material-design-icons/ImageOutline.vue';
import ContentCopyIcon from 'vue-material-design-icons/ContentCopy.vue';
import FileQuestionIcon from 'vue-material-design-icons/FileQuestion.vue';
import ToolsIcon from 'vue-material-design-icons/Tools.vue';
import Button from '../../components/Button.vue';
import LightbulbOnIcon from 'vue-material-design-icons/LightbulbOn.vue';
import LightbulbOutlineIcon from 'vue-material-design-icons/LightbulbOutline.vue';
import { getThemes } from '../../stores/theme';
import ToolDataShower from './ToolDataShower.vue';
import StopCircleOutlineIcon from "vue-material-design-icons/StopCircleOutline.vue";
import SyncIcon from "vue-material-design-icons/Sync.vue";
import TrashCanIcon from "vue-material-design-icons/TrashCan.vue";
import PencilIcon from "vue-material-design-icons/Pencil.vue";

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
            showReasoning: true,
        });
        if (shouldAutoScroll.value) 
        {
            scrollToBottom();
        }
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
    if (getContentText(message.content) && !(getContentText(lastMessage.content).trim()) && lastMessage.reasoning_content) lastMessage.showReasoning = false;
    if (message.content) lastMessage.content = mergeContent(lastMessage.content, message.content);
    if (message.reasoning_content) lastMessage.reasoning_content += message.reasoning_content;

    if (message.banned) 
    {
        last.messages = [
            {
                content: "对不起，该聊天无法继续",
                reasoning_content: '',
                showReasoning: false,
            }
        ]
        info.value.showAnswering = false;
        info.value.banned = true;
    }
    else if (message.finished) 
    {
        info.value.showAnswering = false;
    }

    if (shouldAutoScroll.value) 
    {
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
            banned: false,
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
const inputImages = ref<string[]>([]);
const editingLastMessage = ref(false);
const editContent = ref('');
const editImages = ref<string[]>([]);
const uploadingImage = ref(false);
const inputImagesWithoutPrefix = computed(() => 
{
    return inputImages.value.map((img) => img.replace(/^data:image\/[a-z]+;base64,/, ''));
});

function uploadImage()
{
    if (uploadingImage.value) return;
    if (inputImages.value.length >= 5) 
    {
        useNotification().addWarning('一次最多只能上传5张图片');
        return;
    }

    uploadingImage.value = true;
    pickImage(1_000_000).then((img0) => 
    {
        if (!img0) return;
        if (inputImages.value.includes(img0)) 
        {
            useNotification().addWarning('请勿重复上传相同图片');
            return;
        }
        inputImages.value.push(img0);
    }).finally(() => 
    {
        uploadingImage.value = false;
    });
}
function deleteImage(img: string)
{
    inputImages.value = inputImages.value.filter(i => i !== img);
}

const model = ref<Model>('');
const models = ref<ModelInfo[]>([
    {
        model: '',
        displayName: "加载中...",
        toolable: false,
    }
]);

(async () =>
{
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

function onSubmit(event: KeyboardEvent | null, regenerate = false, editMode = false)
{
    if (event && (event.shiftKey || isMobileDevice())) return;
    event?.preventDefault();
    if (info.value.banned) 
    {
        useNotification().addError('对不起，该聊天无法继续');
        return;
    }

    // 取消回答
    if (info.value.showAnswering && event === null)
    {
        cancelChat(info.value.id);
        return;
    }

    // 编辑模式下的验证
    if (editMode)
    {
        if (editContent.value.trim() === '' || info.value.inAnswering || !editingLastMessage.value) return;
    }
    else
    {
        if ((input.value.trim() === '' && !regenerate) || info.value.showAnswering) return;
    }
    
    if (info.value.inAnswering)
    {
        useNotification().addError('请求正在处理中，请稍等片刻。');
        return;
    }
    else if (uploadingImage.value)
    {
        useNotification().addError('正在上传图片，请稍等片刻。');
        return;
    }
    
    // 编辑模式下关闭编辑界面
    if (editMode)
    {
        editingLastMessage.value = false;
    }
    
    info.value.inAnswering = true;

    (async () => {
    
    if (!info.value.id)
    {
        const id = await createChat(info.value.section, input.value, inputImagesWithoutPrefix.value, model.value)
        props.onNewChat(id);
        return;
    }
    else 
    {
        let content: string;
        let images: string[];

        if (regenerate)
        {
            let lstUserMessageIndex: number = -1;
            for (let i = info.value.histories.length - 1; i >= 0; i--) 
            {
                if (info.value.histories[i].role === 'user') 
                {
                    lstUserMessageIndex = i;
                    break;
                }
            }
            if (lstUserMessageIndex !== -1) 
            {
                const content0 = info.value.histories[lstUserMessageIndex].messages[0].content;
                if (typeof content0 === 'string')
                    content = content0;
                else 
                {
                    content = getContentText(content0);
                    images = content0.filter(c => c.type === 'image_url').map(c => c.image_url.url);
                }
            }
            while(info.value.histories.length > lstUserMessageIndex + 1)
                info.value.histories.pop();
        }
        else if (editMode)
        {
            // 编辑模式逻辑
            let lastUserMessageIndex = -1;
            for (let i = info.value.histories.length - 1; i >= 0; i--) 
            {
                if (info.value.histories[i].role === 'user') 
                {
                    lastUserMessageIndex = i;
                    break;
                }
            }
            
            if (lastUserMessageIndex === -1) return;
            
            // 移除最后用户消息之后的所有消息
            while(info.value.histories.length > lastUserMessageIndex + 1)
                info.value.histories.pop();
            
            content = editContent.value;
            
            // 处理图片 - 分离新图片(base64)和已有图片
            const newImages: string[] = [];
            const existingImages: string[] = [];
            
            for (const img of editImages.value)
            {
                if (img.startsWith('data:image/'))
                {
                    // 新图片 - 提取base64
                    newImages.push(img.replace(/^data:image\/[a-z]+;base64,/, ''));
                }
                else
                {
                    // 已有图片
                    existingImages.push(img);
                }
            }
            
            images = [...existingImages, ...newImages];
            const contentArray = [
                ...editImages.value.map(img => ({
                    type: 'image_url' as const,
                    image_url: { url: img }
                })),
                { type: 'text' as const, text: content }
            ];
            info.value.histories[lastUserMessageIndex].messages[0].content = contentArray;
            // 清空编辑状态
            editContent.value = '';
            editImages.value = [];
            regenerate = true; // 编辑模式总是使用regenerate逻辑
        }
        else
        {
            content = input.value;
            images = inputImagesWithoutPrefix.value;
            info.value.histories.push({
                role: 'user',
                messages: [
                    {
                        content: [
                            ...inputImages.value.map(img => ({
                                type: 'image_url' as const,
                                image_url: { url: img }
                            })),
                            { type: 'text' as const, text: content },
                        ],
                    }
                ]
            });
            input.value = '';
            inputImages.value = [];
        }

        const newInfo = await sendContent({
            chatId: info.value.id, 
            content: content,
            images: images,
            model: model.value, 
            hash: info.value.hash,
            regenerate: regenerate,
        })
        if (newInfo) 
        {
            info.value.hash = newInfo.hash;
            info.value.histories[info.value.histories.length - 1].messages = [
                {
                    content: newInfo.content,
                    showReasoning: false,
                }
            ]
        } 
        else 
        {
            useNotification().addError('发生冲突，请刷新页面重试。');
            info.value.showAnswering = false;
            return;
        }
    }

    info.value.histories.push({
        role: 'assistant',
        messages: []
    });

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
    });
}

function openSection()
{
    if (!info.value.section) return;
    const close = dialog(<div style="overflow: auto; scrollbar-width: none; height: 85vh; width: 85vw;">
    <QuizView editable={false} modelValue={({sections: [info.value.section], correct: null})}></QuizView>
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
    ele.querySelectorAll('tool_data, data').forEach((toolDataEle: HTMLElement, index: number) =>
    {
        const path = toolDataEle.getAttribute('path');
        const type = toolDataEle.getAttribute('type');
        toolDataEle.innerHTML = '' + (index + 1);
        toolDataEle.classList.add('tool-data-link');
        if (path) toolDataEle.onclick = () =>
        {
            const close = dialog(<ToolDataShower type={type} path={path} dataset={bdfzData} chat={info.value.id} close={() => close()} />, () => { close(); });
        }
    });
}

function copy(messages: DisplayMessage[])
{
    const content = messages.map(m => 
    {
        if (m.type) return '';
        if (m.content) return getContentText(m.content).trim();
    }).filter(m => m).join('\n\n');
    const dataTagReg = /<(tool_)?data[^>]*>/g;
    copyToClipboard(content.replace(dataTagReg, ''));
}

function isLastUserMessage(index: number): boolean
{
    // 找到最后一条用户消息的索引
    for (let i = info.value.histories.length - 1; i >= 0; i--) 
    {
        if (info.value.histories[i].role === 'user') 
        {
            return i === index;
        }
    }
    return false;
}

function startEditLastMessage()
{
    if (info.value.inAnswering || editingLastMessage.value) return;
    
    // Find the last user message
    let lastUserMessageIndex = -1;
    for (let i = info.value.histories.length - 1; i >= 0; i--) 
    {
        if (info.value.histories[i].role === 'user') 
        {
            lastUserMessageIndex = i;
            break;
        }
    }
    
    if (lastUserMessageIndex === -1) return;
    
    const lastUserMessage = info.value.histories[lastUserMessageIndex].messages[0];
    const content0 = lastUserMessage.content;
    
    if (typeof content0 === 'string')
    {
        editContent.value = content0;
        editImages.value = [];
    }
    else 
    {
        editContent.value = getContentText(content0);
        editImages.value = content0.filter(c => c.type === 'image_url').map(c => c.image_url.url);
    }
    
    editingLastMessage.value = true;
}

function cancelEditLastMessage()
{
    editingLastMessage.value = false;
    editContent.value = '';
    editImages.value = [];
}

function deleteEditImage(img: string)
{
    const index = editImages.value.indexOf(img);
    if (index > -1) 
    {
        editImages.value.splice(index, 1);
    }
}

function uploadEditImage()
{
    if (uploadingImage.value) return;
    
    uploadingImage.value = true;
    pickImage().then((img) => 
    {
        if (img) 
        {
            editImages.value.push(img);
        }
    }).finally(() => 
    {
        uploadingImage.value = false;
    });
}

function confirmEditLastMessage(event?: KeyboardEvent)
{
    onSubmit(event || null, false, true);
}

</script>

<template>
    <Card class="quiz-ai-dialog" :style="{ 
        '--pin-bgcolor': getThemes().isDark ? 'var(--button-highlight-border)' : 'unset',
        '--pin-border-color': getThemes().isDark ? 'unset' : 'var(--button-highlight-border)',
        '--pin-text-color': getThemes().isDark ? 'var(--color)' : 'var(--button-highlight-border)',
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
            <div @scroll="handleScroll" class="histories scrollbar" :class="info.histories.length === 0 ? 'empty' : ''" ref="historiesContainer">
                <Text v-if="info.histories.length === 0" class="message empty">
                    <span>{{ info.section ? "题目解析没看懂？" : "在题目解析页面点击AI标识" }}向AI提问</span>
                </Text>
                <div class="message-box" :class="item.role" v-for="(item, index) in info.histories" :key="index" >
                    <Text class="message" :class="[item.role, index === info.histories.length - 1 && info.showAnswering ? 'answering' : 'done']">
                        <template v-for="msg in item.messages">
                            
                            <template v-if="msg.tool_call">
                                <Button class="header" :disabled="!msg.content" @click="msg.showReasoning = !msg.showReasoning">
                                    <ToolsIcon class="icon" :size="20" style="margin-right: 4px;"/>
                                    {{ msg.tool_call }}
                                </Button>
                                <Text v-if="msg.content && msg.showReasoning" class="tool-call-parm" v-markdown="{ markdown: true, content: msg.content, section: info.section?.id }"/>
                            </template>

                            <template v-else-if="msg.type">
                                <ToolDataShower :chat="info.id" :inline="true" :custom-info="{ type: msg.type, value: getContentText(msg.content) }"/>
                            </template>

                            <template v-else>
                                <div class="reasoning" v-if="msg.reasoning_content && msg.reasoning_content.trim()">
                                    <Button class="header" style="cursor: pointer;" @click="msg.showReasoning = !msg.showReasoning">
                                        <ChevronDownIcon v-if="msg.showReasoning" class="icon" />
                                        <ChevronRightIcon v-else class="icon" />
                                        思考过程
                                    </Button>
                                    <Text v-markdown="{ markdown: true, content: msg.reasoning_content, section: info.section?.id, parseHtml }" class="reasoning-content" v-if="msg.showReasoning" />
                                </div>
                                <template v-if="msg.content && (typeof msg.content !== 'string')" v-for="c in msg.content">
                                    <Text class="content" v-if="c.type === 'text' && c.text.trim()" v-markdown="{ markdown: item.role === 'assistant', content: c.text, section: info.section?.id, parseHtml }" />
                                    <ToolDataShower v-else-if="c.type === 'image_url'" :chat="info.id" :inline="true" :custom-info="{ type: 'IMAGE', value: c.image_url.url }" />
                                </template>
                                <Text class="content" v-else-if="msg.content && (msg.content as string).trim()" v-markdown="{ markdown: item.role === 'assistant', content: msg.content, section: info.section?.id, parseHtml }" />
                            </template>
                            
                        </template>
                        <div class="loading-icon" style="margin: 0 10px;" v-if="index === info.histories.length - 1 && info.showAnswering" :key="index">
                            <LoadingIcon />
                        </div>
                    </Text>
                    <div v-if="index !== info.histories.length - 1 || !info.showAnswering" class="buttons"> 
                        <PencilIcon v-if="item.role === 'user' && isLastUserMessage(index) && !info.inAnswering && !editingLastMessage" :size="20" class="icon" @click="startEditLastMessage"/>
                        <ContentCopyIcon :size="20" class="icon" @click="copy(item.messages)"/> 
                        <SyncIcon v-if="item.role === 'assistant' && index === info.histories.length - 1" :size="20" class="icon" @click="onSubmit(null, true)"/>
                    </div>
                </div>
            </div>

            <div class="img-container">
                <div v-for="(img, index) in (editingLastMessage ? editImages : inputImages)" :key="index" class="img" :style="{ backgroundImage: `url(${parseChatUrl(info.id, img)})` }">
                    <TrashCanIcon :size="30" @click="editingLastMessage? deleteEditImage(img) : deleteImage(img)" class="remove-img"/>
                </div>
            </div>
            
            <Input v-if="editingLastMessage" v-model="editContent" placeholder="编辑消息内容" :area="true" @keydown.enter="confirmEditLastMessage" @keydown.esc="cancelEditLastMessage()" class="edit-input"/>
            <Input v-else v-model="input" placeholder="向AI提问" :area="true" @keydown.enter="onSubmit" />
            
            <Text class="bottom-bar">
                <SelectMenu :model-value="model" :options="models.map(m => ({ label: m.displayName, value: m.model }))" class="model-name" :placeholder="'选择模型'" @update:model-value="changeModel" :direction="'up'"/>
                <LightbulbOnIcon v-if="models.find(m => m.model === model)?.toolable" class="intelligent-icon" @click="showIntelligentTips(true)"/>
                <LightbulbOutlineIcon v-else class="intelligent-icon" @click="showIntelligentTips(false)"/>
                <span class="upload-img" @click="editingLastMessage ? uploadEditImage() : uploadImage()">
                    <ImageOutlineIcon class="icon" v-if="!uploadingImage"/>
                    <div class="loading-icon" v-else>
                        <LoadingIcon />
                    </div>
                </span>
                <span class="send" v-if="editingLastMessage" @click="cancelEditLastMessage()">
                    <span>取消</span>
                </span>
                <span class="send" @click="editingLastMessage ? confirmEditLastMessage() : onSubmit(null)">
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
    .buttons {
        display: flex;
        gap: 5px;
        .icon {
            opacity: 0.5;
            cursor: pointer;
            margin: 3px 0 3px 0;
            padding: 4px;
            border-radius: 8px;
            transition: background-color 0.2s ease;
            &:hover {
                background-color: var(--button-hover-background);
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

        .tool-call-parm {
            position: relative;
            &::before {
                content: '';
                border-left: gray 3px solid;
                position: absolute;
                left: -10px;
                top: 0;
                bottom: 0;
            }
            margin-left: 13px;
            width: fit-content;
            -webkit-user-select: text;
            user-select: text;
            border-radius: 0.75rem;
            padding: 0.5rem;
            background-color: rgba(0,0,0,0.15);
        }
    }
}

.message-box.user {
    margin-left: auto;
    max-width: 75%;
    .buttons {
        .icon:first-child {
            margin-left: auto;
        }
        .icon:last-child {
            right: 0;
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
    .buttons {
        margin: 0;
        .icon:first-child {
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

.img-container {
    display: flex;
    gap: 10px;
    margin: 10px;
    margin-bottom: -5px;
    flex-direction: row;
    overflow: auto;
    scrollbar-width: none;
    min-height: fit-content;
    max-height: fit-content;
    height: fit-content;
    .img {
        background-size: 100% 100%;
        background-position: center;
        background-repeat: no-repeat;
        background-clip: content-box;
        position: relative;
        max-height: 100px;
        min-height: 100px;
        height: 100px;
        max-width: 100px;
        min-width: 100px;
        width: 100px;
        border-radius: 0.5rem;
        .remove-img {
            position: absolute;
            bottom: 5px;
            right: 5px;
            color: red;
            cursor: pointer;
        }
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
        color: var(--button-highlight-border);
    }
    span.upload-img {
        width: 45px;
        min-width: 45px;
        max-width: 45px;
        height: 37.33333px;
        min-height: 37.33333px;
        max-height: 37.33333px;
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
    span.send {
        width: 64px;
        min-width: 64px;
        max-width: 64px;
        height: 37.33333px;
        min-height: 37.33333px;
        max-height: 37.33333px;
        cursor: pointer;
        bottom: 0;
        padding: 0.5rem 1rem;
        border-radius: 1rem;
        margin: 10px 10px 10px 10px;
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

.edit-input {
    border: 2px solid var(--button-highlight-border);
}
</style>