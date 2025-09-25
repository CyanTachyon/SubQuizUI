<script setup lang="ts">
import { onMounted } from "vue";
import { ref, watch } from "vue";
import Card from "./Card.vue";
import { phone } from "../main";

const props = defineProps(
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
    watch(() => props.open, (value) => {
        if (value) {
            ele.value?.showModal?.();
        } else {
            ele.value?.close?.();
        }
    }, { immediate: true });
})

</script>

<template>
    <dialog ref="ele" @cancel.prevent="props.onClose()" @click.self="props.onClose()">
        <Card class="dialog-wrapper" :scroll="true" :class="{ phone }">
            <slot/>
        </Card>
    </dialog>
</template>

<style lang="scss" scoped>
dialog {
    background-color: transparent;
    border: none;
    border-radius: 0.5rem;
    --transition: 'static';
    user-select: none;
    display: flex;
    max-width: 100%;
    max-height: 100%;
    min-width: 100%;
    min-height: 100%;
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
}

dialog:focus {
  outline: none;
  box-shadow: none;
}

dialog::backdrop {
    background-color: rgba(0, 0, 0, 0.5);
}

.dialog-wrapper {
    color: var(--color);
    padding: 1rem;
    margin: 0;
    max-width: 85%;
    max-height: 85%;
    display: flex;
}

.dialog-wrapper.phone {
    max-width: 100%;
    
}
</style>