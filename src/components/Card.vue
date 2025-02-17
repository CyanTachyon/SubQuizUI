<script setup lang="ts">
import {createAnimationsController} from "../utils/AnimationsController.ts";
import {ref, watch} from "vue";
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
watch(() => transitionStore.state, onTransitionChange, {immediate: true});

</script>

<template>
    <div class="card" :class="className">
        <slot/>
    </div>
</template>

<style scoped lang="scss">

.card {
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    margin: 13px;
}

.appeared-card {
    @include neumorphism-up;
}

.disappeared-card {
    @include neumorphism-down;
}

.disappear {
    @include appear('disappear', up, false);
}

.appear {
    @include appear('appear', up, true);
}

</style>