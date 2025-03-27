<script setup lang="ts">
import StatusButton from "../../components/StatusButton.vue";
import Card from "../../components/Card.vue";
import Input from "../../components/Input.vue";
import NotFound from "../NotFound.vue"
import Loading from "../../components/Loading.vue";
import type { Section } from "../../dataClasses/Section.ts";
import { ref } from "vue";
import { useRoute } from "vue-router";
import type { SectionId, SubjectId, SectionTypeId } from "../../dataClasses/Ids.ts";
import { deleteSection, getSection, getSectionType, modifySection, newSection, } from "../../networks/backend/section.ts";
import { getSubject } from "../../networks/backend/subject.ts";
import CommonButton from "../../components/CommonButton.vue";
import PlusIcon from "vue-material-design-icons/Plus.vue";
import MinusIcon from "vue-material-design-icons/Minus.vue";
import ContentSaveIcon from "vue-material-design-icons/ContentSave.vue";
import type { AnswerType, Question, QuestionType } from "../../dataClasses/Question.ts";
import { useRouter } from "vue-router";
import Spacer from "../../components/Spacer.vue";
import TrashCanIcon from "vue-material-design-icons/TrashCan.vue";
import CloseIcon from "vue-material-design-icons/Close.vue";
import CheckIcon from "vue-material-design-icons/Check.vue";
import HelpCircleOutlineIcon from "vue-material-design-icons/HelpCircleOutline.vue";
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
const section = ref(null as Section<AnswerType, null, string> | null);
const notFound = ref(false);
const subjectName = ref('');
const typeName = ref('');
const isNewSection = ref(false);

document.title = '编辑题目 - SubQuiz';

(async () => {
    if (route.params.id === 'new')
    {
        isNewSection.value = true;
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
        isNewSection.value = false;
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
        type: 'single',
    });
}

function setAnswer(questionIndex: number, answer: number | string | boolean)
{
    if (section.value.questions[questionIndex].type === 'single')
    {
        section.value.questions[questionIndex].answer = Number(answer);
    }
    else if (section.value.questions[questionIndex].type === 'multiple')
    {
        answer = Number(answer);
        if (!section.value.questions[questionIndex].answer)
        {
            section.value.questions[questionIndex].answer = [answer];
            return;
        }

        let answerArray = section.value.questions[questionIndex].answer as number[];
        if (answerArray.includes(answer))
        {
            answerArray = answerArray.filter(item => item !== answer);
        }
        else
        {
            answerArray.push(answer);
        }
        section.value.questions[questionIndex].answer = answerArray;
    }
    else if (section.value.questions[questionIndex].type === 'judge')
    {
        section.value.questions[questionIndex].answer = Boolean(answer);
    }
    else if (section.value.questions[questionIndex].type === 'fill' || section.value.questions[questionIndex].type === 'essay')
    {
        section.value.questions[questionIndex].answer = String(answer);
    }
}

function changeQuestionType(questionIndex: number)
{
    const type = section.value.questions[questionIndex].type;
    if (type === 'single') section.value.questions[questionIndex] = {
        description: section.value.questions[questionIndex].description,
        options: section.value.questions[questionIndex].options,
        answer: [],
        userAnswer: null,
        analysis: section.value.questions[questionIndex].analysis,
        type: 'multiple',
    }
    else if (type === 'multiple') section.value.questions[questionIndex] = {
        description: section.value.questions[questionIndex].description,
        options: null,
        answer: false,
        userAnswer: null,
        analysis: section.value.questions[questionIndex].analysis,
        type: 'judge',
    }
    else if (type === 'judge') section.value.questions[questionIndex] = {
        description: section.value.questions[questionIndex].description,
        options: null,
        answer: "",
        userAnswer: null,
        analysis: section.value.questions[questionIndex].analysis,
        type: 'fill',
    }
    else if (type === 'fill') section.value.questions[questionIndex] = {
        description: section.value.questions[questionIndex].description,
        options: null,
        answer: section.value.questions[questionIndex].answer,
        userAnswer: null,
        analysis: section.value.questions[questionIndex].analysis,
        type: 'essay',
    }
    else if (type === 'essay') section.value.questions[questionIndex] = {
        description: section.value.questions[questionIndex].description,
        options: ['', '', '', ''],
        answer: 0,
        userAnswer: null,
        analysis: section.value.questions[questionIndex].analysis,
        type: 'single',
    }
}

function getTypeName(type: QuestionType)
{
    switch (type)
    {
        case 'single': return '单选';
        case 'multiple': return '多选';
        case 'judge': return '判断';
        case 'fill': return '填空';
        case 'essay': return '简答';
    }
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
                questions: section.value.questions as Question<AnswerType, null, string>[],
            });
        }
        else
        {
            await modifySection(section.value as Section<AnswerType, null, string>);
        }
        router.push(`/admin/section/type/${section.value.type}`);
        
    })().catch(() => {
        saving.value = false;
    });
}

function deleteSection_()
{
    (async () => {
        await deleteSection(section.value.id);
        router.push(`/admin/section/type/${section.value.type}`);
    })().catch(() => {
        saving.value = false;
    });
}
</script>

