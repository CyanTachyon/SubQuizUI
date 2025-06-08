<script setup lang="ts">
import { onMounted } from "vue";
import { ref, watch } from "vue";

const { open, onClose } = defineProps(
    {
        open: {
            type: Boolean,
            default: false
        },
        onClose: {
            type: Function,
            default: () => {}
        }
    }
);

const ele = ref(null as HTMLDialogElement);

onMounted(() =>
{
    watch(() => open, (value) => {
        if (value) {
            ele.value.showModal();
        } else {
            ele.value.close();
        }
    }, { immediate: true });
})

</script>

<template>
    <dialog ref="ele" @close="onClose()" @click.self="onClose()" @keydown.esc="onClose()">
        <quiz-dialog-wrapper>
            <slot/>
        </quiz-dialog-wrapper>
    </dialog>
</template>

<style lang="scss" scoped>
dialog {
    background-color: var(--bgcolor);
    border: none;
    border-radius: 0.5rem;
}

dialog:focus {
  outline: none;
  box-shadow: none;
}

dialog::backdrop {
    background-color: rgba(0, 0, 0, 0.5);
}

quiz-dialog-wrapper {
    width: 100%;
    height: 100%;
    color: var(--color);
}
</style>