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
const buttonWidth = 60;
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
    
    const rightPages = totalPages - currentPage;
    const leftPages = currentPage - 1;
    const leftMax = Math.max(maxVisible - 1 - rightPages, Math.floor((maxVisible - 1) /2));
    let leftCount = Math.min(leftPages, leftMax);
    if (leftCount < leftPages && leftCount < 3) leftCount = 3;
    let rightCount = maxVisible - leftCount - 1;
    if (rightCount < rightPages && rightCount < 3) rightCount = 3;
    const pages = [];

    if (leftPages > leftCount) 
    {
        pages.push(1);
        pages.push(-1);
        const leftStart = leftPages - leftCount + 3;
        const leftEnd = leftPages;
        for (let i = leftStart; i <= leftEnd; i++) pages.push(i);
        currentStart.value = leftStart;
    }
    else
    {
        for (let i = 1; i <= leftPages; i++) pages.push(i);
    }

    pages.push(currentPage);

    if (rightPages > rightCount)
    {
        const rightStart = currentPage + 1;
        const rightEnd = currentPage + rightCount - 2;
        for (let i = rightStart; i <= rightEnd; i++) pages.push(i);
        pages.push(-2);
        pages.push(totalPages);
        currentEnd.value = rightEnd;
    }
    else
    {
        for (let i = currentPage + 1; i <= totalPages; i++) pages.push(i);
    }

    return pages;
});

const updateVisiblePages = debounce(() =>
{
    if (!containerRef.value) return;
    visiblePages.value = Math.max(1, Math.floor(containerRef.value.offsetWidth / buttonWidth));
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
        jump = Math.max(2, currentStart.value - 5);
    }
    else
    {
        jump = Math.min(count - 1, currentEnd.value + 5);
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

watch(() => ({count, current}), (newVal, oldVal) =>
{
    if (newVal.count !== oldVal?.count) updateVisiblePages();
    if (newVal.current > newVal.count) onChangePage(newVal.count);
    else if (newVal.current < 1) onChangePage(1);
}, {immediate: true})
</script>

<template>
    <quiz-pagination ref="containerRef">
        <template v-for="page in pages" :key="page">
            <StatusButton v-if="page === -1"
                    class="ellipsis"
                    @click="handleEllipsisClick(-1)"
            >...
            </StatusButton>
            <StatusButton v-else-if="page === -2"
                    class="ellipsis"
                    @click="handleEllipsisClick(1)"
            >...
            </StatusButton>
            <StatusButton v-else
                    :down="page === current"
                    class="page-button"
                    @click="handlePageClick(page)"
            >{{ page }}
            </StatusButton>
        </template>
    </quiz-pagination>
</template>

<style scoped lang="scss">
quiz-pagination {
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