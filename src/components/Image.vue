<script setup lang="ts">
import {createAnimationsController} from "../utils/AnimationsController.ts";
import {onMounted, ref, watch} from "vue";
import {sleep} from "../utils/sleep.ts";
import {$appearDuration, State, useTransitionStore} from "../stores/transition.ts";

const {src, onClick, alt, disappear} = defineProps({
    src: {
        type: String,
        required: true
    },
    onClick: {
        type: Function,
        required: false,
    },
    alt: {
        type: String,
        required: false,
        default: ''
    },
    disappear: {
        type: Boolean,
        default: false
    },
});

let controller = createAnimationsController();
let borderClassName = ref(disappear ? 'border-disappeared' : 'border');
let imgClassName = ref(disappear ? 'image-disappeared' : 'image');

function onDisappearChange(value: boolean, oldValue: boolean)
{
    if (value === oldValue) return;
    controller.push([
        () =>
        {
            borderClassName.value = value ? 'border-disappear' : 'border-appear';
            imgClassName.value = value ? 'image-disappear' : 'image-appear';
        },
        () => sleep($appearDuration),
        () =>
        {
            borderClassName.value = value ? 'border-disappeared' : 'border';
            imgClassName.value = value ? 'image-disappeared' : 'image';
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
const image = ref<HTMLImageElement | null>(null);
onMounted(() => {
    if (image.value && window.getComputedStyle(image.value).getPropertyValue('--transition') !== 'static')
    {
        watch(() => transitionStore.state, onTransitionChange, {immediate: true});
    }
})

</script>

<template>
    <quiz-img-wrapper @click="(onClick as unknown as () => void)" :class="{'clickable': onClick, [borderClassName]: true} " ref="image">
        <img :src="src" :alt="alt" :class="imgClassName"/>
    </quiz-img-wrapper>
</template>

<style scoped lang="scss">
.clickable {
    cursor: pointer;
}

@keyframes img-disappear {
    0% {
        opacity: 1;
    }

    50% {
        opacity: 0;
    }

    100% {
        opacity: 0;
    }
}

@keyframes img-appear {
    0% {
        opacity: 0;
    }

    50% {
        opacity: 0;
    }

    100% {
        opacity: 1;
    }
}

img {
    border-width: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    margin: 0;
}

quiz-img-wrapper {
    display: block;
    border-radius: 50%;
    border-width: 0;
    padding: 0.25rem 0.20rem 0.20rem 0.25rem;
    margin: 13px;
    overflow: hidden;
}

.border {
    @include neumorphism-up;
}

.border-disappeared {
    box-shadow: none;
}

.border-disappear {
    @include appear(border-disappear, up, false);
}

.border-appear {
    @include appear(border-appear, up, true);
}

.image {
    opacity: 1;
}

.image-disappeared {
    opacity: 0;
}

.image-disappear {
    animation: img-disappear $appear-duration ease-out forwards;
}

.image-appear {
    animation: img-appear $appear-duration ease-in forwards;
}


</style>