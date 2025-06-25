<script setup lang="ts">

import Button from "../../components/Button.vue";

const { onClick, icon, title, iconLocation } = defineProps({
    onClick: {
        type: Function,
        default: () => {}
    },
    onLongPress: {
        type: Function,
        default: null
    },
    icon: {
        // 为一个vue组件
        type: Object,
        default: () => {}
    },
    title: {
        type: String,
        default: ''
    },
    iconLocation: { // left, right
        type: String,
        default: 'left'
    }
})

</script>

<template>
    <Button class="item" @click="onClick()" @long-press="onLongPress">
        <quiz-sidebar-item-wrapper :style="{ 'flex-direction': iconLocation === 'left' ? 'row' : 'row-reverse' }">
            <quiz-sidebar-item-icon-wrapper><component :is="icon" :size="36"/></quiz-sidebar-item-icon-wrapper>
            <quiz-sidebar-item-content-wrapper>{{ title }}</quiz-sidebar-item-content-wrapper>
        </quiz-sidebar-item-wrapper>
    </Button>
</template>

<style scoped lang="scss">
$close-width: 69px;

.item {
    overflow: hidden;
    padding: 0 0 0 0;
    margin: 5px;
    min-height: 51px;
    max-height: 51px;
}

quiz-sidebar-item-wrapper {
    margin: -11px;
    min-width: 196px;
    max-width: 196px;
    display: flex;
    min-height: $close-width;
    max-height: $close-width;
}

quiz-sidebar-item-icon-wrapper {
    min-width: $close-width;
    max-width: $close-width;
    min-height: $close-width;
    max-height: $close-width;
    display: flex;
    justify-content: center;
    align-items: center;
}

quiz-sidebar-item-content-wrapper {
    min-width: 120px;
    max-width: 120px;
    display: flex;
    align-items: center;
}
</style>