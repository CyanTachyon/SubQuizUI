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
import CheckboxMarkedCircleOutline from "vue-material-design-icons/CheckboxMarkedCircleOutline.vue";
import CloseIcon from "vue-material-design-icons/Close.vue";
import CheckIcon from "vue-material-design-icons/Check.vue";
import { useNotificationStore } from "../stores/notification.ts";
const {quiz, editable, submit} = defineProps<{ quiz: Quiz<any, any, any>, editable: boolean, submit?: () => void }>();

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
    let q = quiz.sections[sectionIndex].questions[questionIndex];
    if (q.type === 'single')
    {
        q.userAnswer = optionIndex;
    }
    else if (q.type === 'multiple')
    {
        if (!q.userAnswer)
        {
            q.userAnswer = [optionIndex];
        }
        else if (q.userAnswer.includes(optionIndex))
        {
            q.userAnswer = q.userAnswer.filter((it: number) => it !== optionIndex);
        }
        else
        {
            q.userAnswer.push(optionIndex);
        }

        if (!q.userAnswer.length) q.userAnswer = null;
    }
    else if (q.type === 'judge')
    {
        q.userAnswer = optionIndex === 1 ? true : false;
    }
}

function fillAnswer(sectionIndex: number, questionIndex: number, answer: string)
{
    if (!editable) return;
    if (answer.trim() === '')
    {
        quiz.sections[sectionIndex].questions[questionIndex].userAnswer = null;
    }
    else
    {
        quiz.sections[sectionIndex].questions[questionIndex].userAnswer = answer;
    }
}

