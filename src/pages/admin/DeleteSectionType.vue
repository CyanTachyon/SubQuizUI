<script setup lang="ts">
import NotFound from "../NotFound.vue";
import Loading from "../../components/Loading.vue";
import Card from "../../components/Card.vue";
import Input from "../../components/Input.vue";
import StatusButton from "../../components/StatusButton.vue";
import { useRoute } from "vue-router";
import type { SectionTypeId } from "../../dataClasses/Ids.ts";
import type { SectionType } from "../../dataClasses/SectionType.ts";
import { ref } from "vue";
import { getSectionType, deleteSectionType} from "../../networks/backend/section.ts";
import type { Subject } from "../../dataClasses/Subject.ts";
import { getSubject } from "../../networks/backend/subject.ts";
import Text from "../../components/Text.vue";
import { useRouter } from "vue-router";
import { useNotificationStore } from "../../stores/notification.ts";
import Spacer from "../../components/Spacer.vue";
const route = useRoute();
const router = useRouter();
const notification = useNotificationStore();
const sectionType = Number(route.params.id) as SectionTypeId;
const sectionTypeInfo = ref(void 0 as undefined | null | SectionType);
const subjectInfo = ref(void 0 as undefined | null | Subject);

document.title = '删除题目类型 - SubQuiz';

(async () => {
    sectionTypeInfo.value = await getSectionType(sectionType);
    subjectInfo.value = await getSubject(sectionTypeInfo.value.subject);
})().catch(() => {
    sectionTypeInfo.value = null;
    subjectInfo.value = null;
});

function onDelete()
{
    deleteSectionType(sectionType).then(() => router.push(`/admin/subject/${sectionTypeInfo.value.subject}`), () => notification.addError('删除失败'));
}

function goBack()
{
    router.back();
}
</script>

<template>
    <NotFound v-if="sectionTypeInfo === null"/>
    <Loading v-else-if="sectionTypeInfo === undefined || subjectInfo === undefined" class="loading"/>
    <div v-else class="container">
        <Card>

            <p class="main-title">删除题目类型</p>
            <p class="title">所属学科</p>
            <Input :area="false" placeholder="Subject Name" type="text" v-model="subjectInfo.name" class="input" disabled/>
            <p class="title">题目类型名称</p>
            <Input :area="false" placeholder="Section Type Name" type="text" v-model="sectionTypeInfo.name" class="input" disabled/>
            <p class="title">题目类型描述</p>
            <Input :area="true" placeholder="Section Type Description" type="text" v-model="sectionTypeInfo.description" class="description" disabled/>
            <Text class="warning title">删除该题目类型后，所有与该题目类型相关的题目将被删除，请谨慎操作</Text>
            <Spacer/>
            <div class="button-container">
                <StatusButton @click="goBack" :down="false">返回</StatusButton>
                <StatusButton @click="onDelete" :down="false">确认删除</StatusButton>
            </div>
        </Card>
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

.container {
    display: flex;
    height: 100%;
    width: 100%;
    justify-content: center;
    align-items: center;
}

.title {
    margin: 10px;
}

.description {
    width: 400px;
    height: 200px;
}

.main-title {
    font-size: 1.5em;
    font-weight: bold;
    text-align: center;
    margin: 20px 0;
}

.warning {
    color: red;
}

.button-container {
    display: flex;
    margin-top: 20px;
    gap: 20px;
    flex-direction: row;
    align-items: center;
}
</style>