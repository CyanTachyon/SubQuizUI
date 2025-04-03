<script setup lang="ts">
import Card from '../components/Card.vue';
import Spacer from "../components/Spacer.vue";

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
        description: '添加多选、判断、填空、简答题支持，接入AI实现填空及简答题批改',
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
        date: '2025-03-25',
        version: '1.0.4',
        description: '' +
        '- Markdown支持\n'
    },
    {
        date: '2025-03-30',
        version: '1.0.5',
        description: '' +
        '- 题目插入图片支持\n'
    },
    {
        date: '2025-03-31',
        version: '1.0.6',
        description: '' +
        '- 修复markdown和katex渲染相关bug\n'
    },
    {
        date: '2025-04-01',
        version: '1.0.7',
        description: '' +
        '- 支持设置题目权重\n'
    },
    {
        date: '2025-04-02',
        version: '1.0.8',
        description: '' +
        '- 修复在某些旧版浏览器上渲染markdown失败的bug\n'
    },
    {
        version: 'TODO LIST',
        description: '以下是预计添加的新功能，但我开发速度有限，所以别急^v^\n' +
        "1. 简答/填空允许提交图片\n" +
        "2. 支持给题目设置难度系数\n" +
        "3. 支持给题目设置标签/知识点\n" +
        "4. 支持按照题目类型/难度/标签/知识点过滤题目\n"
        ,
    }
] as UpdateInfo[]).reverse();
</script>

<template>
    <div class="update-info-container">
        <Card class="update-info-item" v-for="item in updateInfo" :key="item.version">
            <div class="update-info-item-version">{{ item.version }}</div>
            <Spacer/>
            <div v-if="item.date" class="update-info-item-date">发布时间：{{ item.date }}</div>
            <div class="update-info-item-description" v-markdown="{content: item.description}"></div>
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


