<script setup lang="ts">
import {onMounted, ref, watch} from 'vue';
import {createAnimationsController} from '../utils/AnimationsController';
import {sleep} from '../utils/sleep';
import {$appearDuration, State, useTransitionStore} from '../stores/transition';

const model = defineModel<string | number>({required: false});
const {placeholder, type, disappear, area, onBlur, align} = defineProps({
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
    onBlur: {
        type: Function,
        default: () => {}
    },
    area: {
        type: Boolean,
        default: false
    },
    align: {
        type: String,
        required: false
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
let isFocused = ref(false);

function handleFocus() 
{
    if (isFocused.value || disappear) return;
    controller.push([
        () => {
            className.value = 'down';
            isFocused.value = true;
        },
        () => sleep(400),
        () => className.value = 'down-input'
    ])
}

function handleFocusOut() 
{
    if (!isFocused.value || disappear) return;
    controller.push([
        () => {
            className.value = 'up';
            isFocused.value = false;
            (onBlur as unknown as () => void)()
        },
        () => sleep(400),
        () => className.value = 'up-input'
    ])
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
            className.value = isFocused.value ? (value ? 'down-disappear' : 'down-appear') : (value ? 'up-disappear' : 'up-appear');
            placeholderClassName.value = value ? 'placeholder-disappear' : 'disappeared-placeholder';
        },
        () => sleep($appearDuration/2),
        () => placeholderClassName.value = value ? 'disappeared-placeholder' : 'placeholder-appear',
        () => sleep($appearDuration/2),
        () => {
            className.value = value ? 'disappear-input' : (isFocused.value ? 'down-input' : 'up-input');
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
    if (input.value && window.getComputedStyle(input.value).getPropertyValue('--transition') !== 'static')
    {
        watch(() => transitionStore.state, onTransitionChange, {immediate: true});
    }
})

const element = area ? 'textarea' : 'input';

</script>

<template>
    <component
            :is="element"
            class="input"
            :value="model"
            :placeholder="placeholder"
            :type="type"
            :inputmode="type === 'number' ? 'numeric' : undefined"
            :class="[className, placeholderClassName, `align-${getAlign()}`]"
            :disabled="disappear"
            @input="handleInput"
            @focus="handleFocus"
            @blur="handleFocusOut"
            ref="input"
        >
        <slot/>
    </component>
</template>

<style scoped lang="scss">

input:focus {
    outline: none;
}

textarea:focus {
    outline: none;
}

.input {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    margin: 10px;
    font-size: 100%;
    background-color: transparent;
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

.up-input {
    @include neumorphism-up;
}

.down-input {
    @include neumorphism-down;
}

.disappear-input {
    color: transparent;
    box-shadow: none;
    border: 2px solid transparent;
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

//// placeholder ////

.disappeared-placeholder::placeholder {
    opacity: 0;
}

.appeared-placeholder::placeholder {
    opacity: 1;
}

.placeholder-disappear::placeholder {
    opacity: 0;
    transition: opacity calc($appear-duration / 2) ease-in-out;
}

.placeholder-appear::placeholder {
    opacity: 1;
    transition: opacity calc($appear-duration / 2) ease-in-out;
}
</style>
