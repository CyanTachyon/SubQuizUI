<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import {sleep} from "../utils/sleep.ts";
import {$appearDuration, State, useTransitionStore} from "../stores/transition.ts";
import {createAnimationsController} from "../utils/AnimationsController.ts";

const className = ref('');
const controller = createAnimationsController();

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
const text = ref<HTMLElement | null>(null);
onMounted(() => {
    if (text.value && window.getComputedStyle(text.value).getPropertyValue('--transition') !== 'static')
    {
        watch(() => transitionStore.state, onTransitionChange, {immediate: true});
    }
})

</script>

<template>
    <quiz-text :class="className" ref="text">
        <slot/>
    </quiz-text>
</template>

<style scoped lang="scss">
@keyframes disappear {
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

@keyframes appear {
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

quiz-text {
    display: block;
}

.disappear {
    animation: disappear $appear-duration ease-in-out forwards;
}

.appear {
    animation: appear $appear-duration ease-in-out forwards;
}

.disappeared {
    display: none;
}
</style>