<script setup lang="ts">
import Card from '../components/Card.vue';
import Spacer from "../components/Spacer.vue";


interface UpdateInfo {
    date: string;
    description: string;
    version: string;
}

const updateInfo: UpdateInfo[] = [
    {
        date: '2025-02-16',
        version: '0.0.0',
        description: '项目首个版本发布'
    },
    {
        date: '2025-03-01',
        version: '0.0.1',
        description: 'UI优化',
    },
].reverse();

</script>

<template>
    <div class="update-info-container">
        <Card class="update-info-item" v-for="item in updateInfo" :key="item.date">
            <div class="update-info-item-version">{{ item.version }}</div>
            <Spacer/>
            <div class="update-info-item-date">发布时间：{{ item.date }}</div>
            <div class="update-info-item-description">{{ item.description }}</div>
        </Card>
    </div>
</template>

<style scoped lang="scss">
.update-info-item {
    padding: 20px;
}

.update-info-item-version {
    font-size: 30px;
    font-weight: bold;
    margin-top: 10px;
    margin-bottom: 10px;
}

.update-info-item-date {
    font-size: 16px;
    margin-top: 10px;
    margin-bottom: 10px;
}

.update-info-item-description {
    font-size: 16px;
    margin-top: 20px;
}

</style>


