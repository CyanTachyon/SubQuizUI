<script setup lang="ts">

import {useRouter} from "vue-router";
import {ref} from "vue";
import Card from "../../components/Card.vue";
import {modifySubject, newSubject} from "../../networks/backend/subject.ts";
import Button from "../../components/Button.vue";
import {useUser} from "../../stores/user.ts";
import NotFound from "../NotFound.vue";
import Input from "../../components/Input.vue";
import { useNotification } from "../../stores/notification.ts";
import { useRoute } from "vue-router";
import type { SubjectId } from "../../dataClasses/Ids.ts";
import { getSubject } from "../../networks/backend/subject.ts";
import Loading from "../../components/Loading.vue";
import type { Subject } from "../../dataClasses/Subject.ts";
const user = useUser();
const route = useRoute();
const subjectName = ref('');
const subjectDescription = ref('');
const router = useRouter();
const notification = useNotification();
const submitted = ref(false);
const notFound = ref(false);
let subject: SubjectId | null;
const subjectInfo = ref(null as null | Subject);

document.title = '编辑学科 - SubQuiz';

if (route.params.id === 'new') subject = null;
else 
{
    const id = Number(route.params.id) as SubjectId;
    if (!id) notFound.value = true;
    else subject = id;
}

if (subject !== null) getSubject(subject).then(value => {
    subjectInfo.value = value;
    subjectName.value = value.name;
    subjectDescription.value = value.description;
}, () => {
    subjectName.value = '';
    subjectDescription.value = '';
    notFound.value = true;
});

function submit()
{
    if (submitted.value) return;
    submitted.value = true;
    if (subjectName.value === '')
    {
        notification.addError('学科名称不能为空');
        return;
    }
    if (subject === null)
    {
        newSubject(subjectName.value, subjectDescription.value).then(subject => router.push(`/admin/subject/${subject}`), () => submitted.value = false);
    }
    else
    {
        modifySubject(subject, subjectName.value, subjectDescription.value).then(() => router.push(`/admin/subject/${subject}`), () => submitted.value = false);
    }
}
</script>

<template>
    <NotFound v-if="!user.hasAdmin() || notFound"/>
    <Loading v-else-if="subject !== null && subjectInfo === null" class="loading"/>
    <div v-else class="container">
        <Card>
            <p v-if="subject !== null">ID: {{ subject }}</p>
            <p class="main-title">{{ subject === null ? '创建新学科' : '编辑学科' }}</p>
            <p class="title">学科名称</p>
            <Input :area="false" placeholder="Subject Name" type="text" v-model="subjectName"/>
            <p class="title">学科描述</p>
            <Input :area="true" placeholder="Subject Description" type="text" v-model="subjectDescription" class="description"/>
            <Button @click="submit">{{ subject === null ? '创建学科' : '保存编辑' }}</Button>
        </Card>
    </div>
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