<script setup lang="ts">

import Loading from "../../components/Loading.vue";
import {useRoute, useRouter} from "vue-router";
import {ref} from "vue";
import Card from "../../components/Card.vue";
import {getSubject} from "../../networks/backend/subject.ts";
import type {Subject} from "../../dataClasses/Subject.ts";
import Button from "../../components/Button.vue";
import {useUser} from "../../stores/user.ts";
import Text from "../../components/Text.vue";
import type { SubjectId } from "../../dataClasses/Ids.ts";
import NotFound from "../NotFound.vue";
import Spacer from "../../components/Spacer.vue";
import type { PreparationGroup } from "../../dataClasses/PreparationGroup.ts";
import { getPreparationGroupList } from "../../networks/backend/preparationGroup.ts";

document.title = '学科信息 - SubQuiz';

const user = useUser();
const route = useRoute();
const router = useRouter();
const subject = Number(route.params.id) as SubjectId;
const subjectInfo = ref(void 0 as undefined | null | Subject);
const groups = ref(void 0 as PreparationGroup[] | undefined);

(async () => {

    try
    {
        let value = await getSubject(subject);
        subjectInfo.value = value;
        groups.value = await getPreparationGroupList(value.id);
    }
    catch (e)
    {
        subjectInfo.value = null;
        groups.value = null;
    }
})()

function editSubject()
{
    router.push('/admin/subject/edit/' + subject)
}

function createGroup()
{
    router.push('/admin/group/edit/new?subject=' + subject)
}

function gotoGroup(q: PreparationGroup)
{
    router.push('/admin/group/' + q.id)
}

function timeToString(time: number)
{
    const date = new Date(time);
    const padZero = (num: number) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}:${padZero(date.getSeconds())}`;
}

</script>

<template>
    <NotFound v-if="subjectInfo === null"/>
    <Loading v-else-if="groups === undefined || subjectInfo === undefined" class="loading"/>
    <div v-else class="section-types-container">
        <Text class="main-title">{{ subjectInfo.name }}</Text>
        <Text class="main-description">{{ subjectInfo.description }}</Text>
        <div class="section-types-container-header">
            <Button
                v-if="user.hasAdmin()"
                class="create-subject"
                @click="editSubject"
            >
                修改学科信息
            </Button>
            <Button
                v-if="user.hasAdmin()"
                class="create-subject"
                @click="createGroup"
            >
                创建新备课组
            </Button>
        </div>
        <Spacer/>
        <div class="section-types">
            <template v-for="q in groups">
                <Card :max-tilt="5" class="section-type clickable" @click="gotoGroup(q)">
                    <p class="title">{{ q.name }}</p>
                    <Spacer/>
                    <p>创建时间: {{ timeToString(q.time) }}</p>
                    <p class="description">{{ q.description }}</p>
                </Card>
            </template>
            <Text v-if="groups.length === 0" class="no-section-types">该学科暂无备课组</Text>
        </div>
    </div>
</template>

<style scoped lang="scss">


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

.pagination {
    width: calc(min(100%, 800px));
    margin: 20px auto;
}

.clickable {
    cursor: pointer;
}
</style>