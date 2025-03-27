<script setup lang="ts">
import { useRoute } from 'vue-router';
import { connectUrl, Target } from '../../networks/utils/sendRequest';

const route = useRoute();
let params = route.query;
let oUrl = route.params.url as string[];
if (!oUrl) oUrl = [];

const url = connectUrl(Target.SSO_FRONTEND, oUrl.join('/'), params as Record<string, string>);
</script>

<template>
    <iframe :src="url" class="sso-iframe"/>
</template>

<style scoped lang="scss">
.sso-iframe {
    width: 100%;
    height: 100%;
    border: none;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
        display: none;
    }
}
</style>