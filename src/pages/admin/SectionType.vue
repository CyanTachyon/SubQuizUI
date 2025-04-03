<script setup lang="ts">

import Loading from "../../components/Loading.vue";
import {useRoute, useRouter} from "vue-router";
import {ref, type Ref} from "vue";
import type {Slice} from "../../dataClasses/Slice.ts";
import Card from "../../components/Card.vue";
import Pagination from "../../components/Pagination.vue";
import {pushUrl} from "../../utils/utils.ts";
import {getSubject} from "../../networks/backend/subject.ts";
import type {Subject} from "../../dataClasses/Subject.ts";
import StatusButton from "../../components/StatusButton.vue";
import Text from "../../components/Text.vue";
import type { SectionType } from "../../dataClasses/SectionType.ts";
import { getSectionList, getSectionType } from "../../networks/backend/section.ts";
import type { SectionId, SectionTypeId } from "../../dataClasses/Ids.ts";
import NotFound from "../NotFound.vue";
import type { Section } from "../../dataClasses/Section.ts";
import Spacer from "../../components/Spacer.vue";
import type { AnswerType } from "../../dataClasses/Question.ts";

const route = useRoute();
const router = useRouter();
const page = ref(Number(route.query.page) || 1);
const count = 30;
const sectionType = Number(route.params.id) as SectionTypeId;
const sectionTypeInfo = ref(void 0 as undefined | null | SectionType);
const subjectInfo = ref(void 0 as undefined | null | Subject);

document.title = '题目类型列表 - SubQuiz';

(async () => {
    sectionTypeInfo.value = await getSectionType(sectionType);
    subjectInfo.value = await getSubject(sectionTypeInfo.value.subject);
})().catch(() => {
    sectionTypeInfo.value = null;
    subjectInfo.value = null;
});

function getStart()
{
    return (page.value - 1) * count;
}

const data: Ref<(undefined | null | Slice<Section<AnswerType, null, string>>)> = ref(void 0)

function handlePageChange(newPage: number)
{
    if (page.value !== newPage)
    {
        page.value = newPage;
        pushUrl('/admin/section/type/' + sectionType, {page: newPage.toString()});
    }
    getSectionList(getStart(), count, void 0, sectionType).then(value => data.value = value);
}

handlePageChange(page.value)

function getTotalPage()
{
    return Math.ceil(data.value.totalSize / count) || 1;
}

function createSection()
{
    router.push('/admin/section/edit/new' + '?subject=' + subjectInfo.value.id + '&type=' + sectionType)
}

function editSectionType()
{
    router.push('/admin/section/type/edit/' + sectionType + '?subject=' + subjectInfo.value.id)
}

function editSection(id: SectionId)
{
    router.push('/admin/section/edit/' + id)
}

function deleteSectionType()
{
    router.push('/admin/section/type/delete/' + sectionType + '?subject=' + subjectInfo.value.id)
}

function getSectionBrief(section: Section<AnswerType, null, string>)
{
    const qBrief = section
        .questions
        .map((q, i) => ({description: q.description, i}))
        .filter(q => q.description.trimStart().trimEnd() !== '')
        .map(q => `第${q.i + 1}题：${q.description}`)
        .join('\n');
    
    if (section.description.trimStart().trimEnd() === '')
    {
        if (qBrief.trimStart().trimEnd() === '') return '暂无描述';
        return qBrief;
    }
    return section.description + '\n' + qBrief;
}
</script>

<template>
    <NotFound v-if="subjectInfo === null"/>
    <Loading v-else-if="data === undefined || subjectInfo === undefined" class="loading"/>
    <div v-else class="sections-container">
        <Text class="main-title">{{ sectionTypeInfo.name }}</Text>
        <Text class="main-description">{{ sectionTypeInfo.description }}</Text>
        <div class="sections-container-header">
            <StatusButton
                class="create-subject"
                @click="editSectionType"
            >
                修改题目类型信息
            </StatusButton>
            <StatusButton
                class="create-subject"
                @click="deleteSectionType"
            >
                删除该题目类型
            </StatusButton>
            <StatusButton
                class="create-subject"
                @click="createSection"
            >
                创建题目
            </StatusButton>
        </div>
        <Spacer/>
        <div class="sections">
            <Card v-for="q in data.list" class="section" @click="editSection(q.id)">
                <p class="title">ID: {{ q.id }}</p>
                <Spacer/>
                <p style="margin-bottom: 0;">状态：{{ q.available ? '可用' : '不可用' }}</p>
                <p style="margin: 0;">小题数量：{{ q.questions.length }}</p>
                <p class="description" :title="getSectionBrief(q)">{{ getSectionBrief(q) }}</p>
            </Card>
            <Text v-if="data.list.length === 0" class="no-sections">该题目类型暂无题目</Text>
        </div>
        <Pagination :count="getTotalPage()" :current="page" @change-page="handlePageChange" class="pagination"/>
    </div>
</template>

<style scoped lang="scss">
.loading {
    position: relative;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    height: 20%;
    width: 30%;
}

.sections-container {
    display: flex;
    flex-direction: column;
    max-height: 100%;
    max-width: 100%;
    min-height: 100%;
    min-width: 100%;

    .no-sections {
        margin: 20px auto;
    }

    .create-subject {
        margin: 20px 0 0 20px ;
    }

    .main-title {
        margin: 20px 0 0 20px;
        font-size: 1.5em;
        font-weight: bold;
    }

    .main-description {
        margin: 20px 0px 0px 20px;
    }

    .sections-container-header {
        display: flex;
        flex-direction: row;
        justify-content: start;
        gap: 20px;
        margin: 0 0 20px 0px;
    }
}

.sections {
    margin: 20px 0 0 0;
    display: grid;
    flex-grow: 1;
    grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
    justify-content: start;
    overflow-y: auto;
    scrollbar-width: none;
}

.section {
    padding: 15px 30px 30px 30px;
    height: 240px;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    margin: 20px;
    cursor: pointer;

    .description {
        margin-bottom: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        line-clamp: 3;
        -webkit-box-orient: vertical;
    }
}

.title {
    font-size: 1.25em;
    margin-bottom: 0px;
    font-weight: bold;
}

.pagination {
    width: calc(min(100%, 800px));
    margin: 20px auto;
}
</style>