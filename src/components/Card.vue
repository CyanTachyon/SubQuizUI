<script setup lang="ts">
import {createAnimationsController} from "../utils/AnimationsController.ts";
import {onMounted, ref, watch} from "vue";
import {$appearDuration, State, useTransitionStore} from "../stores/transition.ts";
import {sleep} from "../utils/sleep.ts";
import { getThemes } from "../stores/theme";

const {disappear, scroll, maxTilt} = defineProps({
    disappear: {
        type: Boolean,
        default: false
    },
    scroll: {
        type: Boolean,
        default: false
    },
    maxTilt : {
        type: Number,
        default: 0
    }
});

let controller = createAnimationsController();
let className = ref(disappear ? 'disappeared-card' : 'appeared-card');

function onDisappearChange(value: boolean, oldValue: boolean)
{
    if (value === oldValue) return;
    controller.push([
        () => className.value = value ? 'disappear' : 'appear',
        () => sleep($appearDuration),
        () => className.value = value ? 'disappeared-card' : 'appeared-card',
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
const card = ref<HTMLElement | null>(null);
onMounted(() => {
    if (card.value && window.getComputedStyle(card.value).getPropertyValue('--transition').trim() !== 'static')
    {
        watch(() => transitionStore.state, onTransitionChange, {immediate: true});
    }
})

function handleMouseMove(e: MouseEvent)
{
    const cardV = card.value;
    if (!cardV || !maxTilt) return;
    const rect = cardV.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateY = ((x - centerX) / centerX) * maxTilt;
    const rotateX = -((y - centerY) / centerY) * maxTilt;
    cardV.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.00)`;
}
function handleMouseLeave()
{
    const cardV = card.value;
    if (!cardV || !maxTilt) return;
    cardV.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)';
}

</script>

<template>
    <quiz-card :class="className" ref="card" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave">
        <div 
            class="glass-effect" 
            :class="{'use-blur': getThemes().useBlur, 'use-glass': getThemes().useGlass}"
        />
        <div class="glass-tint"></div>
        <div class="glass-shine" v-if="getThemes().useGlass"></div>
        <div v-if="scroll" class="scroll-content">
            <slot />
        </div>
        <template v-else>
            <slot />
        </template>
    </quiz-card>
</template>

<style scoped lang="scss">

quiz-card {
    display: block;
    margin: 13px;
    padding: 0.25rem 0.5rem;
    border: solid 2px transparent;

    position: relative;
    border-radius: 24px;
    box-shadow: 0 4px 24px 0 rgba(0, 0, 0, 0.10), 0 1.5px 6px 0 rgba(0, 0, 0, 0.08);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.6);
    background: var(--glass-background);
}

.glass-effect {
    position: absolute;
    inset: 0;
    z-index: -2;
    isolation: isolate;
    border-radius: 24px;
    pointer-events: none;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    backdrop-filter: blur(0px);
}

.glass-effect.use-blur {
    backdrop-filter: blur(15px);
}

.glass-effect.use-glass {
    filter: url(#glass-distortion);
}

.glass-tint {
    position: absolute;
    inset: 0;
    z-index: -1;
    background: rgba(0, 0, 0, 0.15);
    border-radius: 24px;
    pointer-events: none;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
}

.glass-shine {
    position: absolute;
    inset: 0;
    z-index: 0;
    border: 1px solid var(--glass-border);
    border-radius: 24px;
    box-shadow:
        inset 1px 1px 8px 0 var(--glass-up-shadow),
        inset -1px -1px 8px 0 var(--glass-down-shadow);
    pointer-events: none;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
}

.scroll-content {
    overflow-y: auto;
    scrollbar-width: none;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

quiz-card {
    transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform;
}

quiz-card.disappeared-card {
    opacity: 0;
}

quiz-card.appeared-card {
    opacity: 1;
}

quiz-card.disappear {
    @include appear(disappear, 0, false);
}

quiz-card.appear {
    @include appear(appear, 0, true);
}

</style>