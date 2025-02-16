<script setup lang="ts">
import {ref, watch} from "vue";
import {createAnimationsController} from "../utils/AnimationsController.ts";
import {$appearDuration, State, useTransitionStore} from "../stores/transition.ts";
import {sleep} from "../utils/sleep.ts";
import StatusButton from "./StatusButton.vue";

const {onClick, disappear} = defineProps({
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
});

let className = ref('');
let controller = createAnimationsController();

if (disappear) className.value = 'disappear-button';

let down = ref(false);

function click()
{
    if (disappear) return;
    controller.push([
        () =>
        {
            down.value = true;
            (onClick as unknown as (() => void))();
        },
        () => sleep(400),
        () => down.value = false,
        () => sleep(400),
    ], false)
}

function onDisappearChange(value: boolean, oldValue: boolean)
{
    if (value === oldValue) return;
    controller.push([
        () => className.value = value ? 'disappear' : 'appear',
        () => sleep($appearDuration),
        () => className.value = value ? 'disappear-button' : 'button',
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
    <!-- <div @click="click" class="btn tmp-button" :class="className">
        <slot/>
    </div> -->
    <StatusButton @click="click" :disappear="disappear" :down="down">
        <slot/>
    </StatusButton>
</template>

<style scoped lang="scss">
</style>