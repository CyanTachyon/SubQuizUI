<script setup lang="ts">

import {useRouter} from "vue-router";
import {ref} from "vue";
import Card from "../../components/Card.vue";
import StatusButton from "../../components/StatusButton.vue";
import {useUser} from "../../stores/user.ts";
import NotFound from "../NotFound.vue";
import Input from "../../components/Input.vue";
import { useNotification } from "../../stores/notification.ts";
import type { PreparationGroupId, SubjectId } from "../../dataClasses/Ids.ts";
import { useRoute } from "vue-router";
import type { Subject } from "../../dataClasses/Subject.ts";
import { getSubject } from "../../networks/backend/subject.ts";
import Loading from "../../components/Loading.vue";
import type { PreparationGroup } from "../../dataClasses/PreparationGroup.ts";
import { createPreparationGroup, getPreparationGroup, updatePreparationGroup } from "../../networks/backend/preparationGroup.ts";

const route = useRoute();
const user = useUser();
const groupName = ref('');
const groupDescription = ref('');
const router = useRouter();
const notification = useNotification();
const submitted = ref(false);
const notFound = ref(false);
const subject = Number(route.query.subject) as SubjectId;
const subjectInfo = ref(void 0 as undefined | null | Subject);
const hasPermission = ref(undefined as undefined | boolean);
let group: PreparationGroupId | null;
const groupInfo = ref(null as null | PreparationGroup);

document.title = '编辑备课组 - SubQuiz';

if (route.params.id === 'new') group = null;
else 
{
    const id = Number(route.params.id) as SubjectId;
    if (!id) notFound.value = true;
    else group = id;
}

if (group !== null) getPreparationGroup(group).then(value => {
    groupInfo.value = value;
    groupName.value = value.name;
    groupDescription.value = value.description;
}, () => {
    groupName.value = '';
    groupDescription.value = '';
    notFound.value = true;
});

getSubject(subject).then(value => subjectInfo.value = value, () => subjectInfo.value = null);
if (!user.hasAdmin()) hasPermission.value = false;
else hasPermission.value = true;

function submit()
{
    if (submitted.value) return;
    submitted.value = true;
    if (groupName.value === '')
    {
        notification.addError('备课组名称不能为空');
        return;
    }
    if (group === null)
    {
        createPreparationGroup({
            subject, 
            name: groupName.value, 
            description: groupDescription.value
        }).then(group => router.push(`/admin/group/${group}`), () => submitted.value = false);
    }
    else
    {
        updatePreparationGroup({
            id: group,
            subject,
            name: groupName.value,
            description: groupDescription.value
        }).then(() => router.push(`/admin/group/${group}`), () => submitted.value = false);
    }
}
</script>

<template>
    <NotFound v-if="subjectInfo === null || hasPermission === false || notFound"/>
    <Loading v-else-if="subjectInfo === undefined || (group !== null && groupInfo === null)" class="loading"/>
    <div v-else class="container">
        <Card>
            <p class="main-title">{{ group === null ? '创建新备课组' : '编辑备课组信息' }}</p>
            <p class="title">所属学科</p>
            <Input :area="false" placeholder="Subject Name" type="text" v-model="subjectInfo.name" disabled/>
            <p class="title">备课组名称</p>
            <Input :area="false" placeholder="Preparation Group Name" type="text" v-model="groupName"/>
            <p class="title">备课组描述</p>
            <Input :area="true" placeholder="Preparation Group Description" type="text" v-model="groupDescription" class="description"/>
            <StatusButton @click="submit">{{ group === null ? '创建备课组' : '编辑备课组' }}</StatusButton>
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
</style>