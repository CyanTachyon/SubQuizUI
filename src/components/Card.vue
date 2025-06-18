<script setup lang="ts">
import {createAnimationsController} from "../utils/AnimationsController.ts";
import {onMounted, ref, watch} from "vue";
import {$appearDuration, State, useTransitionStore} from "../stores/transition.ts";
import {sleep} from "../utils/sleep.ts";

const {disappear} = defineProps({
    disappear: {
        type: Boolean,
        default: false
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
    if (card.value && window.getComputedStyle(card.value).getPropertyValue('--transition') !== 'static')
    {
        watch(() => transitionStore.state, onTransitionChange, {immediate: true});
    }
})

</script>

<template>
    <quiz-card :class="className" ref="card">
        <slot/>
    </quiz-card>
</template>

<style scoped lang="scss">

quiz-card {
    display: block;
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    margin: 13px;
}

.appeared-card {
    @include neumorphism-up;
}

.disappeared-card {
    opacity: 0;
}

.disappear {
    @include appear('disappear', up, false);
}

.appear {
    @include appear('appear', up, true);
}

</style>