<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import { createAnimationsController } from '../utils/AnimationsController';
import { $appearDuration, isStatic, State, useTransitionStore } from '../stores/transition';
import { sleep } from '../utils/sleep';
import { getThemes } from '../stores/theme';

interface Option
{
    label: string;
    value: any;
}

const model = defineModel<any>({ required: false });
const { options, placeholder, disappear, disabled, direction, multiple, displayText } = defineProps({
    options: {
        type: Array as () => Option[],
        default: () => []
    },
    placeholder: {
        type: String,
        default: '请选择...'
    },
    disappear: {
        type: Boolean,
        default: false
    },
    disabled: {
        type: Boolean,
        default: false
    },
    direction: {
        type: String as () => 'up' | 'down',
        default: 'down',
        validator: (value: string) => ['up', 'down'].includes(value)
    },
    width: {
        type: String,
        default: '200px'
    },
    multiple: {
        type: Boolean,
        default: false
    },
    displayText: {
        type: String,
        default: undefined
    }
});

const isOpen = ref(false);
const selectContainer = ref<HTMLElement | null>(null);
let className = ref(disappear ? 'disappeared-select' : 'appeared-select');
let controller = createAnimationsController();

const selectedLabel = computed(() =>
{
    // 如果指定了自定义显示文本，优先使用
    if (displayText !== undefined)
    {
        return displayText;
    }
    
    if (multiple)
    {
        const selectedValues = Array.isArray(model.value) ? model.value : [];
        if (selectedValues.length === 0) return placeholder;
        
        const selectedOptions = options.filter(option => selectedValues.includes(option.value));
        return selectedOptions.map(opt => opt.label).join(', ');
    }
    else
    {
        const selected = options.find(option => option.value === model.value);
        return selected ? selected.label : placeholder;
    }
});

function toggleDropdown()
{
    if (disabled || disappear) return;
    isOpen.value = !isOpen.value;
}

function selectOption(option: Option)
{
    if (multiple)
    {
        const currentValue = Array.isArray(model.value) ? model.value : [];
        const index = currentValue.indexOf(option.value);
        
        if (index > -1)
        {
            // Remove from selection
            model.value = currentValue.filter((v: any) => v !== option.value);
        }
        else
        {
            // Add to selection
            model.value = [...currentValue, option.value];
        }
        // Keep dropdown open in multiple mode
    }
    else
    {
        model.value = option.value;
        isOpen.value = false;
    }
}

function handleClickOutside(event: Event)
{
    if (selectContainer.value && !selectContainer.value.contains(event.target as Node))
    {
        isOpen.value = false;
    }
}

function isOptionSelected(option: Option)
{
    if (multiple)
    {
        const selectedValues = Array.isArray(model.value) ? model.value : [];
        return selectedValues.includes(option.value);
    }
    else
    {
        return model.value === option.value;
    }
}

function onDisappearChange(value: boolean, oldValue: boolean)
{
    if (value === oldValue) return;
    controller.push([
        () => className.value = value ? 'disappear' : 'appear',
        () => sleep($appearDuration),
        () => className.value = value ? 'disappeared-select' : 'appeared-select',
    ]);
}

function onTransitionChange(value: State, oldValue: State | undefined)
{
    if (value === oldValue || value === State.NONE) return;
    if (value === State.ENTER) onDisappearChange(disappear, true);
    else onDisappearChange(true, disappear);
}

let transitionStore = useTransitionStore();
watch(() => disappear, onDisappearChange);

onMounted(() =>
{
    document.addEventListener('click', handleClickOutside);

    if (!isStatic(selectContainer.value))
    {
        watch(() => transitionStore.state, onTransitionChange, { immediate: true });
    }
});

