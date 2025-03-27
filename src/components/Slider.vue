<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue';
import {createAnimationsController} from '../utils/AnimationsController';
import {sleep} from '../utils/sleep';
import {$appearDuration, State, useTransitionStore} from '../stores/transition';


const value = defineModel<number>({required: true});
const {minValue, maxValue, step, disappear, showStep} = defineProps({
    minValue: {
        type: Number,
        required: true
    },
    maxValue: {
        type: Number,
        required: true
    },
    step: {
        type: Number,
        required: true
    },
    disappear: {
        type: Boolean,
        default: false
    },
    showStep: {
        type: Boolean,
        default: false
    }
})

if (value.value < minValue)
{
    value.value = minValue;
}

if (value.value > maxValue)
{
    value.value = maxValue;
}

let className = ref(disappear ? 'disappear-input' : 'up-input');
let thumbClassName = ref(disappear ? 'disappear-thumb' : 'appear-thumb');
let controller = createAnimationsController();

function onDisappearChange(value: boolean, oldValue: boolean)
{
    if (value === oldValue) return;
    controller.push([
        () => {
            className.value = value ? 'up-disappear' : 'up-appear';
            thumbClassName.value = value ? 'thumb-disappear' : 'thumb-appear';
        },
        () => sleep($appearDuration),
        () => {
            className.value = value ? 'disappear-input' : 'up-input';
            thumbClassName.value = value ? 'disappear-thumb' : 'appear-thumb';
        },
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
const slider = ref<HTMLDivElement | null>(null);
const sliderTrack = ref<HTMLDivElement | null>(null);
onMounted(() => {
    if (slider.value && window.getComputedStyle(slider.value).getPropertyValue('--transition') !== 'static')
    {
        watch(() => transitionStore.state, onTransitionChange, {immediate: true});
    }
})

const progressPercentage = ref(
    ((value.value - minValue) / (maxValue - minValue)) * 100
);

const markers = computed(() =>
{
    const count = Math.floor((maxValue - minValue) / step);
    return Array.from({length: count + 1}, (_, i) => ({
        position: (i * step) / (maxValue - minValue) * 100
    }));
});

const isDragging = ref(false);
let containerRect: DOMRect;

function getValueFromPosition(clientX: number)
{
    const x = clientX - containerRect.left;
    const percentage = Math.min(Math.max(x / containerRect.width, 0), 1);
    const rawValue = minValue + percentage * (maxValue - minValue);
    return Math.round(rawValue / step) * step;
}

function updatePosition(clientX: number)
{
    const newValue = getValueFromPosition(clientX);
    if (newValue !== value.value)
    {
        value.value = newValue;
        progressPercentage.value = ((newValue - minValue) / (maxValue - minValue)) * 100;
    }
}

function startDrag(e: MouseEvent | TouchEvent)
{
    const container = sliderTrack.value!;
    containerRect = container.getBoundingClientRect();
    isDragging.value = true;

    const clientX = e instanceof TouchEvent ? e.touches[0].clientX : e.clientX;
    updatePosition(clientX);

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', onDrag, {passive: false});
    document.addEventListener('touchend', stopDrag);
}

function onDrag(e: MouseEvent | TouchEvent)
{
    if (!isDragging.value) return;

    if (e.cancelable) e.preventDefault();

    const clientX = e instanceof TouchEvent ? e.touches[0].clientX : e.clientX;
    updatePosition(clientX);
}

function stopDrag()
{
    isDragging.value = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', stopDrag);
}

watch(value, (newVal, oldValue) =>
{
    if (newVal === oldValue) return;
    if (newVal < minValue) value.value = minValue;
    else if (newVal > maxValue) value.value = maxValue;
    progressPercentage.value = ((newVal - minValue) / (maxValue - minValue)) * 100;
});
</script>

<template>
    <div :class="['slider-wrapper', className]" ref="slider">
        <div
                class="slider-container"
                @mousedown="startDrag"
                @touchstart.passive="startDrag"
        >
            <div class="slider-track" ref="sliderTrack">
                <div class="slider-progress" :style="{ '--w': progressPercentage + '%' }"></div>

                <div
                        class="slider-thumb"
                        :class="thumbClassName"
                        :style="{ left: progressPercentage + '%' }"
                ></div>
                <div v-if="showStep" class="step-markers">
                    <div
                            v-for="(marker, index) in markers"
                            :key="index"
                            class="step-marker"
                            :style="{ left: marker.position + '%' }"
                    ></div>
                </div>
            </div>

        </div>
    </div>
</template>

<style scoped lang="scss">
.slider-wrapper {
    border-radius: 2rem;
    overflow: hidden;
    margin: 10px;
}

@mixin thumb-shadow {
    box-shadow: 1px 1px 1px var(--outer-up-shadow),
        -1px -1px 1px var(--outer-down-shadow),
        inset 1px 1px 1px var(--inner-up-shadow),
        inset -1px -1px 1px var(--inner-down-shadow);
    border: 3px solid var(--border-color);
}

.slider-container {
    position: relative;
    width: 100%;
    height: 16px;
    padding: 0 8px;
    touch-action: none;
    user-select: none;
    -webkit-user-drag: none;

    .slider-track {
        position: relative;
        width: 100%;
        height: 16px;
        border-radius: 4px;
        cursor: pointer;
        touch-action: none;

        .slider-progress {
            position: absolute;
            height: 100%;
            border-radius: 4px;
            margin-left: -8px;
            width: calc(var(--w) + 8px);
        }

        .slider-thumb {
            position: absolute;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            cursor: grab;
            transition: box-shadow 0.5s ease, border 0.5s ease;
        }
    }

    .step-markers {
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        transform: translateY(-50%);
        height: 4px;
        pointer-events: none;

        .step-marker {
            position: absolute;
            width: 5px;
            height: 5px;
            background: var(--border-color);
            top: 50%;
            border-radius: 50%;
            transform: translateX(-50%) translateY(-50%);
        }
    }
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

.thumb-appear {
    @keyframes thumb-appear {
        0% {
            box-shadow: none;
            border: 3px solid transparent;
        }
        50% {
            @include thumb-shadow;
        }
        100% {
            @include thumb-shadow;
        }
    }
    & {
        animation: thumb-appear $appear-duration ease-in forwards;
    }
}

.thumb-disappear {
    @keyframes thumb-disappear {
        0% {
            @include thumb-shadow;
        }
        50% {
            @include thumb-shadow;
        }
        100% {
            box-shadow: none;
            border: 3px solid transparent;
        }
    }
    & {
        animation: thumb-disappear $appear-duration ease-out forwards;
    }
}

.disappear-thumb {
    box-shadow: none;
    border: 3px solid transparent;
}

.appear-thumb {
    @include thumb-shadow;
}
</style>