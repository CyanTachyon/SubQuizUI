<script setup lang="ts">
import StatusButton from "../../components/StatusButton.vue";
import Card from "../../components/Card.vue";
import Text from "../../components/Text.vue";
import Input from "../../components/Input.vue";
import NotFound from "../NotFound.vue";
import Sidebar from "../../templates/sidebar/Sidebar.vue";
import Loading from "../../components/Loading.vue";
import type { Section } from "../../dataClasses/Section.ts";
import { ref } from "vue";
import { useRoute } from "vue-router";
import type { SectionId, SubjectId, SectionTypeId } from "../../dataClasses/Ids.ts";
import { getSection, getSectionType, modifySection, newSection, } from "../../networks/backend/section.ts";
import { getSubject } from "../../networks/backend/subject.ts";
import CommonButton from "../../components/CommonButton.vue";
import PlusIcon from "vue-material-design-icons/Plus.vue";
import MinusIcon from "vue-material-design-icons/Minus.vue";
import ContentSaveIcon from "vue-material-design-icons/ContentSave.vue";
import type { Question } from "../../dataClasses/Question.ts";
import { useRouter } from "vue-router";
function getName(index: number)
{
    if (!index) return 'A.';
    const base = 26;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '.';
    while (index > 0)
    {
        result = letters[index % base] + result;
        index = Math.floor(index / base);
    }
    return result;
}

const route = useRoute();
const router = useRouter();
const section = ref(null as Section<number, null, string> | null);
const notFound = ref(false);
const subjectName = ref('');
const typeName = ref('');

document.title = '编辑题目 - SubQuiz';

(async () => {
    if (route.params.id === 'new')
    {
        const subject = Number(route.query.subject) as SubjectId;
        const type = Number(route.query.type) as SectionTypeId;
        if (!subject || !type)
        {
            notFound.value = true;
            return;
        }
        section.value = {
            id: 0,
            subject: subject,
            type: type,
            description: '',
            questions: [],
        };
    }
    else
    {
        section.value = await getSection(Number(route.params.id) as SectionId);
    }

    if (section.value)
    {
        subjectName.value = await getSubject(section.value.subject).then(value => value.name);
        typeName.value = await getSectionType(section.value.type).then(value => value.name);
    }
})().catch(() => {
    notFound.value = true;
});

function addQuestion()
{
    section.value.questions.push({
        description: '',
        options: ['', '', '', ''],
        answer: 0,
        userAnswer: null,
        analysis: '',
    });
}

function setAnswer(questionIndex: number, optionIndex: number)
{
    section.value.questions[questionIndex].answer = optionIndex;
}

function addOption(questionIndex: number)
{
    section.value.questions[questionIndex].options.push('');
}

function deleteOption(questionIndex: number)
{
    section.value.questions[questionIndex].options.pop();
}

function deleteQuestion(questionIndex: number)
{
    section.value.questions.splice(questionIndex, 1);
}

let saving = ref(false);

function saveSection()
{
    (async () => {
        if (saving.value) return;
        saving.value = true;
        if (section.value.id === 0)
        {
            await newSection({
                subject: section.value.subject,
                type: section.value.type,
                description: section.value.description,
                questions: section.value.questions as Question<number, null, string>[],
            });
        }
        else
        {
            await modifySection(section.value as Section<number, null, string>);
        }
        router.push(`/admin/section/type/${section.value.type}`);
        
    })().catch(() => {
        saving.value = false;
    });
}

</script>

<template>
    <NotFound v-if="notFound"/>
    <Sidebar v-else>
        <Loading v-if="section === null || subjectName === '' || typeName === ''"/>
        <Card v-else class="section">
            <p class="main-title">{{ section.id === 0 ? '新建' : '编辑' }}题目</p>
            <p class="title">{{ `学科：${subjectName}` }}</p>
            <p class="title">{{ `类型：${typeName}` }}</p>
            <Text class="spacer"/>
            <p class="small-title">大题描述</p>
            <Input :area="true" placeholder="Section Description" type="text" v-model="section.description"/>
            <br/>
            <div v-for="(question, questionIndex) in section.questions" :key="questionIndex" class="question">
                <Text class="spacer"/>
                <div class="question-description">
                    <p class="title">
                        {{ questionIndex + 1 }}.
                    </p>
                    <Input :area="true" placeholder="Question Description" type="text" v-model="question.description"/>
                </div>
                <div v-for="(_, optionIndex) in question.options" :key="optionIndex" class="option-box">
                    <StatusButton class="title" @click="setAnswer(questionIndex, optionIndex)" :down="question.answer === optionIndex">{{ getName(optionIndex) }}</StatusButton>
                    <Input placeholder="Option Description" type="text" v-model="question.options[optionIndex]"/>
                </div>

                <div class="option-box">
                    <div class="button-box">
                        <CommonButton @click="addOption(questionIndex)" class="add-button"><PlusIcon/></CommonButton>
                        <CommonButton @click="deleteOption(questionIndex)" class="add-button"><MinusIcon/></CommonButton>
                    </div>
                </div>
                <p class="title">解析</p>
                <Input :area="true" placeholder="Analysis" type="text" v-model="question.analysis"/>
            </div>

            <Text class="spacer"/>
            <div class="button-box">
                <CommonButton @click="addQuestion" class="add-button"><PlusIcon/></CommonButton>
                <CommonButton @click="deleteQuestion" class="add-button"><MinusIcon/></CommonButton>
                <CommonButton @click="saveSection" class="add-button"><ContentSaveIcon/></CommonButton>
            </div>
        </Card>
    </Sidebar>
</template>

<style scoped lang="scss">

.main-title {
    margin: 10px;
    font-size: 20px;
    font-weight: bold;
}

.section {
    margin-top: 20px;
}

.small-title {
    margin: 10px;
    font-size: 16px;
}

.section-description {
    margin-top: 10px;
    margin-bottom: 5px;
    width: 80%;
}

.question {
    margin-left: 13px;
}

.question-description {
    display: flex;
    margin-top: 5px;
    margin-bottom: 5px;
    width: 60%;
}

.spacer {
    height: 1px;
    background-color: #000000;
    margin: 10px 0;
    opacity: 30%;
}

.title {
    margin: 10px;
    font-weight: bold;
}

.right-answer {
    color: green;
}

.wrong-answer {
    color: red;
}

.option-box {
    margin-left: 13px;
    display: flex;
    flex-direction: row;
}

.option {
    display: flex;
    width: 30%;
    text-align: left;
}

.analysis {
    margin-left: 13px;
    margin-bottom: 20px;
    width: 60%;
}

.button-box {
    display: flex;
    flex-direction: row;
}

.add-button {
    height: 48px;
    width: 50px;
    min-width: 50px;
    max-width: 50px;
    padding: 10px;
}
</style>