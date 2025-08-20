<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount, computed } from 'vue'

interface ResizeEventDetail { width: number; height: number }

const props = defineProps<{
    width?: number
    height?: number
    minWidth?: number
    minHeight?: number
    maxWidth?: number
    maxHeight?: number
    lockAspectRatio?: boolean

    widthResizable?: boolean
    heightResizable?: boolean
}>()

const emit = defineEmits<{
    /** 实时尺寸变化 */
    (e: 'resize', payload: ResizeEventDetail): void
    /** 尺寸最终确定（pointerup） */
    (e: 'resize-end', payload: ResizeEventDetail): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const handleRef = ref<HTMLElement | null>(null)
const width = ref<number>(props.width ?? 0)
const height = ref<number>(props.height ?? 0)
const aspect = ref<number | null>(null)

const minW = () => props.minWidth ?? 60
const minH = () => props.minHeight ?? 40
const maxW = () => props.maxWidth ?? Number.POSITIVE_INFINITY
const maxH = () => props.maxHeight ?? Number.POSITIVE_INFINITY

function clamp(v: number, min: number, max: number) {
    return Math.min(Math.max(v, min), max)
}

let dragging = false
let startX = 0
let startY = 0
let startW = 0
let startH = 0

function beginDrag(clientX: number, clientY: number) 
{
    dragging = true
    startX = clientX
    startY = clientY
    // 直接以当前元素的 offset 尺寸为基准，保证与实际显示同步
    if (containerRef.value) {
        startW = containerRef.value.offsetWidth
        startH = containerRef.value.offsetHeight
    } else {
        startW = width.value
        startH = height.value
    }
    width.value = startW
    height.value = startH
    if (props.lockAspectRatio) {
        aspect.value = startW / startH
    }
    document.body.classList.add('dragging-resize')
}

function onPointerDown(e: PointerEvent) 
{
    if (!containerRef.value) return
    beginDrag(e.clientX, e.clientY);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp, { once: true })
}

function onPointerMove(e: PointerEvent)
{
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    let newW = startW + dx;
    let newH = startH + dy;
    if (props.lockAspectRatio && aspect.value)
    {
        // 依据较大的变化方向维持比例
        if (Math.abs(dx) > Math.abs(dy))
        {
            newH = newW / aspect.value;
        } 
        else
        {
            newW = newH * aspect.value;
        }
    }
    newW = clamp(newW, minW(), maxW());
    newH = clamp(newH, minH(), maxH());
    width.value = Math.round(newW);
    height.value = Math.round(newH);
}

function onPointerUp()
{
    dragging = false;
    window.removeEventListener('pointermove', onPointerMove);
    emit('resize-end', { width: width.value, height: height.value });
    document.body.classList.remove('dragging-resize');
}

// ===== 非 PointerEvent 回退处理 =====
function onMouseDown(e: MouseEvent) {
    if (window.PointerEvent) return // 有 PointerEvent 时不用回退
    e.preventDefault()
    beginDrag(e.clientX, e.clientY)
    window.addEventListener('mousemove', onMouseMoveFallback)
    window.addEventListener('mouseup', onMouseUpFallback, { once: true })
}

function onMouseMoveFallback(e: MouseEvent) {
    if (!dragging) return
    onPointerMove(new PointerEvent('pointermove', { clientX: e.clientX, clientY: e.clientY }))
}

function onMouseUpFallback(_e: MouseEvent) {
    if (!dragging) return
    onPointerUp()
    window.removeEventListener('mousemove', onMouseMoveFallback)
}

function onTouchStart(e: TouchEvent) {
    if (window.PointerEvent) return
    if (e.touches.length !== 1) return
    e.preventDefault()
    const t = e.touches[0]
    beginDrag(t.clientX, t.clientY)
    window.addEventListener('touchmove', onTouchMoveFallback, { passive: false })
    window.addEventListener('touchend', onTouchEndFallback, { once: true })
    window.addEventListener('touchcancel', onTouchEndFallback, { once: true })
}

function onTouchMoveFallback(e: TouchEvent) {
    if (!dragging) return
    if (e.touches.length !== 1) return
    e.preventDefault()
    const t = e.touches[0]
    onPointerMove(new PointerEvent('pointermove', { clientX: t.clientX, clientY: t.clientY }))
}

function onTouchEndFallback() {
    if (!dragging) return
    onPointerUp()
    window.removeEventListener('touchmove', onTouchMoveFallback)
}

onMounted(async () => 
{
    if (!window.PointerEvent && handleRef.value) 
    {
        handleRef.value.addEventListener('mousedown', onMouseDown)
        handleRef.value.addEventListener('touchstart', onTouchStart, { passive: false })
    }
})

onBeforeUnmount(() => 
{
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    if (handleRef.value && !window.PointerEvent) {
        handleRef.value.removeEventListener('mousedown', onMouseDown)
        handleRef.value.removeEventListener('touchstart', onTouchStart)
    }
})

watch([width, height], () => 
{
    emit('resize', { width: width.value, height: height.value })
})

const styleObject = computed(() => 
{
    let res: any = {}
    if (width.value > 0 && props.widthResizable) res.width = width.value + 'px'
    if (height.value > 0 && props.heightResizable) res.height = height.value + 'px'
    return res
})

defineExpose({ width, height })
</script>
<template>
    <div
        ref="containerRef"
        class="resizeable-wrapper"
        :style="styleObject"
    >
        <slot />
        <div ref="handleRef" class="resize-handle" @pointerdown="onPointerDown" />
    </div>
</template>
<style scoped lang="scss">
.resizeable-wrapper {
    position: relative;
    display: inline-block;
    box-sizing: border-box;
    /* 允许内部元素用百分比布局 */
    overflow: hidden;
    border: 1px solid transparent;
    transition: border-color 0.15s;
    scrollbar-width: none;
}

.resize-handle {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 14px;
    height: 14px;
    cursor: se-resize;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    /* 提高可点区域 */
    padding: 2px;
    box-sizing: border-box;
    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%);
    border-top-left-radius: 4px;
    user-select: none;
    touch-action: none; // 阻止触摸滚动干扰拖拽
    &::after {
        content: '';
        width: 100%;
        height: 100%;
        background:
            repeating-linear-gradient(135deg,
                rgba(255,255,255,0.6) 0 2px,
                rgba(255,255,255,0) 2px 4px
            );
        opacity: 0.8;
        pointer-events: none;
        border-bottom-right-radius: 2px;
    }
    &:active::after {
        opacity: 1;
    }
}

</style>
<style lang="scss">
body.dragging-resize {
    user-select: none !important;
    cursor: se-resize !important;
}
</style>