<script setup lang="ts">
import {onMounted, ref, watch, getCurrentInstance} from 'vue';
import {createAnimationsController} from '../utils/AnimationsController';
import {sleep} from '../utils/sleep';
import {$appearDuration, isStatic, State, useTransitionStore} from '../stores/transition';
import { getThemes } from '../stores/theme';

const model = defineModel<string | number>({required: false});
const { placeholder, type, disappear, area, align, readonly, onFocus, onFocusOut } = defineProps({
    placeholder: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        default: 'text'
    },
    disappear: {
        type: Boolean,
        default: false
    },
    area: {
        type: Boolean,
        default: false
    },
    align: {
        type: String,
        required: false
    },
    readonly: {
        type: Boolean,
    },    
    onFocus: {
        type: Function,
        default: () => {}
    },
    onFocusOut: {
        type: Function,
        default: () => {}
    }
});

function getAlign()
{
    if (!align) return area ? 'start' : 'center';
    if (align === 'left') return 'start';
    if (align === 'right') return 'end';
    return 'center';
}

let className = ref(disappear ? 'disappear-input' : 'up-input');
let placeholderClassName = ref(disappear ? 'placeholder-disappear' : 'placeholder-appear');
let controller = createAnimationsController();

// 获取当前组件实例
const currentInstance = getCurrentInstance()

function handleFocus() 
{
    if (disappear || readonly) return;
    onFocus(currentInstance.exposed);
}

function handleFocusOut() 
{
    if (disappear) return;
    onFocusOut(currentInstance.exposed);
}

function handleInput(event: Event) 
{
    if (disappear) return;
    const value = (event.target as HTMLInputElement).value;
    if (type === 'number')
    {
        model.value = Number(value);
    }
    else
    {
        model.value = value;
    }
}


function onDisappearChange(value: boolean, oldValue: boolean)
{
    if (value === oldValue) return;
    controller.push([
        () => {
            className.value = value ? 'disappear' : 'appear'
            placeholderClassName.value = value ? 'placeholder-disappear' : 'disappeared-placeholder';
        },
        () => sleep($appearDuration/2),
        () => placeholderClassName.value = value ? 'disappeared-placeholder' : 'placeholder-appear',
        () => sleep($appearDuration/2),
        () => {
            className.value = value ? 'disappeared-input' : 'appeared-input';
            placeholderClassName.value = value ? 'disappeared-placeholder' : 'appeared-placeholder';
        }
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
const input = ref<HTMLInputElement | null>(null);
onMounted(() => {
    if (!isStatic(input.value))
    {
        watch(() => transitionStore.state, onTransitionChange, {immediate: true});
    }
})

const element = area ? 'textarea' : 'input';

defineExpose({
    element: input,
    value: model,
})

</script>

<template>
    <component
            :is="element"
            class="input"
            :value="model"
            :placeholder="placeholder"
            :type="type"
            :inputmode="type === 'number' ? 'numeric' : undefined"
            :class="[className, placeholderClassName, `align-${getAlign()}`, getThemes().useBlur ? 'use-blur' : '']"
            :disabled="disappear"
            @input="handleInput"
            @focus="handleFocus"
            @blur="handleFocusOut"
            ref="input"
            :readonly="readonly"
        >
        <slot/>
    </component>
</template>

<style scoped lang="scss">
.input.use-blur {
    backdrop-filter: blur(5px);
}
.input {
    border: none;
    border-radius: 10px;
    background: var(--button-background);
    color: var(--color);
    transition: background 0.3s ease;

    &:focus {
        outline: none;
        background: var(--button-hover-background);
        box-shadow: 0 0 8px -5px var(--color);
    }

    &::placeholder {
        color: var(--color);
    }

    padding: 0.5rem 1rem;
    margin: 10px;
    font-size: 100%;
    display: flex;
    
    &::-webkit-inner-spin-button {
        -webkit-appearance: none !important;
    }
    &::-webkit-outer-spin-button {
        -webkit-appearance: none !important;
    }
    &:hover::-webkit-inner-spin-button,
    &:hover::-webkit-outer-spin-button {
        -webkit-appearance: none !important;
    }
    -webkit-appearance: none;
    -moz-appearance: textfield;
    appearance: none;
    
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    
    @-moz-document url-prefix() {
        border-right: 1px solid transparent;
    }
}

input {
    justify-content: start;
    vertical-align: middle;
}

textarea {
    justify-content: start;
    overflow: auto;
    scrollbar-width: none;
    position: relative;

    &::-webkit-scrollbar {
        display: none;
    }
}

.align-start {
    align-items: start;
    text-align: start;
    vertical-align: top;
}

.align-end {
    align-items: end;
    text-align: end;
}

.align-center {   
    align-items: center;
    text-align: center;
}

.disappeared-input {
    opacity: 0;
}

.appear {
    @include appear('up-appear', up, true);
}

//// placeholder ////

.disappeared-placeholder::placeholder {
    opacity: 0;
}

.appeared-placeholder::placeholder {
    opacity: 0.5;
}

.placeholder-disappear::placeholder {
    opacity: 0;
    transition: opacity calc($appear-duration / 2) ease-in-out;
}

.placeholder-appear::placeholder {
    opacity: 0.5;
    transition: opacity calc($appear-duration / 2) ease-in-out;
}
</style>
