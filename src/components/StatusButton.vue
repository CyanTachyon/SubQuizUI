<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import {createAnimationsController} from "../utils/AnimationsController.ts";
import {$animateDuration, $appearDuration, State, useTransitionStore} from "../stores/transition.ts";
import {sleep} from "../utils/sleep.ts";

const {onClick, down, disappear, disabled} = defineProps({
    onClick: {
        type: Function,
        default()
        {
        }
    },
    down: {
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
let className = ref(disappear ? 'disappear-button' : (down ? 'down-button' : 'up-button'));
let controller = createAnimationsController();

watch(() => down, (value, oldValue) =>
{
    if (value === oldValue || disappear) return;
    controller.push([
        () => className.value = value ? 'down' : 'up',
        () => sleep($animateDuration),
        () => className.value = value ? 'down-button' : 'up-button'
    ])
});

function onDisappearChange(value: boolean, oldValue: boolean)
{
    if (value === oldValue) return;
    controller.push([
        () => className.value = down ? (value ? 'down-disappear' : 'down-appear') : (value ? 'up-disappear' : 'up-appear'),
        () => sleep($appearDuration),
        () => className.value = value ? 'disappear-button' : (down ? 'down-button' : 'up-button'),
    ])
}

function onTransitionChange(value: State, oldValue: State | undefined)
{
    if (value === oldValue || value === State.NONE) return;
    if (value === State.ENTER) onDisappearChange(disappear, true);
    else onDisappearChange(true, disappear);
}

let transitionStore = useTransitionStore();
watch(() => disappear, onDisappearChange);
const statusButton = ref<HTMLElement | null>(null);
onMounted(() => {
    if (statusButton.value && window.getComputedStyle(statusButton.value).getPropertyValue('--transition') !== 'static')
    {
        watch(() => transitionStore.state, onTransitionChange, {immediate: true});
    }
})

function click()
{
    if (disappear || disabled) return;
    controller.push([() => (onClick as unknown as () => void)()], false)
}

</script>

<template>
    <quiz-button @click="click" :class="className" ref="statusButton" :disabled="disabled">
        <slot/>
    </quiz-button>
</template>

<style scoped lang="scss">

quiz-button {
    display: block;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    margin: 10px;
    font-size: 100%;
    background-color: transparent;
    cursor: pointer;
    display: flex;
    justify-content: start;
    align-items: center;
    text-align: center;
    // vertical-align: middle;
    max-width: fit-content;
}

.up-button {
    @include neumorphism-up-shadow;
}

.down-button {
    @include neumorphism-down-shadow;
}

.disappear-button {
    color: transparent;
    box-shadow: none;
}

.down {
    @include neumorphism-up-to-down;
}

.up {
    @include neumorphism-down-to-up;
}

.up-disappear {
    @include appear('up-disappear', up, false);
}

.down-disappear {
    @include appear('down-disappear', down, false);
}

.up-appear {
    @include appear('up-appear', up, true);
}

.down-appear {
    @include appear('down-appear', down, true);
}

</style>