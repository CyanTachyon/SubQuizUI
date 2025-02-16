<script setup lang="ts">
import {connectUrl, Target} from "../networks/utils/sendRequest.ts";
import {getToken} from "../utils/utils.ts";
import {useRouter} from "vue-router";
import {onBeforeUnmount, onMounted, ref} from "vue";
import {AnsiUp} from "ansi_up/ansi_up";
import Sidebar from "../templates/sidebar/Sidebar.vue";

document.title = '控制台 - SubQuiz';

const router = useRouter();
const ansi_up = new AnsiUp();
const messageInput = ref<HTMLInputElement | null>(null);
const container = ref<HTMLLabelElement | null>(null);
const messages = ref<HTMLDivElement | null>(null);
const url = connectUrl(Target.BACKEND, '/terminal/api').replace('https://', 'wss://').replace('http://', 'ws://');
let timer: number | null = null;

let tabs = ref([]);
let select = undefined;

function setLastWord(word: string)
{
    let message = messageInput.value.value
    let index = message.lastIndexOf(' ')
    if (index === -1)
    {
        messageInput.value.value = word
        return
    }
    messageInput.value.value = message.substring(0, index) + ' ' + word
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
        messageInput.value.value = '';
        return;
    }
    data.data.split('\n').forEach((line: string) =>
    {
        const messageDiv = document.createElement('div');
        messageDiv.innerHTML = ansi_up.ansi_to_html(line);
        messages.value.appendChild(messageDiv);
    });
    messages.value.scrollTop = messages.value.scrollHeight;
}

let history = [];
let historyIndex = history.length;
let socket: WebSocket | null = null;

function submit(event: Event)
{
    event.preventDefault();
    const message = messageInput.value.value;
    messageInput.value.value = '';
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
    socket_.addEventListener('message', socketListener)
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
            messageInput.value.value = history[historyIndex];
        }
        else if (historyIndex === 0)
        {
            historyIndex--;
            messageInput.value.value = '';
        }
        return;
    }
    if (event.key === 'ArrowDown')
    {
        if (historyIndex < history.length - 1)
        {
            historyIndex++;
            messageInput.value.value = history[historyIndex];
        }
        else if (historyIndex === history.length - 1)
        {
            historyIndex++;
            messageInput.value.value = '';
        }
        return;
    }
}

function tabListener(event: KeyboardEvent)
{
    const message = messageInput.value.value;
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

onMounted(() =>
{
    socket = openSocket();
    messageInput.value.addEventListener('keydown', historyListener);
    messageInput.value.addEventListener('keydown', tabListener);
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

</script>

<template>
    <Sidebar>
        <div class="main">
            <div id="messages" ref="messages"/>
            <form @submit="submit">
                <label for="messageInput"/>
                <input type="text" id="messageInput" name="messageInput" ref="messageInput" placeholder="输入命令..."/>
            </form>
            <div id="container" ref="container">
                <template v-if="tabs.length === 0"> empty </template>
                <template v-else v-for="(tab, index) in tabs" :key="index" :class="{selected: index === select}">
                    {{tab + (index === tabs.length - 1 ? '' : ' ')}}
                </template>
            </div>
        </div>
    </Sidebar>
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

#container {
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 20px;
    width: 100%;
    max-width: 100%;
    height: fit-content;
    display: flex;
    margin-right: 5px;
    background: transparent;
    color: #333;
    font-weight: bold;
    font-size: 15px;
    font-family: monaco, "Courier New", Courier, monospace;
}

#messages {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 10px;
    overflow-y: scroll;
    margin-bottom: 10px;
    width: 100%;
    height: calc(100vh - 250px);
    background: black;
    color: white;
}

#messageInput {
    width: calc(100% - 22px);
    height: 35px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin-right: 5px;
    background: black;
    color: white;
    font-size: 17px;
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

pre {
    margin: 0;
    font-family: monaco, "Courier New", Courier, monospace;
    line-height: 1.3;
    background: black;
    color: white;
}

.main {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
}
#messages {
    height: calc(100% - 100px);
    overflow-y: auto;
    flex-grow: 1;
}
.selected {
    background-color: #f0f0f0;
}
</style>