<script setup lang="ts">

import Sidebar from "../../templates/sidebar/Sidebar.vue";
import Loading from "../../components/Loading.vue";
import {useRoute, useRouter} from "vue-router";
import {ref} from "vue";
import type {Slice} from "../../dataClasses/Slice.ts";
import Card from "../../components/Card.vue";
import Pagination from "../../components/Pagination.vue";
import {pushUrl} from "../../utils/utils.ts";
import {getSubjectList} from "../../networks/backend/subject.ts";
import type {Subject} from "../../dataClasses/Subject.ts";
import StatusButton from "../../components/StatusButton.vue";
import {useUser} from "../../stores/user.ts";
import Text from "../../components/Text.vue";

const route = useRoute();
const router = useRouter();
const page = ref(Number(route.query.page) || 1);
const count = 30;

document.title = '学科列表 - SubQuiz';

function getStart()
{
    return (page.value - 1) * count;
}

const data = ref(null as null | Slice<Subject>)

function gotoSubject(q: Subject)
{
    router.push('/admin/subject/' + q.id)
}

function handlePageChange(newPage: number)
{
    if (page.value !== newPage)
    {
        pushUrl('/admin/subject/list', {page: newPage.toString()});
        page.value = newPage;
    }
    getSubjectList(getStart(), count).then(value => data.value = value);
}

handlePageChange(page.value)

function getTotalPage()
{
    return Math.ceil(data.value.totalSize / count) || 1;
}

function createSubject()
{
    router.push('/admin/subject/edit/new')
}

const user = useUser();
</script>

<template>
    <Sidebar>
        <template v-if="data === null">
            <Loading class="loading"/>
        </template>
        <template v-else>
            <div class="subjects-container">
                <StatusButton
                        v-if="user.hasAdmin()"
                        class="create-subject"
                        @click="createSubject"
                >
                    创建新科目
                </StatusButton>
                <div class="subjects">
                    <template v-for="q in data.list">
                        <Card class="subject" @click="gotoSubject(q)">
                            <p class="title">{{ q.name }}</p>
                            <Text class="spacer"/>
                            <p>ID: {{ q.id }}</p>
                            <p class="description">{{ q.description }}</p>  <!-- 添加class -->
                        </Card>
                    </template>
                    <Text v-if="data.list.length === 0" class="no-subjects">暂无科目</Text>
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

.subjects-container {
    display: flex;
    flex-direction: column;
    max-height: 100%;
    max-width: 100%;
    min-height: 100%;
    min-width: 100%;

    .no-subjects {
        margin: 20px auto;
    }

    .create-subject {
        margin: 20px 0 0 20px;
    }
}

.subjects {
    margin: 20px 0 0 0;
    display: grid;
    flex-grow: 1;
    grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
    justify-content: start;
    overflow-y: auto;
    scrollbar-width: none;
}

.subject {
    padding: 15px 30px 30px 30px;
    cursor: pointer;
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
</style>