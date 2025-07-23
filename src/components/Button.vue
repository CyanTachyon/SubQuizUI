<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import {createAnimationsController} from "../utils/AnimationsController.ts";
import {$appearDuration, State, useTransitionStore} from "../stores/transition.ts";
import {sleep} from "../utils/sleep.ts";
import { getThemes } from "../stores/theme";

const {onClick, disappear, disabled} = defineProps({
    onClick: {
        type: Function,
        default()
        {
        }
    },
    disappear: {
        type: Boolean,
        default: false
    },
    down: {
        type: Boolean,
        default: false
    },
    disabled: {
        type: Boolean,
        default: false
    },
});
let className = ref(disappear ? 'disappeared-button' : 'appeared-button');
let controller = createAnimationsController();

function onDisappearChange(value: boolean, oldValue: boolean)
{
    if (value === oldValue) return;
    controller.push([
        () => className.value = value ? 'disappear' : 'appear',
        () => sleep($appearDuration),
        () => className.value = value ? 'disappeared-button' : 'appeared-button',
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
    if (statusButton.value && window.getComputedStyle(statusButton.value).getPropertyValue('--transition').trim() !== 'static')
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
    <quiz-button
        @click="click"
        :class="[className, getThemes().useBlur ? 'blur-button' : '', down ? 'down' : '', disabled ? '' : 'enabled']"
        ref="statusButton" 
        :disabled="disabled">
        <slot/>
    </quiz-button>
</template>

<style scoped lang="scss">

quiz-button {
    display: block;
    padding: 0.5rem 1rem;
    border: solid 2px var(--glass-button-background);
    border-radius: 10px;
    margin: 10px;
    font-size: 100%;
    background: var(--glass-button-background);
    color: var(--color);
    cursor: not-allowed;
    justify-content: start;
    align-items: center;
    text-align: center;
    max-width: fit-content;
    transition: background,box-shadow,transform 0.3s ease;
}

quiz-button.enabled {
    cursor: pointer;
    &:hover {
        background: var(--glass-button-hover-background);
        transform: translateY(-2px);
    }

    &:active {
        transform: translateY(0);
    }
}

.down {
    border: solid 2px var(--glass-button-highlight-border);
}

.blur-button {
    backdrop-filter: blur(5px);
}

.disappeared-button {
    opacity: 0;
}

.disappear {
    @include appear('disappear', up, false);
}

.appear {
    @include appear('appear', up, true);
}

</style>