<template>
    <NotFound v-if="notFound"/>
    <Loading v-else-if="section === null || subjectName === '' || typeName === ''" class="loading"/>
    <Card v-else class="section">
        <p class="main-title">{{ section.id === 0 ? '新建' : '编辑' }}题目</p>
        <p class="title">{{ `学科：${subjectName}` }}</p>
        <p class="title">{{ `类型：${typeName}` }}</p>
        <Spacer/>
        <p class="small-title">大题描述</p>
        <div style="display: flex;">
            <Input :area="true" placeholder="Section Description" type="text" v-model="section.description" class="section-description-input"/>
        </div>
        <br/>
        <div v-for="(question, questionIndex) in section.questions" :key="questionIndex" class="question">
            <Spacer style="margin-bottom: 10px; margin-top: 10px;"/>
            <div class="question-description">
                <p class="q-title">
                    {{ questionIndex + 1 }}.
                </p>
                <CommonButton 
                    @click="changeQuestionType(questionIndex)">
                    {{ getTypeName(question.type) }}
                </CommonButton>
            </div>
            <Input :area="true" placeholder="Question Description" type="text" v-model="question.description" class="question-description-input"/>

            <!-- 单选和多选 -->

            <div v-if="question.type === 'single' || question.type === 'multiple'" v-for="(_, optionIndex) in question.options" :key="optionIndex" class="option-box">
                <StatusButton 
                    class="option-title" 
                    @click="setAnswer(questionIndex, optionIndex)" 
                    :down="Array.isArray(question.answer) ? question.answer.includes(optionIndex) : question.answer === optionIndex"
                    :class="{ 'right-answer': Array.isArray(question.answer) ? question.answer.includes(optionIndex) : question.answer === optionIndex }"
                >
                    {{ getName(optionIndex) }}
                </StatusButton>
                <Input placeholder="Option Description" type="text" v-model="question.options[optionIndex]" class="option-input"/>
            </div>

            <div v-if="question.type === 'single' || question.type === 'multiple'" class="option-box">
                <div class="button-box">
                    <CommonButton @click="addOption(questionIndex)" class="add-button"><PlusIcon/></CommonButton>
                    <CommonButton @click="deleteOption(questionIndex)" class="add-button"><MinusIcon/></CommonButton>
                </div>
            </div>

            <!-- 判断 -->
            <div v-else-if="question.type === 'judge'" class="judge-option-box">
                <StatusButton 
                    class="judge-option" 
                    :down="question.answer === false" 
                    :class="{ 'right-answer': question.answer === false }"
                    @click="setAnswer(questionIndex, false)"
                >
                    <CloseIcon/>
                </StatusButton>
                <StatusButton 
                    class="judge-option" 
                    :down="question.answer === true" 
                    :class="{ 'right-answer': question.answer === true }"
                    @click="setAnswer(questionIndex, true)"
                >
                    <CheckIcon/>
                </StatusButton>
            </div>

            <!-- 填空/简答 -->
            <template v-else-if="question.type === 'fill' || question.type === 'essay'">
                <div class="title">
                    答案/评标
                    <span title="简答题和填空题将由AI判卷，因此请尽可能详细描述评分标准，以提高判卷的准确性。"><HelpCircleOutlineIcon/></span>
                </div>
                <div class="analysis-box">
                    <Input :area="true" placeholder="Answer" type="text" class="analysis-input" :value="question.answer" @input="setAnswer(questionIndex, $event.target.value)"/>
                </div>
            </template>

            <p class="title">解析</p>
            <div class="analysis-box">
                <Input :area="true" placeholder="Analysis" type="text" v-model="question.analysis" class="analysis-input"/>
            </div>
        </div>

        <Spacer style="margin-bottom: 10px; margin-top: 10px;"/>
        <div class="button-box">
            <CommonButton @click="addQuestion" class="add-button"><PlusIcon/></CommonButton>
            <CommonButton @click="deleteQuestion" class="add-button"><MinusIcon/></CommonButton>
            <StatusButton @click="saveSection" class="add-button"><ContentSaveIcon/></StatusButton>
            <StatusButton v-if="!isNewSection" @click="deleteSection_" class="add-button"><TrashCanIcon/></StatusButton>
        </div>
    </Card>
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

.question-description,
.analysis-box {
    display: flex;
    margin-top: 5px;
    margin-bottom: 5px;
}

.section-description-input,
.question-description-input,
.analysis-input {
    width: 60%;
    height: 100px;
}

.title {
    margin: 10px;
    font-weight: bold;
}

.q-title {
    margin: 10px;
    font-weight: bold;
    height: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.right-answer {
    color: green;
    transition: color 0.4s ease;
}

.option-box {
    margin-left: 13px;
    display: flex;
    flex-direction: row;
    .option-title {
        margin: 10px;
        font-weight: bold;
        width: 50px;
        display: flex;
        justify-content: center;
        align-items: center;
    }
}

.judge-option-box {
    display: flex;
    flex-direction: row;

    .judge-option {
        height: 45px;
        width: 45px;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
    }
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