function rightAnswer(sectionIndex: number, questionIndex: number)
{
    return quiz.correct?.[sectionIndex]?.[questionIndex];
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

function trySubmit()
{
    if (!submit) return;
    // 检查是否所有题目都已作答
    for (const [index, section] of quiz.sections.entries())
    {
        for (const [questionIndex, question] of section.questions.entries())
        {
            if (question.userAnswer == null)
            {
                // 获取未完成题目的索引
                const incompleteSection = index;
                const incompleteQuestion = questionIndex;
                
                console.log(incompleteSection, incompleteQuestion);
                // 使用DOM选择器找到对应的题目元素
                const questionElement = document.querySelector(`#q-${incompleteSection}-${incompleteQuestion}`);
                
                if (questionElement) 
                {
                    // 平滑滚动到未完成的题目
                    questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    useNotificationStore().add({
                        message: '请完成所有题目后再提交',
                        type: 'warning'
                    });
                }
                
                return;
            }
        }
    }
    submit();
}
</script>

<template>
    <Loading v-if="loading" class="loading"/>
    <template v-else>
        <Card v-for="(section, sectionIndex) in quiz.sections" class="section">
            <div class="section-info">
                <p class="title">
                    {{ `学科：${subjectNames.get(section.subject)} 类型：${sectionTypeNames.get(section.type)}` }}
                </p>
                <br/>
            </div>
            <div class="section-description-wrapper" v-if="section.description">
                <Input :area="true" placeholder="Section Description" type="text" v-model="section.description" class="section-description-input" disabled/>
            </div>
            <br/>
            <Spacer/>
            <br/>
            <div v-for="(question, questionIndex) in section.questions" :id="`q-${sectionIndex}-${questionIndex}`" class="question">
                <div class="question-description">
                    <p class="title">
                        {{ questionIndex + 1 }}.
                    </p>
                    {{ question.description }}
                </div>
                <div v-if="question.options" v-for="(option, optionIndex) in question.options" class="option-box">
                    <StatusButton 
                        class="option" 
                        :down="question.userAnswer === optionIndex || (question.userAnswer?.length && question.userAnswer.includes(optionIndex))"
                        @click="onOptionClick(sectionIndex, questionIndex, optionIndex)"
                        :class="{ 
                            'choice-answer': question.userAnswer === optionIndex || (question.userAnswer?.length && question.userAnswer.includes(optionIndex)),
                            'default-answer': !(question.userAnswer === optionIndex || (question.userAnswer?.length && question.userAnswer.includes(optionIndex)))
                        }"
                    >
                        <div class="option-title" style="height: 100%;">
                            {{ getName(optionIndex) }}
                        </div>
                        {{ option }}
                    </StatusButton>
                    <Text 
                        v-if="optionIndex === question.answer || (question.answer?.length && question.answer.includes(optionIndex))" 
                        class="right-answer"
                        style="margin-top: 17px;"
                    >
                        <CheckboxMarkedCircleOutline/>
                    </Text>
                </div>
                <div v-else-if="question.type === 'judge'" class="judge-option-box">
                    <StatusButton 
                        class="judge-option" 
                        :down="question.userAnswer === false" 
                        :class="{ 'choice-answer': question.userAnswer === false }"
                        @click="onOptionClick(sectionIndex, questionIndex, 0)"
                    >
                        <CloseIcon/>
                    </StatusButton>
                    <StatusButton 
                        class="judge-option" 
                        :down="question.userAnswer === true" 
                        :class="{ 'choice-answer': question.userAnswer === true }"
                        @click="onOptionClick(sectionIndex, questionIndex, 1)"
                    >
                        <CheckIcon/>
                    </StatusButton>
                </div>
                <div v-else-if="question.type === 'fill'" class="option-box">
                    <Input :area="false" placeholder="请输入答案" type="text" :value="question.userAnswer" @input="fillAnswer(sectionIndex, questionIndex, $event.target.value)" class="fill-option-input" :disabled="!editable"/>
                </div>
                <div v-else-if="question.type === 'essay'">
                    <Input :area="true" placeholder="请输入答案" type="text" :value="question.userAnswer" @input="fillAnswer(sectionIndex, questionIndex, $event.target.value)" class="essay-option-input" :disabled="!editable"/>
                </div>
                <Text v-if="rightAnswer(sectionIndex, questionIndex) !== undefined" class="analysis" :class="rightAnswer(sectionIndex, questionIndex) ? 'right-answer' : 'wrong-answer'">
                    {{ 
                        '结果：' + (
                            rightAnswer(sectionIndex, questionIndex) === true ? '正确' : 
                            rightAnswer(sectionIndex, questionIndex) === false ? '错误' : 
                            '判定失败'
                        ) 
                    }}
                    {{ question.type === 'fill' || question.type === 'essay' ? '*AI' : '' }}
                </Text>
                <Text v-if="(question.type === 'fill' || question.type === 'essay') && question.answer" class="answer analysis">
                    {{ '答案/评标：\n' + question.answer }}
                </Text>
                <Text 
                    v-if="question.analysis" 
                    class="analysis"
                >
                    {{ '解析：\n' + question.analysis }}
                </Text>
                <br v-if="questionIndex < section.questions.length - 1"/>
            </div>
        </Card>
        <StatusButton v-if="editable" class="submit" @click="trySubmit">Submit</StatusButton>
    </template>
</template>

<style scoped lang="scss">
.section {
    margin-top: 20px;
}

.section-info {
    margin-top: 10px;
    margin-left: 13px;
    margin-bottom: 5px;
}

.section-description-wrapper {
    background: var(--bgcolor);
    display: flex;
    position: -webkit-sticky;
    position: sticky;
    top: 0;
    
    .section-description-input {
        width: 100%;
        height: calc(min(300px, fit-content));
        line-height: 1.5;
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
    color: #EF3040;
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

.fill-option-input {
    width: 30%;
    max-width: 30%;
    white-space: pre-wrap;
}

.essay-option-input {
    width: 60%;
    white-space: pre-wrap;
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

.analysis {
    margin-left: 13px;
    margin-bottom: 20px;
    width: 60%;
    white-space: pre-wrap;
}

.loading {
    position: relative;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    height: 20%;
    width: 30%;
}

.submit {
    display: block;
    margin: 20px auto;
}
</style>