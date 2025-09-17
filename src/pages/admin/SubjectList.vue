<script setup lang="ts">

import Loading from "../../components/Loading.vue";
import {useRoute, useRouter} from "vue-router";
import {ref} from "vue";
import type {Slice} from "../../dataClasses/Slice.ts";
import Card from "../../components/Card.vue";
import Pagination from "../../components/Pagination.vue";
import {pushUrl} from "../../utils/utils.tsx";
import {getSubjectList} from "../../networks/backend/subject.ts";
import type {Subject} from "../../dataClasses/Subject.ts";
import Button from "../../components/Button.vue";
import {useUser} from "../../stores/user.ts";
import Text from "../../components/Text.vue";
import Spacer from "../../components/Spacer.vue";
import { phone } from "../../main.ts";

document.title = '学科列表 - SubQuiz';

const route = useRoute();
const router = useRouter();
const page = ref(Number(route.query.page) || 1);
const count = 30;

function getStart()
{
    return (page.value - 1) * count;
}

const data = ref(null as null | Slice<Subject>)

function gotoSubject(q: Subject)
{
    router.push('/admin/subject/' + q.id)
}

const loadingPage = ref(false);
function handlePageChange(newPage: number)
{
    if (page.value !== newPage)
    {
        pushUrl('/admin/subject/list', {page: newPage.toString()});
        page.value = newPage;
    }
    loadingPage.value = true;
    getSubjectList(getStart(), count).then(value => data.value = value).finally(() => loadingPage.value = false);
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
    <Loading v-if="data === null" class="loading"/>
    <quiz-subjects-container v-else :class="{ phone }">
        <Button
            v-if="user.hasAdmin()"
            class="create-subject"
            @click="createSubject"
        >
            创建新科目
        </Button>
        <quiz-subjects>
            <Loading v-if="loadingPage"/>
            <Card :max-tilt="5" v-if="data?.list?.length" v-for="q in data.list" @click="gotoSubject(q)">
                <p class="title">{{ q.name }}</p>
                <Spacer/>
                <p>ID: {{ q.id }}</p>
                <p class="description">{{ q.description }}</p>  <!-- 添加class -->
            </Card>
            <Text v-else class="no-subjects">暂无科目</Text>
        </quiz-subjects>
        <Pagination :count="getTotalPage()" :current="page" @change-page="handlePageChange" :disabled="loadingPage"/>
    </quiz-subjects-container>
</template>

<style scoped lang="scss">


quiz-subjects-container {
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

quiz-subjects {
    margin: 20px 0 0 0;
    display: grid;
    // flex-grow: 1;
    grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
    justify-content: start;
    overflow-y: auto;
    scrollbar-width: none;
}

@media (max-width: 540px) {
    .phone quiz-subjects {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .phone quiz-subjects quiz-card {
        width: 100%;
    }
}

quiz-card {
    padding: 15px 30px 30px 30px;
    cursor: pointer;
    max-height: 220px;
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

quiz-pagination {
    width: calc(min(100%, 800px));
    margin: auto auto 20px auto;
}
</style>