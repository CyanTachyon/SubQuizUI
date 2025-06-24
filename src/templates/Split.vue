<script setup lang="ts">
import { ref, onUnmounted, computed } from 'vue';
import Text from '../components/Text.vue';

// Props
interface Props
{
    initialLeftWidth?: number;
    minLeftWidth?: number;
    maxLeftWidth?: number;
    dividerWidth?: number;
}

const props = withDefaults(defineProps<Props>(), {
    initialLeftWidth: 50,
    minLeftWidth: 10,
    maxLeftWidth: 90,
    dividerWidth: 4
});

const emit = defineEmits<{
    resize: [leftWidth: number, rightWidth: number];
}>();

const leftWidth = ref(props.initialLeftWidth);
const isDragging = ref(false);
const splitContainer = ref<HTMLElement>();

const rightWidth = computed(() => 100 - leftWidth.value);

const startDrag = (event: MouseEvent) =>
{
    isDragging.value = true;
    event.preventDefault();

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
};

const onDrag = (event: MouseEvent) =>
{
    if (!isDragging.value || !splitContainer.value) return;

    const containerRect = splitContainer.value.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = event.clientX - containerRect.left;

    const newLeftWidth = (mouseX / containerWidth) * 100;

    leftWidth.value = Math.max(
        props.minLeftWidth,
        Math.min(props.maxLeftWidth, newLeftWidth)
    );

    emit('resize', leftWidth.value, rightWidth.value);
};

const stopDrag = () =>
{
    isDragging.value = false;

    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
};

onUnmounted(() =>
{
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
});
</script>
<template>
    <div ref="splitContainer" class="split-container">
        <div class="split-left" :style="{ width: `${leftWidth}%` }">
            <slot name="left"></slot>
        </div>
        <Text class="split-divider" :style="{ width: `${props.dividerWidth}px` }" @mousedown="startDrag">
            <div/>
        </Text>
        <div class="split-right" :style="{ width: `${rightWidth}%` }">
            <slot name="right"></slot>
        </div>
    </div>
</template>
<style lang="scss" scoped>
.split-container {
    display: flex;
    width: 100%;
    height: 100%;
    position: relative;
}

.split-left,
.split-right {
    overflow: hidden;
    position: relative;
}

.split-divider {
    cursor: col-resize;
    position: relative;
    flex-shrink: 0;

    div {
        opacity: 0.2;
        background-color: var(--color);
        transition: background-color 0.2s ease;
        width: 100%;
        height: 100%;
    }

    &:hover {
        div {
            opacity: 0.2;
            background-color: #007acc;
        }
    }

    &:active {
        div {
            opacity: 0.2;
            background-color: #005a9e;
        }
    }

    // 增加拖拽的有效区域
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -2px;
        right: -2px;
        bottom: 0;
        cursor: col-resize;
    }
}

// 拖拽时的全局样式
body.dragging {
    user-select: none;
    cursor: col-resize !important;

    * {
        cursor: col-resize !important;
    }
}
</style>