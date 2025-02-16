<script setup lang="ts">
import { ref, watch } from 'vue';
import { createAnimationsController } from '../utils/AnimationsController';
import { sleep } from '../utils/sleep';
import { $appearDuration, State, useTransitionStore } from '../stores/transition';

const model = defineModel<string | number>({required: false});
const {placeholder, type, disappear, area, onBlur} = defineProps({
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
    }
});

let className = ref(disappear ? 'disappear-input' : 'up-input');
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
        const number = Number(value);
        model.value = number;
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
        () => className.value = isFocused.value ? (value ? 'down-disappear' : 'down-appear') : (value ? 'up-disappear' : 'up-appear'),
        () => sleep($appearDuration),
        () => className.value = value ? 'disappear-input' : (isFocused.value ? 'down-input' : 'up-input'),
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
watch(() => transitionStore.state, onTransitionChange, {immediate: true});

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
            :class="className"
            :disabled="disappear"
            @input="handleInput"
            @focus="handleFocus"
            @blur="handleFocusOut"
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
    align-items: center;
    text-align: center;
    vertical-align: middle;
}

textarea {
    justify-content: start;
    align-items: start;
    text-align: start;
    vertical-align: top;
    overflow: auto;
    scrollbar-width: none;
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
