<script setup lang="ts">
import Text from './Text.vue';

</script>

<template>
    <Text class="spacer"/>
</template>

<style scoped lang="scss">
.spacer {
    flex-grow: 1;
    border-bottom: 1px solid rgba(from var(--color) r g b / 20%);
    height: 1px;
    min-height: 1px;
    max-height: 1px;
}
</style>