onUnmounted(() =>
{
    document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
    <div class="select-container" :class="[className, getThemes().useBlur ? 'use-blur' : '', disabled ? 'disabled' : '', `direction-${direction}`]" ref="selectContainer">
        <div class="select-trigger" @click="toggleDropdown" :class="{ 'open': isOpen }">
            <span class="select-text" :class="{ 'placeholder': displayText === undefined && (multiple ? (!model || model.length === 0) : (model === undefined || model === null)) }">
                {{ selectedLabel }}
            </span>
            <div class="select-arrow" :class="{ 'rotated': isOpen !== (direction === 'up') }">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path d="M1 1L6 6L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </div>
        </div>

        <Transition name="dropdown">
            <div v-if="isOpen" class="select-dropdown">
                <div v-for="option in options" :key="option.value" class="select-option" :class="{ 'selected': !multiple && isOptionSelected(option) }" @click="selectOption(option)">
                    <span v-if="multiple" class="checkbox" :class="{ 'checked': isOptionSelected(option) }">
                        <svg v-if="isOptionSelected(option)" width="12" height="10" viewBox="0 0 12 10" fill="none">
                            <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </span>
                    {{ option.label }}
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped lang="scss">
.select-container {
    position: relative;
    display: inline-block;
    margin: 10px;

    &.use-blur {

        .select-trigger,
        .select-dropdown {
            backdrop-filter: blur(5px);
        }
    }

    &.disabled {
        opacity: 0.6;
        cursor: not-allowed;

        .select-trigger {
            cursor: not-allowed;
        }
    }
}

.select-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    height: 100%;
    width: 100%;
    border: solid 2px var(--button-border);
    border-radius: 10px;
    background: var(--button-background);
    color: var(--color);
    cursor: pointer;
    transition: background, box-shadow, transform 0.3s ease;
    font-size: 100%;
    overflow: hidden;

    &:hover:not(.disabled) {
        background: var(--button-hover-background);
        border: solid 2px var(--button-hover-border);
        transform: translateY(-2px);
    }

    &.open {
        border-color: var(--button-highlight-border);
        background: var(--button-hover-background);
    }
}

.select-text {
    flex: 1;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.placeholder {
        opacity: 0.7;
    }
}

.select-arrow {
    margin-left: 8px;
    transition: transform 0.3s ease;
    display: flex;
    align-items: center;

    &.rotated {
        transform: rotate(180deg);
    }

    svg {
        color: var(--color);
    }
}

.select-dropdown {
    position: absolute;
    left: 0;
    right: 0;
    width: max-content;
    min-width: 100%;
    z-index: 1000;
    background: var(--background);
    border: solid 2px var(--border);
    border-radius: 10px;
    margin-top: 4px;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);

    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }
}

.direction-down .select-dropdown {
    top: 100%;
    margin-top: 4px;
    margin-bottom: 0;
}

.direction-up .select-dropdown {
    bottom: 100%;
    top: auto;
    margin-top: 0;
    margin-bottom: 4px;
}

.select-option {
    padding: 0.5rem 1rem;
    cursor: pointer;
    color: var(--color);
    transition: background 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;

    &:hover {
        background: var(--button-background);
    }

    &.selected {
        background: var(--button-highlight-border);
        color: white;
    }

    &:first-child {
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
    }

    &:last-child {
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
    }
}

.checkbox {
    width: 16px;
    height: 16px;
    border: 2px solid var(--button-border);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s ease;

    &.checked {
        background: var(--button-highlight-border);
        border-color: var(--button-highlight-border);

        svg {
            color: white;
        }
    }
}

.dropdown-enter-active,
.dropdown-leave-active {
    transition: all 0.3s ease;
}

.direction-down .dropdown-enter-active,
.direction-down .dropdown-leave-active {
    transform-origin: top;
}

.direction-down .dropdown-enter-from,
.direction-down .dropdown-leave-to {
    opacity: 0;
    transform: scaleY(0);
}

.direction-down .dropdown-enter-to,
.direction-down .dropdown-leave-from {
    opacity: 1;
    transform: scaleY(1);
}

.direction-up .dropdown-enter-active,
.direction-up .dropdown-leave-active {
    transform-origin: bottom;
}

.direction-up .dropdown-enter-from,
.direction-up .dropdown-leave-to {
    opacity: 0;
    transform: scaleY(0);
}

.direction-up .dropdown-enter-to,
.direction-up .dropdown-leave-from {
    opacity: 1;
    transform: scaleY(1);
}

.disappeared-select {
    opacity: 0;
}

.disappear {
    @include appear('disappear', up, false);
}

.appear {
    @include appear('appear', up, true);
}
</style>