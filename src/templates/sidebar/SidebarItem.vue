<script setup lang="ts">

import StatusButton from "../../components/StatusButton.vue";

const { onClick, icon, title, iconLocation } = defineProps({
    onClick: {
        type: Function,
        default: () => {}
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
    <StatusButton class="item" @click="onClick()">
        <div class="wrap" :style="{'flex-direction': iconLocation === 'left' ? 'row' : 'row-reverse'}">
            <div class="icon-wrap">
                <component :is="icon" :size="36"></component>
            </div>
            <div class="content-wrap">
                {{ title }}
            </div>
        </div>
    </StatusButton>
</template>

<style scoped lang="scss">
$close-width: 69px;

.item {
    overflow: hidden;
    padding: 0 0 0 0;
    margin: 5px;
}

.wrap {
    margin: -11px;
    min-width: 196px;
    max-width: 196px;
    display: flex;
    min-height: $close-width;
    max-height: $close-width;
}

.icon-wrap {
    min-width: $close-width;
    max-width: $close-width;
    min-height: $close-width;
    max-height: $close-width;
    display: flex;
    justify-content: center;
    align-items: center;
}

.content-wrap {
    min-width: 120px;
    max-width: 120px;
    display: flex;
    align-items: center;
}
</style>