<script setup lang="ts">
import Card from '../components/Card.vue';
import Spacer from "../components/Spacer.vue";

interface UpdateInfo
{
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
        date: '2025-05-11',
        version: '2.0.0',
        description: '' +
            '- 添加备课组、知识点相关功能\n' +
            '- 重新设计了部分UI\n' +
            '- 支持按知识点开始测试\n' +
            '- 优化及已知错误的修复\n'
    },
    {
        date: '2025-06-08',
        version: '2.1.0',
        description: '' +
            '- 增加AI追问功能\n' +
            '- 修复了已知bug\n'
    },
    {
        date: '2025-06-10',
        version: '2.2.0',
        description: '' +
            '- 增加了AI聊天界面\n' +
            '- 提供更多AI聊天相关功能\n' 
    },
    {
        version: 'TODO LIST',
        description: '以下是预计添加的新功能，但我开发速度有限，所以别急^v^\n' +
            "1. 简答/填空允许提交图片\n" +
            "2. 支持给题目设置难度系数\n" +
            "3. 添加批量题目导入导出功能\n"
        ,
    }
] as UpdateInfo[]).reverse();
</script>

<template>
    <quiz-update-info-container>
        <Card v-for="item in updateInfo" :key="item.version">
            <quiz-update-info-item-version>{{ item.version }}</quiz-update-info-item-version>
            <Spacer />
            <quiz-update-info-item-date v-if="item.date">发布时间：{{ item.date }}</quiz-update-info-item-date>
            <quiz-update-info-item-description v-markdown="{ content: item.description }"></quiz-update-info-item-description>
        </Card>
    </quiz-update-info-container>
</template>

<style scoped lang="scss">
quiz-card {
    padding: 20px;
}

quiz-update-info-item-version {
    display: block;
    font-size: 30px;
    font-weight: bold;
    margin-top: 10px;
    margin-bottom: 10px;
}

quiz-update-info-item-date {
    display: block;
    font-size: 16px;
    margin-top: 10px;
    margin-bottom: 10px;
}

quiz-update-info-item-description {
    display: block;
    font-size: 16px;
    margin-top: 20px;
}
</style>
