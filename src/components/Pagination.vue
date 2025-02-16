<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import debounce from "../utils/debounce.ts";
import StatusButton from "./StatusButton.vue";

const {count, current, onChangePage} = defineProps({
    count: {
        type: Number,
        required: true
    },
    current: {
        type: Number,
        required: true,
    },
    onChangePage: {
        type: Function,
        default: () =>
        {
        }
    }
})

if (count === 0) throw new Error('count is 0');

const containerRef = ref<HTMLElement>();
const visiblePages = ref(5);
const buttonWidth = 50;
const containerPadding = 16;
const currentStart = ref(0);
const currentEnd = ref(0);

const pages = computed(() =>
{
    const totalPages = count;
    const currentPage = current;
    const maxVisible = visiblePages.value;

    if (totalPages <= maxVisible)
    {
        currentStart.value = 1;
        currentEnd.value = totalPages;
        return Array.from({length: totalPages}, (_, i) => i + 1);
    }

    const hasLeftEllipsis = currentPage - Math.floor((maxVisible - 2) / 2) > 2;
    const hasRightEllipsis = currentPage + Math.floor((maxVisible - 2) / 2) < totalPages - 1;
    const availableSlots = maxVisible - 2 - (hasLeftEllipsis ? 1 : 0) - (hasRightEllipsis ? 1 : 0);

    let start = Math.max(2, currentPage - Math.floor(availableSlots / 2));
    let end = Math.min(totalPages - 1, currentPage + Math.floor(availableSlots / 2));

    if (end - start + 1 < availableSlots)
    {
        if (start === 2)
            end = Math.min(totalPages - 1, start + availableSlots - 1);
        else if (end === totalPages - 1)
            start = Math.max(2, end - availableSlots + 1);
    }

    currentStart.value = start;
    currentEnd.value = end;

    const pages = [1];
    if (hasLeftEllipsis) pages.push(-1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (hasRightEllipsis) pages.push(-2);
    pages.push(totalPages);

    if (pages.length > maxVisible)
    {
        const currentIndex = pages.indexOf(currentPage);
        const half = Math.floor(maxVisible / 2);
        return pages.slice(Math.max(0, currentIndex - half), Math.min(pages.length, currentIndex + half + 1));
    }

    return pages;
});

const updateVisiblePages = debounce(() =>
{
    if (!containerRef.value) return;
    const containerWidth = containerRef.value.offsetWidth - containerPadding * 2;
    visiblePages.value = Math.max(1, Math.floor(containerWidth / buttonWidth));
}, 100);

function handlePageClick(page: number)
{
    if (page === current || page < 1 || page > count) return;
    onChangePage(page);
}

function handleEllipsisClick(direction: number)
{
    let jump;
    if (direction === -1)
    {
        jump = currentStart.value - 5;
    }
    else
    {
        jump = currentEnd.value + 5;
    }
    jump = Math.max(1, Math.min(count, jump));
    onChangePage(jump);
}

onMounted(() =>
{
    const observer = new ResizeObserver(updateVisiblePages);
    if (containerRef.value) observer.observe(containerRef.value);
    onBeforeUnmount(() => observer.disconnect());
});

watch(() => ({count, current}), () =>
{
    if (current > count) onChangePage(count);
    else if (current < 1) onChangePage(1);
}, {immediate: true})
</script>

<template>
    <div ref="containerRef" class="pagination-container">
        <template v-for="page in pages" :key="page">
            <template v-if="page === -1">
                <StatusButton
                        class="ellipsis"
                        @click="handleEllipsisClick(-1)"
                >...
                </StatusButton>
            </template>
            <template v-else-if="page === -2">
                <StatusButton
                        class="ellipsis"
                        @click="handleEllipsisClick(1)"
                >...
                </StatusButton>
            </template>
            <template v-else>
                <StatusButton
                        :down="page === current"
                        class="page-button"
                        @click="handlePageClick(page)"
                >{{ page }}
                </StatusButton>
            </template>
        </template>
    </div>
</template>

<style scoped lang="scss">
.pagination-container {
    display: flex;
    justify-content: center;
    gap: 0;
}

.page-button {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 40px;
    text-align: center;
}

.ellipsis {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 40px;
    text-align: center;
}
</style>