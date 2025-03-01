<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref, watch} from "vue";
import debounce from "../utils/debounce.ts";
import {createAnimationsController} from "../utils/AnimationsController.ts";
import {sleep} from "../utils/sleep.ts";
import {$appearDuration, State, useTransitionStore} from "../stores/transition.ts";

const count = ref(6)
const size = ref(200)
const loaderEl = ref<HTMLDivElement | null>(null)
const loaderClass = ref('loader')
let observer: ResizeObserver;

const updateSize = (entries: ResizeObserverEntry[]) =>
{
    const {width, height} = entries[0].contentRect
    if (!height) return;
    const count0 = Math.floor(width * 3 / height)
    const size0 = height * 5 / 6;
    if (size0 !== size.value) size.value = size0
    if (count0 !== count.value)
    {
        count.value = count0;
        loaderClass.value = 'loader-reload'
        setTimeout(() => loaderClass.value = 'loader', 10)
    }
}

onMounted(() =>
{
    if (loaderEl.value?.parentElement)
    {
        observer = new ResizeObserver(debounce(updateSize, 300, true));
        observer.observe(loaderEl.value)
    }
})

onBeforeUnmount(() =>
{
    observer?.disconnect()
})


////////////////////////

let controller = createAnimationsController();
let className = ref('');

function onDisappearChange(value: boolean, oldValue: boolean)
{
    if (value === oldValue) return;
    controller.push([
        () => className.value = value ? 'disappear' : 'appear',
        () => sleep($appearDuration),
        () => className.value = value ? 'disappeared' : '',
    ])
}

function onTransitionChange(value: State, oldValue: State | undefined)
{
    if (value === oldValue || value === State.NONE) return;
    if (value === State.ENTER) onDisappearChange(false, true);
    else onDisappearChange(true, false);
}

let transitionStore = useTransitionStore();
onMounted(() => {
    if (loaderEl.value && window.getComputedStyle(loaderEl.value).getPropertyValue('--transition') !== 'static')
    {
        watch(() => transitionStore.state, onTransitionChange, {immediate: true});
    }
})

</script>

<template>
    <div ref="loaderEl" :class="[loaderClass, className]">
        <div v-for="i in count" :style="{ '--x': i - 1, '--size': size + 'px' }"></div>
    </div>
</template>

<style scoped lang="scss">

.loader {
    display: flex;
    flex-direction: row;
}

.loader div {
    --x: 0;
    --size: 200;

    position: relative;
    width: calc(var(--size) * 0.2);
    min-width: calc(var(--size) * 0.2);
    max-width: calc(var(--size) * 0.2);
    height: var(--size);
    min-height: var(--size);
    max-height: var(--size);
    margin: calc(var(--size) * 0.1);
    overflow: hidden;
    border-radius: calc(var(--size) * 0.25);
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.05), var(--bgcolor));
    border: calc(var(--size) / 100) solid var(--bgcolor);
    box-shadow: calc(var(--size) * 0.075) calc(var(--size) * 0.075) calc(var(--size) * 0.1) var(--up-shadow),
    calc(var(--size) * -0.075) calc(var(--size) * -0.075) calc(var(--size) * 0.1) var(--down-shadow),
    inset calc(var(--size) / -40) calc(var(--size) / -40) calc(var(--size) / 40) var(--down-shadow),
    inset calc(var(--size) / 40) calc(var(--size) / 40) calc(var(--size) / 40) var(--up-shadow);
    transition: box-shadow 0.5s ease, border 0.5s ease, background 0.5s ease;
}

.loader div::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: calc(var(--size) * 0.18);
    height: calc(var(--size) * 0.18);
    z-index: 100;
    border-radius: 50%;
    box-shadow: inset calc(var(--size) / -40) calc(var(--size) / -40) calc(var(--size) / 40) var(--up-shadow),
    inset calc(var(--size) / 40) calc(var(--size) / 40) calc(var(--size) / 40) var(--down-shadow),
    0 calc(var(--size) * 2.1) 0 calc(var(--size) * 2) #2196f3,;

    transition: box-shadow 0.5s ease, border 0.5s ease;
    animation: animate 2.5s ease-in-out infinite;
    animation-delay: calc(var(--x) * -0.3s);
    transform: translateY(calc(var(--size) * 0.8));
}

@keyframes animate {
    0% {
        transform: translateY(calc(var(--size) * 0.8));
        filter: hue-rotate(0deg);
    }

    50% {
        transform: translateY(0px);
        filter: hue-rotate(180deg);
    }

    100% {
        transform: translateY(calc(var(--size) * 0.8));
        filter: hue-rotate(360deg);
    }
}

@keyframes disappear {
    0% {
        opacity: 1;
    }
    50% {
        opacity: 1;
    }
    100% {
        opacity: 0;
    }
}

@keyframes appear {
    0% {
        opacity: 0;
    }
    50% {
        opacity: 1;
    }
    100% {
        opacity: 1;
    }
}

.disappear {
    animation: disappear $appear-duration ease-out forwards;
}

.appear {
    animation: appear $appear-duration ease-in forwards;
}

.disappeared {
    display: none;
}
</style>