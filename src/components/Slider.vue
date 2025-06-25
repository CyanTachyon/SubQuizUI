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

let className = ref(disappear ? 'disappear-input' : 'appeared-input');
let controller = createAnimationsController();

function onDisappearChange(value: boolean, oldValue: boolean)
{
    if (value === oldValue) return;
    controller.push([
        () => {
            className.value = value ? 'disappear' : 'appear';
        },
        () => sleep($appearDuration),
        () => {
            className.value = value ? 'disappeared-input' : 'appeared-input';
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
const slider = ref<HTMLElement | null>(null);
const sliderTrack = ref<HTMLElement | null>(null);
onMounted(() => {
    if (slider.value && window.getComputedStyle(slider.value).getPropertyValue('--transition').trim() !== 'static')
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
    <quiz-slider :class="className" ref="slider">
        <quiz-slider-container @mousedown="startDrag" @touchstart.passive="startDrag">
            <quiz-slider-track ref="sliderTrack">
                <quiz-slider-progress :style="{ '--w': progressPercentage + '%' }"/>
                <quiz-slider-thumb :style="{ left: progressPercentage + '%' }"/>
                <quiz-slider-step-markers v-if="showStep">
                    <quiz-slider-step-marker v-for="(marker, index) in markers" :key="index" :style="{ left: marker.position + '%' }"/>
                </quiz-slider-step-markers>
            </quiz-slider-track>

        </quiz-slider-container>
    </quiz-slider>
</template>

<style scoped lang="scss">
quiz-slider {
    display: block;
    border-radius: 2rem;
    overflow: hidden;
    margin: 10px;

    border: solid 2px var(--glass-button-hover-background);
}

quiz-slider-container {
    position: relative;
    display: block;
    width: 100%;
    height: 16px;
    padding: 0 8px;
    touch-action: none;
    user-select: none;
    -webkit-user-drag: none;

    quiz-slider-track {
        display: block;
        position: relative;
        width: 100%;
        height: 16px;
        border-radius: 4px;
        cursor: pointer;
        touch-action: none;

        quiz-slider-progress {
            position: absolute;
            height: 100%;
            border-radius: 4px;
            margin-left: -8px;
            width: calc(var(--w) + 8px);
        }

        quiz-slider-thumb {
            display: block;
            position: absolute;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            cursor: grab;

            border: solid 2px var(--glass-button-hover-background);
            backdrop-filter: blur(5px);
            background: var(--glass-button-hover-background);
        }
    }

    quiz-slider-step-markers {
        display: block;
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        transform: translateY(-50%);
        height: 4px;
        pointer-events: none;

        quiz-slider-step-marker {
            position: absolute;
            width: 5px;
            height: 5px;
            background: var(--glass-border);
            top: 50%;
            border-radius: 50%;
            transform: translateX(-50%) translateY(-50%);
        }
    }
}

.disappeared-input {
    opacity: 0;
}

.disappear {
    @include appear('disappear', up, false);
}

.appear {
    @include appear('appear', up, true);
}
</style>