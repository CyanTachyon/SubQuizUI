<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { createAnimationsController } from '../utils/AnimationsController';
import { sleep } from '../utils/sleep';
import { $appearDuration, State, useTransitionStore } from '../stores/transition';

const { onClick, on, disappear, disabled } = defineProps({
    onClick: {
        type: Function,
        default() {
        }
    },
    on: {
        type: Boolean,
        default: false
    },
    disappear: {
        type: Boolean,
        default: false
    },
    disabled: {
        type: Boolean,
        default: false
    }
});

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

const wrapper = ref<HTMLElement | null>(null);
let transitionStore = useTransitionStore();
watch(() => disappear, onDisappearChange);
onMounted(() => {
    if (wrapper.value && window.getComputedStyle(wrapper.value).getPropertyValue('--transition') !== 'static')
    {
        watch(() => transitionStore.state, onTransitionChange, {immediate: true});
    }
})
</script>

<template>
    <quiz-switch @click="onClick()" ref="wrapper" :disabled="disabled" :class="className">
        <quiz-switch-thumb :class="{ on: on }"></quiz-switch-thumb>
    </quiz-switch>
</template>

<style scoped lang="scss">
quiz-switch {
    display: block;
    width: 54px;
    height: 27px;
    background-color: transparent;
    border-radius: 25px;
    display: flex;
    // justify-content: center;
    align-items: center;
    cursor: pointer;
    --size: 60px;
    box-shadow: calc(var(--size) * 0.075) calc(var(--size) * 0.075) calc(var(--size) * 0.1) var(--up-shadow),
    calc(var(--size) * -0.075) calc(var(--size) * -0.075) calc(var(--size) * 0.1) var(--down-shadow),
    inset calc(var(--size) / -40) calc(var(--size) / -40) calc(var(--size) / 40) var(--down-shadow),
    inset calc(var(--size) / 40) calc(var(--size) / 40) calc(var(--size) / 40) var(--up-shadow);
    overflow: hidden;
    border: 2px solid var(--bgcolor);
    
}

quiz-switch-thumb {
    display: block;
    width: 25px;
    height: 25px;
    border-radius: 50%;

    top: 0;
    left: 0;
    --size: 90px;
    box-shadow: inset calc(var(--size) / -40) calc(var(--size) / -40) calc(var(--size) / 40) var(--up-shadow),
    inset calc(var(--size) / 40) calc(var(--size) / 40) calc(var(--size) / 40) var(--down-shadow),
    -37.5px 0 0 25px #2196f388,;
    
    transition: transform 0.3s ease-in-out;
}

.on {
    transform: translateX(25px);
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