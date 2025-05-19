<script setup lang="ts">
import {ref} from "vue";
import {createAnimationsController} from "../utils/AnimationsController.ts";
import {sleep} from "../utils/sleep.ts";
import StatusButton from "./StatusButton.vue";

const {onClick, disappear, disabled } = defineProps({
    onClick: {
        type: Function,
        default() {}
    },
    disappear: {
        type: Boolean,
        default: false
    },
    disabled: {
        type: Boolean,
        default: false,
    }
});

let className = ref('');
let controller = createAnimationsController();

if (disappear) className.value = 'disappear-button';

let down = ref(false);

function click()
{
    if (disappear) return;
    controller.push([
        () => down.value = true,
        () => sleep(400),
        () => {
            (onClick as unknown as (() => void))();
            down.value = false;
        },
        () => sleep(400),
    ], false)
}

</script>

<template>
    <StatusButton @click="click" :disappear="disappear" :down="down" :disabled="disabled">
        <slot/>
    </StatusButton>
</template>

<style scoped lang="scss">
</style>