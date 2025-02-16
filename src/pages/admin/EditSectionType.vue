<script setup lang="ts">

import Sidebar from "../../templates/sidebar/Sidebar.vue";
import {useRouter} from "vue-router";
import {ref} from "vue";
import Card from "../../components/Card.vue";
import StatusButton from "../../components/StatusButton.vue";
import {useUser} from "../../stores/user.ts";
import NotFound from "../NotFound.vue";
import Input from "../../components/Input.vue";
import { useNotificationStore } from "../../stores/notification.ts";
import { getSectionType, modifySectionType, newSectionType } from "../../networks/backend/section.ts";
import type { SubjectId } from "../../dataClasses/Ids.ts";
import { useRoute } from "vue-router";
import type { Subject } from "../../dataClasses/Subject.ts";
import { getSubject } from "../../networks/backend/subject.ts";
import Loading from "../../components/Loading.vue";
import { getUserPermissionInSubject } from "../../networks/backend/admin.ts";
import { isAdmin } from "../../dataClasses/Permission.ts";
import type { SectionTypeId } from "../../dataClasses/Ids.ts";
import type { SectionType } from "../../dataClasses/SectionType.ts";

const route = useRoute();
const user = useUser();
const sectionTypeName = ref('');
const sectionTypeDescription = ref('');
const router = useRouter();
const notification = useNotificationStore();
const submited = ref(false);
const notFound = ref(false);
const subject = Number(route.query.subject) as SubjectId;
const subjectInfo = ref(void 0 as undefined | null | Subject);
const hasPermission = ref(undefined as undefined | boolean);
let sectionType: SectionTypeId | null;
const sectionTypeInfo = ref(null as null | SectionType);

document.title = '编辑题目类型 - SubQuiz';

if (route.params.id === 'new') sectionType = null;
else 
{
    const id = Number(route.params.id) as SubjectId;
    if (!id) notFound.value = true;
    else sectionType = id;
}

if (sectionType !== null) getSectionType(sectionType).then(value => {
    sectionTypeInfo.value = value;
    sectionTypeName.value = value.name;
    sectionTypeDescription.value = value.description;
}, () => {
    sectionTypeName.value = '';
    sectionTypeDescription.value = '';
    notFound.value = true;
});

getSubject(subject).then(value => subjectInfo.value = value, () => subjectInfo.value = null);
if (!user.hasAdmin()) getUserPermissionInSubject(subject, 0).then(value => hasPermission.value = isAdmin(value), () => hasPermission.value = false);
else hasPermission.value = true;

function submit()
{
    if (submited.value) return;
    submited.value = true;
    if (sectionTypeName.value === '')
    {
        notification.addError('题目类型名称不能为空');
        return;
    }
    if (sectionType === null)
    {
        newSectionType(subject, sectionTypeName.value, sectionTypeDescription.value)
            .then(sectionType => router.push(`/admin/section/type/${sectionType}`), () => submited.value = false);
    }
    else
    {
        modifySectionType(sectionType, subject, sectionTypeName.value, sectionTypeDescription.value)
            .then(() => router.push(`/admin/section/type/${sectionType}`), () => submited.value = false);
    }
}
</script>

<template>
    <NotFound v-if="subjectInfo === null || hasPermission === false || notFound"/>
    <Sidebar v-else>
        <Loading v-if="subjectInfo === undefined || (sectionType !== null && sectionTypeInfo === null)"/>
        <div class="container" v-else>
            <Card>

                <p class="main-title">{{ sectionType === null ? '创建新题目类型' : '编辑题目类型' }}</p>
                <p class="title">所属学科</p>
                <Input :area="false" placeholder="Subject Name" type="text" v-model="subjectInfo.name" disabled/>
                <p class="title">题目类型名称</p>
                <Input :area="false" placeholder="Section Type Name" type="text" v-model="sectionTypeName"/>
                <p class="title">题目类型描述</p>
                <Input :area="true" placeholder="Section Type Description" type="text" v-model="sectionTypeDescription" class="description"/>
                <StatusButton @click="submit">{{ sectionType === null ? '创建题目类型' : '编辑题目类型' }}</StatusButton>
            </Card>
        </div>
    </Sidebar>
</template>

<style scoped lang="scss">

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
</style>