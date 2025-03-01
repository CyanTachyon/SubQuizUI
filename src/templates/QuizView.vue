<script setup lang="ts">
import type {Quiz} from "../dataClasses/Quiz.ts";
import type { SectionTypeId, SubjectId } from "../dataClasses/Ids.ts";
import StatusButton from "../components/StatusButton.vue";
import Card from "../components/Card.vue";
import Text from "../components/Text.vue";
import { ref } from "vue";
import Loading from "../components/Loading.vue";
import { getSubject } from "../networks/backend/subject.ts";
import { getSectionType } from "../networks/backend/section.ts";
import Spacer from "../components/Spacer.vue";
import Input from "../components/Input.vue";
const {quiz, editable} = defineProps<{ quiz: Quiz<any, any, any>, editable: boolean }>();

const subjectNames = ref(new Map<SubjectId, string>());
const sectionTypeNames = ref(new Map<SectionTypeId, string>());
const loading = ref(true);

function init(): Promise<any>
{
    let promises = [];
    for (const section of quiz.sections)
    {
        if (!subjectNames.value.has(section.subject))
        {
            promises.push(getSubject(section.subject).then(value => subjectNames.value.set(section.subject, value.name)));
        }
        if (!sectionTypeNames.value.has(section.type))
        {
            promises.push(getSectionType(section.type).then(value => sectionTypeNames.value.set(section.type, value.name)));
        }
    }
    return Promise.all(promises);
}

init().then(() => {
    loading.value = false;
});


function onOptionClick(sectionIndex: number, questionIndex: number, optionIndex: number)
{
    if (!editable) return;
    quiz.sections[sectionIndex].questions[questionIndex].userAnswer = optionIndex;
}

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

</script>

<template>
    <Loading v-if="loading" class="loading"/>
    <Card v-else v-for="(section, sectionIndex) in quiz.sections" class="section">
        <div class="section-description">
            <p class="title">
                {{ `学科：${subjectNames.get(section.subject)} 类型：${sectionTypeNames.get(section.type)}` }}
            </p>
            <br/>
            <div class="section-description-wrapper">
                <Input :area="true" placeholder="Section Description" type="text" v-model="section.description" class="section-description-input" disabled/>
            </div>
        </div>
        <br/>
        <Spacer/>
        <br/>
        <div v-for="(question, questionIndex) in section.questions" class="question">
            <div class="question-description">
                <p class="title">
                    {{ questionIndex + 1 }}.
                </p>
                {{ question.description }}
            </div>
            <div v-for="(option, optionIndex) in question.options" class="option-box">
                <StatusButton class="option" :down="question.userAnswer === optionIndex"
                              @click="onOptionClick(sectionIndex, questionIndex, optionIndex)"
                              :class="{ 
                                'right-answer': optionIndex === question.answer, 
                                'wrong-answer': question.userAnswer === optionIndex && question.userAnswer !== question.answer && question.answer !== null,
                                'choice-answer': question.userAnswer === optionIndex && question.answer === null,
                                'default-answer': question.userAnswer === null || question.userAnswer !== optionIndex && optionIndex !== question.answer
                              }"
                >
                    <div class="option-title" style="height: 100%;">
                        {{ getName(optionIndex) }}
                    </div>
                    {{ option }}
                </StatusButton>
            </div>
            <Text 
                v-if="question.analysis" 
                class="analysis"
                :class="question.userAnswer===question.answer ? 'right-answer' : 'wrong-answer'"
            >
                {{ '解析：' + question.analysis }}
            </Text>
            <br v-if="questionIndex < section.questions.length - 1"/>
        </div>
    </Card>
</template>

<style scoped lang="scss">
.section {
    margin-top: 20px;
}

.section-description {
    margin-top: 10px;
    margin-left: 13px;
    margin-bottom: 5px;

    .section-description-wrapper {
        display: flex;
     
        .section-description-input {
            width: 60%;
            height: 500px;
            line-height: 1.5;
        }
    }
}

.question-description {
    display: flex;
    margin-top: 5px;
    margin-left: 13px;
    margin-bottom: 5px;
    width: 60%;
    white-space: pre-wrap;
}

.title {
    top: 0;
    margin: 0 10px 0 0;
    font-weight: bold;
}

$answer-color-duration: 0.4s;

.right-answer {
    color: green;
    transition: color $answer-color-duration ease;
}

.wrong-answer {
    color: red;
    transition: color $answer-color-duration ease;
}

.choice-answer {
    color: #0170D2;
    transition: color $answer-color-duration ease;
}

.default-answer {
    color: var(--color);
    transition: color $answer-color-duration ease;
}

.option-box {
    display: flex;
    flex-direction: row;
}

.option {
    display: flex;
    width: 30%;
    max-width: 30%;
    text-align: left;
    white-space: pre-wrap;

    .option-title {
        top: 0;
        margin: 0 10px 0 0;
        font-weight: bold;
        width: 30px;
        display: flex;
    }
}

.analysis {
    margin-left: 13px;
    margin-bottom: 20px;
    width: 60%;
}

.loading {
    position: relative;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    height: 20%;
    width: 30%;
}
</style>