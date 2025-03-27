<script setup lang="ts">
import Card from '../components/Card.vue';
import Spacer from "../components/Spacer.vue";
import showdown from 'showdown';

const converter = new showdown.Converter();

interface UpdateInfo {
    date?: string;
    description: string;
    version: string;
}

const updateInfo: UpdateInfo[] = ([
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
    {
        date: '2025-03-21',
        version: '1.0.0',
        description: '添加多选、判断、填空、简答题支持，介入AI实现填空及简答题批改',
    },
    {
        date: '2025-03-24',
        version: '1.0.1',
        description: '' +
        '- 优化UI细节\n' + 
        '- 安卓端正式发布\n'
    },
    {
        date: '2025-03-24',
        version: '1.0.2',
        description: '' +
        '- 修复安卓端无法完成SSO授权的BUG\n' +
        '- 优化安卓端细节\n'
    },
    {
        date: '2025-03-25',
        version: '1.0.3',
        description: '' +
        '- 修复安卓端的一些bug\n'
    },
    {
        version: 'TODO LIST',
        description: '以下是预计添加的新功能，但我开发速度有限，所以别急^v^\n' +
        "0. 支持题目中插入图片\n" +
        "1. 支持给题目设置难度系数\n" +
        "2. 支持给题目设置标签/知识点\n" +
        "3. 支持按照题目类型/难度/标签/知识点过滤题目\n"
        ,
    }
] as UpdateInfo[]).reverse().map(item => {
    item.description = converter.makeHtml(item.description);
    return item;
});
</script>

<template>
    <div class="update-info-container">
        <Card class="update-info-item" v-for="item in updateInfo" :key="item.date">
            <div class="update-info-item-version">{{ item.version }}</div>
            <Spacer/>
            <div v-if="item.date" class="update-info-item-date">发布时间：{{ item.date }}</div>
            <div class="update-info-item-description" v-html="item.description"></div>
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


