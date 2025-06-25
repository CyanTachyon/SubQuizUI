<script setup lang="ts">
import { connectUrl, Target } from "../networks/utils/sendRequest.ts";
import { getToken } from "../utils/utils.tsx";
import { useRouter } from "vue-router";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { AnsiUp } from "ansi_up/ansi_up";
import Input from "../components/Input.vue";
import { createAnimationsController } from "../utils/AnimationsController.ts";
import { sleep } from "../utils/sleep.ts";
import { $appearDuration, State, useTransitionStore } from "../stores/transition.ts";

document.title = '控制台 - SubQuiz';

const router = useRouter();
const ansi_up = new AnsiUp();
const inputCommand = ref('');
const messages = ref<HTMLElement | null>(null);
const url = connectUrl(Target.BACKEND, '/terminal/api').replace('https://', 'wss://').replace('http://', 'ws://');
let timer;

let tabs = ref([]);
let select = undefined;

function setLastWord(word: string)
{
    let message = inputCommand.value;
    let index = message.lastIndexOf(' ');
    if (index === -1)
    {
        inputCommand.value = word;
        return;
    }
    inputCommand.value = message.substring(0, index) + ' ' + word;
}

function socketListener(event: MessageEvent)
{
    let data = JSON.parse(event.data);

    if (data.type === 'TAB')
    {
        tabs.value = data.data;
        if (tabs.value.length === 1)
        {
            select = 0;
            setLastWord(tabs.value[select]);
        }
        else
        {
            select = null;
        }
        return;
    }
    if (data.type === 'CLEAR')
    {
        messages.value.innerHTML = '';
        inputCommand.value = '';
        return;
    }
    data.data.split('\n').forEach((line: string) =>
    {
        const messagePre = document.createElement('pre');
        messagePre.style.margin = '0';
        messagePre.style.lineHeight = '1.3';
        messagePre.innerHTML = ansi_up.ansi_to_html(line);
        messages.value.appendChild(messagePre);
    });
    messages.value.scrollTop = messages.value.scrollHeight;
}

let history = [];
let historyIndex = history.length;
let socket: WebSocket | null = null;

function submit(event: Event)
{
    event.preventDefault();
    const message = inputCommand.value;
    inputCommand.value = '';
    if (message === '') return;
    history.push(message);
    historyIndex = history.length;
    select = undefined;
    socket.send(
        JSON.stringify(
            {
                type: 'COMMAND',
                data: message
            }
        )
    );
}

function socketCloseListener()
{
    socket = null;
    socket = openSocket();
}

function openSocket(): WebSocket
{
    if (timer)
    {
        router.push('/');
        return;
    }
    timer = setTimeout(() =>
    {
        timer = null;
    }, 1000);
    const socket_ = new WebSocket(url, ['Bearer', getToken()]);
    socket_.addEventListener('message', socketListener);
    socket_.addEventListener('close', socketCloseListener);
    return socket_;
}

function historyListener(event: KeyboardEvent)
{
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')
    {
        historyIndex = history.length;
        return;
    }
    event.preventDefault();
    if (event.key === 'ArrowUp')
    {
        if (historyIndex > 0)
        {
            historyIndex--;
            inputCommand.value = history[historyIndex];
        }
        else if (historyIndex === 0)
        {
            historyIndex--;
            inputCommand.value = '';
        }
        return;
    }
    if (event.key === 'ArrowDown')
    {
        if (historyIndex < history.length - 1)
        {
            historyIndex++;
            inputCommand.value = history[historyIndex];
        }
        else if (historyIndex === history.length - 1)
        {
            historyIndex++;
            inputCommand.value = '';
        }
        return;
    }
}

function tabListener(event: KeyboardEvent)
{
    const message = inputCommand.value;
    if (event.key !== 'Tab')
    {
        select = undefined;
        tabs.value = [];
        return;
    }
    event.preventDefault();
    if (tabs.value.length && select !== undefined)
    {
        if (select === null) select = 0;
        else select = (select + 1) % tabs.value.length;
        setLastWord(tabs.value[select]);
        return;
    }
    select = undefined;
    socket.send(
        JSON.stringify(
            {
                type: 'TAB',
                data: message
            }
        )
    );
}

function keyDownListener(event: KeyboardEvent)
{
    tabListener(event);
    historyListener(event);
}

onMounted(() =>
{
    socket = openSocket();
});

onBeforeUnmount(() =>
{
    if (socket)
    {
        socket.removeEventListener('close', socketCloseListener);
        socket.close();
    }
    if (timer) clearTimeout(timer);
});

let className = ref('appeared-messages');
let controller = createAnimationsController();
function onDisappearChange(value: boolean, oldValue: boolean)
{
    if (value === oldValue) return;
    controller.push([
        () => className.value = value ? 'messages-disappear' : 'messages-appear',
        () => sleep($appearDuration),
        () => className.value = value ? 'disappeared-messages' : 'appeared-messages'
    ]);
}
function onTransitionChange(value: State, oldValue: State | undefined)
{
    if (value === oldValue || value === State.NONE) return;
    if (value === State.ENTER) onDisappearChange(false, true);
    else onDisappearChange(true, false);
}
let transitionStore = useTransitionStore();
watch(() => transitionStore.state, onTransitionChange, { immediate: true });

</script>

<template>
    <quiz-main>
        <quiz-messages id="messages" ref="messages" :class="className" />
        <form @submit="submit">
            <Input class="messageInput" :area="false" placeholder="输入命令..." @keydown="keyDownListener"
                v-model="inputCommand" align="left" />
        </form>
        <Input 
            align="left" 
            :area="true"
            :value="tabs.map((tab, index) => tab + (index === tabs.length - 1 ? '' : ' ')).join(' ')" 
            class="tips"
            disabled 
        />
    </quiz-main>
</template>

<style scoped lang="scss">
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

h1 {
    margin-bottom: 20px;
}

@import url("https://fontsapi.zeoseven.com/442/main/result.css");

quiz-messages * {
    font-family: 'Maple Mono NF CN';
}

quiz-messages {
    display: block;
    height: calc(100% - 100px);
    overflow-y: auto;
    flex-grow: 1;
    border: none;
    border-radius: 4px;
    padding: 10px;
    overflow-y: auto;
    margin-bottom: 10px;
    width: 100%;
    height: calc(100vh - 250px);
    background: black;
    color: white;

    ::-webkit-scrollbar {
        display: none;
    }

    -ms-overflow-style: none;
    scrollbar-width: none;

    -webkit-user-select: text;
    user-select: text;
}

.appeared-messages {
    opacity: 1;
}

.disappeared-messages {
    opacity: 0;
}

.messages-disappear {
    @keyframes messages-disappear {
        0% {
            opacity: 1;
        }

        50% {
            opacity: 0;
        }

        100% {
            opacity: 0;
        }
    }

    & {
        animation: messages-disappear 1s ease-in-out;
    }
}

.messages-appear {
    @keyframes messages-appear {
        0% {
            opacity: 0;
        }

        50% {
            opacity: 0;
        }

        100% {
            opacity: 1;
        }
    }

    & {
        animation: messages-appear 1s ease-in-out;
    }
}

.messageInput {
    width: calc(100% - 22px);
}

.tips {
    margin-top: 0px;
    height: 40px;
    resize: none;
}

.message {
    padding: 5px;
    border-radius: 4px;
    margin: 5px 0;
}

.server-message {
    background-color: #e2e3e5;
    color: #333;
}

.client-message {
    background-color: #cce5ff;
    color: #004085;
    text-align: right;
}

quiz-main {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
}

.selected {
    background-color: #f0f0f0;
}
</style>