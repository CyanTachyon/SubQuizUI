<script setup lang="ts">
import { ref, onUnmounted, computed, onMounted } from 'vue';
import Text from '../components/Text.vue';

// Props
interface Props
{
    initialLeftWidth?: string;
    minLeftWidth?: string;
    maxLeftWidth?: string;
    minRightWidth?: string;
    maxRightWidth?: string;
}

const props = withDefaults(defineProps<Props>(), {
    initialLeftWidth: '50%',
    minLeftWidth: '100px',
    maxLeftWidth: '100%',
    minRightWidth: '100px',
    maxRightWidth: '100%',
});

const leftWidth = ref(0);
onMounted(() => {
    const rect = splitContainer.value.getBoundingClientRect();
    leftWidth.value = convertToPercentage(props.initialLeftWidth || '50%', rect.width);
})
const isDragging = ref(false);
const splitContainer = ref<HTMLElement>();

const rightWidth = computed(() => 100 - leftWidth.value);

const convertToPercentage = (value: string, containerWidth: number): number =>
{
    if (value.endsWith('%')) return parseFloat(value);
    else if (value.endsWith('px')) return parseFloat(value) / containerWidth * 100;
    else if (value.endsWith('em')) return (parseFloat(value) * 16) / containerWidth * 100;
    else if (value.endsWith('rem')) return (parseFloat(value) * 16) / containerWidth * 100;
    else if (value.endsWith('vw')) return (parseFloat(value) / containerWidth * window.innerWidth);
    else if (value.endsWith('vh')) return (parseFloat(value) / containerWidth * window.innerHeight);
    return parseFloat(value) || 0;
};

const getEventX = (event: MouseEvent | TouchEvent): number =>
{
    if ('touches' in event) 
    {
        return event.touches[0]?.clientX || 0;
    }
    return event.clientX;
};

const startDrag = (event: MouseEvent | TouchEvent) =>
{
    isDragging.value = true;
    event.preventDefault();

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', stopDrag);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
};

const onDrag = (event: MouseEvent | TouchEvent) =>
{
    if (!isDragging.value || !splitContainer.value) return;

    if ('touches' in event) 
    {
        event.preventDefault();
    }
    
    const containerRect = splitContainer.value.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const eventX = getEventX(event);
    const mouseX = eventX - containerRect.left;

    leftWidth.value = (mouseX / containerWidth) * 100;
};

const stopDrag = () =>
{
    isDragging.value = false;

    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', stopDrag);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
};

onUnmounted(() =>
{
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', stopDrag);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
});
</script>
<template>
    <div ref="splitContainer" class="split-container">
        <div class="split-left" :style="{ width: `${leftWidth}%`, maxWidth: props.maxLeftWidth, minWidth: props.minLeftWidth }">
            <slot name="left"></slot>
        </div>
        <Text 
            class="split-divider"
            @mousedown="startDrag"
            @touchstart="startDrag"
            >
            <div/>
        </Text>
        <div class="split-right" :style="{ width: `${rightWidth}%`, maxWidth: props.maxRightWidth, minWidth: props.minRightWidth }">
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
    touch-action: none; /* 防止触摸时的默认行为 */
    width: 4px;

    div {
        opacity: 0.2;
        cursor: col-resize;
        height: 100%;
        left: -8px;
        right: -8px;
        width: calc(100% + 16px);
        position: absolute;
    }

    &:hover {
        &::before {
            opacity: 0.2;
            background-color: #007acc;
        }
    }

    &:active {
        &::before {
            opacity: 0.2;
            background-color: #005a9e;
        }
    }

    // 增加拖拽的有效区域
    &::before {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        touch-action: none;


        opacity: 0.2;
        background-color: var(--color);
        transition: background-color 0.2s ease;
        width: 100%;
        height: 100%;
    }
}
</style>