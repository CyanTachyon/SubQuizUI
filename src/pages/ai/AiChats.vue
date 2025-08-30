<script setup lang="tsx">
import Card from "../../components/Card.vue";
import { defineComponent, onUnmounted, ref, watch } from "vue";
import type { Chat } from "../../dataClasses/Chat";
import { getChatList } from "../../networks/backend/ai";
import SidebarItem from "../../templates/sidebar/SidebarItem.vue";
import type { AnswerType } from "../../dataClasses/Question";
import type { Section } from "../../dataClasses/Section";
import type { ChatId } from "../../dataClasses/Ids";
import AiDialog from "../../templates/chat/AiDialog.vue";
import PlusIcon from "vue-material-design-icons/Plus.vue";
import Spacer from "../../components/Spacer.vue";
import Button from "../../components/Button.vue";
import Text from "../../components/Text.vue";
import { useRoute } from "vue-router";
import { replaceUrl } from "../../utils/utils";
import { addSidebar, removeSidebar } from "../../stores/sidebar";
import MessageTextIcon from "vue-material-design-icons/MessageText.vue";
import { phone } from "../../main";

document.title = 'AI答疑 - SubQuiz';

const route = useRoute();

const chats = ref<Chat[]>([]);
const info = ref(0 as ChatId | Section<AnswerType, AnswerType, string>);
const isLoading = ref(false);
const hasMore = ref(true);

if (history.state.section) info.value = history.state.section;
else if (route.query.id) info.value = Number(route.query.id) || 0;
history.replaceState({}, '');

function loadChats(reload: boolean)
{
    if (isLoading.value || (!hasMore.value && !reload)) return;

    isLoading.value = true;
    if (reload)
    {
        chats.value = [];
        hasMore.value = true;
    }
    getChatList(chats.value.length, 20).then((result) => 
    {
        const { list } = result;
        chats.value.push(...list);
        if (list.length < 20) hasMore.value = false;
        isLoading.value = false;
    }).catch(() => { isLoading.value = false; });
}

function handleScroll(event: Event) 
{
    const target = event.target as HTMLElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    if (scrollHeight - scrollTop - clientHeight < 10) loadChats(false);
}

function onChatNamed(id: ChatId, title: string)
{
    const chat = chats.value.find(c => c.id === id);
    if (chat) chat.title = title;
}

function onNewChat(id: ChatId)
{
    info.value = id;
    loadChats(true);
}

loadChats(false);

watch(info, (newInfo) => 
{
    if (typeof newInfo === 'object') return;
    replaceUrl('/ai/chat', { id: `${newInfo}` });
});

const sidebar = defineComponent({
    setup() {
        return () => (
        <Card class="ai-chat-sidebar">
            <div class="menu-title-box box">
                <div class="menu-title">Quiz AI</div>
            </div>

            <SidebarItem title="新建对话" icon={PlusIcon} onClick={() => info.value = 0} />
            <Spacer style="margin-top: 10px; margin-bottom: 10px;" />
            {chats.value.length == 0 && <Text class="sidebar-empty">
                还没有对话记录
            </Text>}
            {chats.value.length > 0 && <div class="chats" onScroll={ handleScroll }>
                {chats.value.map(chat => (
                    <Button class="item" key={chat.id} onClick={() => info.value = chat.id}>
                        { chat.title }
                    </Button> 
                ))}
                {isLoading.value && <Text class="loading-indicator">
                    加载中...
                </Text>}
                {!hasMore.value && chats.value.length > 0 && <Text class="no-more-indicator">
                    没有更多对话了
                </Text>}
            </div>}
        </Card>
        )
    }
})

watch(phone, (newPhone, oldPhone) => 
{
    if (newPhone === oldPhone) return;
    if (newPhone)
        addSidebar('ai', MessageTextIcon, sidebar);
    else
        removeSidebar('ai');
}, { immediate: true });

onUnmounted(() => 
{
    removeSidebar('ai');
})

</script>

<template>
    <quiz-ai-chats>
        <sidebar v-if="!phone"/>
        <div class="main-content">
            <AiDialog :key="typeof info === 'object' ? info.id : info" :info="info" @newChat="onNewChat"
                @chatNamed="onChatNamed" />
        </div>
    </quiz-ai-chats>
</template>

<style lang="scss">
.ai-chat-sidebar {
    display: flex;
    flex-direction: column;
    height: calc(100% - 20px);
    margin-bottom: 7px;
    --sidebar-open-width: 200px;

    .sidebar-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
    }

    .chats {
        margin: -10px;
        padding: 10px;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        scrollbar-width: none;
        flex-grow: 1;
        max-height: calc(100% - 165px);
        min-height: calc(100% - 165px);
    }

    .loading-indicator,
    .no-more-indicator {
        text-align: center;
        padding: 15px;
        opacity: 0.5;
        font-size: 14px;
    }

    .loading-indicator {
        color: var(--color)
    }

    .item {
        overflow: hidden;
        margin: 5px;
        min-width: 170px;
        max-width: 170px;
        min-height: 51px;
        max-height: 51px;
        display: flex;
        align-items: center;
        justify-content: start;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        cursor: pointer;
    }

    .box {
        overflow: hidden;
        display: flex;
        height: fit-content;
    }

    div.menu-title-box {
        margin-left: -6px;
        margin-right: -6px;
        margin-top: -6px;
        padding: 6px;
        flex-direction: row-reverse;

        ///
        min-height: 80px;
        max-height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;

        .menu-btn {
            position: relative;
            height: 48px;
            width: 50px;
            margin-left: 5px;
            margin-right: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            padding-left: 1.4rem;
        }

        div.menu-title {
            min-width: 125px;
            max-width: 125px;
            margin-top: auto;
            margin-bottom: auto;
            font-size: 25px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }
}
</style>

<style lang="scss" scoped>
/*** sidebar ***/

div.main-content {
    width: 100%;
    height: 100%;
    overflow: auto;
    scrollbar-width: none;
    position: relative;
}

quiz-ai-chats {
    height: 100%;
    width: 100%;
    display: flex;
}
</style>