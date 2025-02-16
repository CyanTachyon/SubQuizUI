<script setup lang="ts">

import Sidebar from "../../templates/sidebar/Sidebar.vue";
import Loading from "../../components/Loading.vue";
import {useRoute, useRouter} from "vue-router";
import {ref} from "vue";
import type {Slice} from "../../dataClasses/Slice.ts";
import Card from "../../components/Card.vue";
import Pagination from "../../components/Pagination.vue";
import {pushUrl} from "../../utils/utils.ts";
import {getSubject} from "../../networks/backend/subject.ts";
import type {Subject} from "../../dataClasses/Subject.ts";
import StatusButton from "../../components/StatusButton.vue";
import {useUser} from "../../stores/user.ts";
import Text from "../../components/Text.vue";
import type { SectionType } from "../../dataClasses/SectionType.ts";
import { getSectionTypeList } from "../../networks/backend/section.ts";
import type { SectionTypeId, SubjectId } from "../../dataClasses/Ids.ts";
import NotFound from "../NotFound.vue";
import { getUserPermissionInSubject } from "../../networks/backend/admin.ts";
import { isAdmin } from "../../dataClasses/Permission.ts";  

const user = useUser();
const route = useRoute();
const router = useRouter();
const page = ref(Number(route.query.page) || 1);
const count = 30;
const subject = Number(route.params.id) as SubjectId;
const subjectInfo = ref(void 0 as undefined | null | Subject);
const hasPermission = ref(undefined as undefined | boolean);

document.title = '学科列表 - SubQuiz';

getSubject(subject).then(value => subjectInfo.value = value, () => subjectInfo.value = null);
if (!user.hasAdmin()) getUserPermissionInSubject(subject, 0).then(value => hasPermission.value = isAdmin(value), () => hasPermission.value = false);
else hasPermission.value = true;

function getStart()
{
    return (page.value - 1) * count;
}

const data = ref(void 0 as undefined | null | Slice<SectionType>)

function handlePageChange(newPage: number)
{
    if (page.value !== newPage)
    {
        page.value = newPage;
        pushUrl('/admin/subject/' + subject, {page: newPage.toString()});
    }
    getSectionTypeList(getStart(), count, subject).then(value => data.value = value);
}

handlePageChange(page.value)

function getTotalPage()
{
    return Math.ceil(data.value.totalSize / count) || 1;
}

function createSectionType()
{
    router.push('/admin/section/type/edit/new?subject=' + subject)
}

function editSubject()
{
    router.push('/admin/subject/edit/' + subject)
}

function startQuiz()
{
    router.push('/?subject=' + subject)
}

function editSectionType(id: SectionTypeId)
{
    if (hasPermission.value)
    {
        router.push('/admin/section/type/' + id)
    }
}

function gotoAdmins()
{
    router.push('/admin/admins?subject=' + subject)
}
</script>

<template>
    <NotFound v-if="subjectInfo === null"/>
    <Sidebar v-else>
        <template v-if="data === undefined || subjectInfo === undefined">
            <Loading class="loading"/>
        </template>
        <template v-else>
            <div class="section-types-container">
                <Text class="main-title">{{ subjectInfo.name }}</Text>
                <Text class="main-description">{{ subjectInfo.description }}</Text>
                <div class="section-types-container-header">
                    <StatusButton
                        v-if="hasPermission"
                        class="create-subject"
                        @click="editSubject"
                    >
                        修改该学科信息
                    </StatusButton>
                    <StatusButton
                        v-if="hasPermission"
                        class="create-subject"
                        @click="createSectionType"
                    >
                        创建新题目类型
                    </StatusButton>
                    <StatusButton
                        v-if="hasPermission"
                        class="create-subject"
                        @click="gotoAdmins"
                    >
                        查看学科管理员
                    </StatusButton>
                    <StatusButton
                        class="create-subject"
                        @click="startQuiz"
                    >
                        开始一次新测验
                    </StatusButton>
                </div>
                <Text class="spacer"/>
                <div class="section-types">
                    <template v-for="q in data.list">
                        <Card class="section-type" @click="editSectionType(q.id)" :class="{'clickable': hasPermission}">
                            <p class="title">{{ q.name }}</p>
                            <Text class="spacer"/>
                            <p>ID: {{ q.id }}</p>
                            <p class="description">{{ q.description }}</p>
                        </Card>
                    </template>
                    <Text v-if="data.list.length === 0" class="no-section-types">该学科暂无题目类型</Text>
                </div>
                <Pagination :count="getTotalPage()" :current="page" @change-page="handlePageChange" class="pagination"/>
            </div>
        </template>
    </Sidebar>
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

.section-types-container {
    display: flex;
    flex-direction: column;
    max-height: 100%;
    max-width: 100%;
    min-height: 100%;
    min-width: 100%;

    .no-section-types {
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

    .section-types-container-header {
        display: flex;
        flex-direction: row;
        justify-content: start;
        gap: 20px;
        margin: 0 0 20px 0px;
    }
}

.section-types {
    margin: 20px 0 0 0;
    display: grid;
    flex-grow: 1;
    grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
    justify-content: start;
    overflow-y: auto;
    scrollbar-width: none;
}

.section-type {
    padding: 15px 30px 30px 30px;
    height: 200px;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    margin: 20px;

    .description {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
}

.title {
    font-size: 1.25em;
    margin-bottom: 0px;
    font-weight: bold;
}

.spacer {
    flex-grow: 1;
    border-bottom: 1px solid rgba(0, 0, 0, 0.2);
    height: 1px;
    min-height: 1px;
    max-height: 1px;
}

.pagination {
    width: calc(min(100%, 800px));
    margin: 20px auto;
}

.clickable {
    cursor: pointer;
}
</style>