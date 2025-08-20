<script setup lang="tsx">
import type {Quiz} from "../dataClasses/Quiz.ts";
import Button from "../components/Button.vue";
import Card from "../components/Card.vue";
import Text from "../components/Text.vue";
import Spacer from "../components/Spacer.vue";
import Input from "../components/Input.vue";
import CheckboxMarkedCircleOutline from "vue-material-design-icons/CheckboxMarkedCircleOutline.vue";
import CloseCircleOutlineIcon from "vue-material-design-icons/CloseCircleOutline.vue";
import CloseIcon from "vue-material-design-icons/Close.vue";
import CheckIcon from "vue-material-design-icons/Check.vue";
import { useNotification } from "../stores/notification.ts";
import { getOptionName, richtextToString } from "../utils/utils";
import { useRouter } from "vue-router";
import ResizableWrapper from "@src/components/ResizableWrapper.vue";
import Editor from "./Editor.vue";

const router = useRouter();

const { quiz, editable, ai, submit } = defineProps<{ 
    quiz: Pick<Quiz<any, any, any>, 'sections' | 'correct'>, 
    editable: boolean, 
    ai?: boolean, 
    submit?: () => void; 
}>();


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
                // 使用DOM选择器找到对应的题目元素
                const questionElement = document.querySelector(`#q-${incompleteSection}-${incompleteQuestion}`);
                
                if (questionElement) 
                {
                    // 平滑滚动到未完成的题目
                    questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    useNotification().add({
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

function gotoAI(sectionIndex: number)
{
    if (!ai) return;
    const section = quiz.sections[sectionIndex];
    if (section.questions.length === 0)
    {
        useNotification().add({
            message: '该部分没有题目，无法使用AI',
            type: 'warning'
        });
        return;
    }

    router.push({
        path: '/ai/chat',
        state: {
            section: JSON.parse(JSON.stringify(section)),
        }
    })
}

</script>

<template>
    <Card v-for="(section, sectionIndex) in quiz.sections" class="section" :key="sectionIndex">
        <div style="width: 1px; height: 10px;"/>
        <ResizableWrapper v-if="richtextToString(section.description)" class="section-description" height-resizable>
            <Editor v-model="section.description" :editable="false" :section="section.id"/>
        </ResizableWrapper>
        <Spacer v-if="richtextToString(section.description)" style="margin-bottom: 10px;"/>
        <div v-for="(question, questionIndex) in section.questions" :id="`q-${sectionIndex}-${questionIndex}`" class="question">
            <div class="question-description">
                <p class="title">
                    {{ questionIndex + 1 }}.
                </p>
                <div style="flex-grow: 1;">
                    <Editor v-model="question.description" :editable="false" :section="section.id"/>
                </div>
            </div>
            <div v-if="question.options" class="options-wrapper">
                <div v-for="(option, optionIndex) in question.options" class="option-box">
                    <Button 
                        class="option" 
                        :down="question.userAnswer === optionIndex || (question.userAnswer?.length && question.userAnswer.includes(optionIndex))"
                        @click="onOptionClick(sectionIndex, questionIndex, optionIndex)"
                        :class="{ 
                            'choice-answer': question.userAnswer === optionIndex || (question.userAnswer?.length && question.userAnswer.includes(optionIndex)),
                            'default-answer': !(question.userAnswer === optionIndex || (question.userAnswer?.length && question.userAnswer.includes(optionIndex)))
                        }"
                        :disabled="!editable"
                    >
                        <div class="option-title" style="height: 100%;">
                            {{ getOptionName(optionIndex) }}
                        </div>
                        <div>
                            <Editor :model-value="option" :editable="false" :section="section.id"/>
                        </div>
                    </Button>
                    <Text 
                        v-if="optionIndex === question.answer || (question.answer?.length && question.answer.includes(optionIndex))" 
                        class="right-answer"
                        style="margin-top: 17px;"
                    >
                        <CheckboxMarkedCircleOutline/>
                    </Text>
                    <Text 
                        v-else-if="question.answer !== null"
                        class="wrong-answer"
                        style="margin-top: 17px;"
                    >
                        <CloseCircleOutlineIcon/>
                    </Text>
                </div>
            </div>
            <div v-else-if="question.type === 'judge'" class="judge-option-box">
                <Button 
                    class="judge-option" 
                    :down="question.userAnswer === false" 
                    :class="{ 'choice-answer': question.userAnswer === false }"
                    @click="onOptionClick(sectionIndex, questionIndex, 0)"
                    :disabled="!editable"
                >
                    <CloseIcon/>
                </Button>
                <Button 
                    class="judge-option" 
                    :down="question.userAnswer === true" 
                    :class="{ 'choice-answer': question.userAnswer === true }"
                    @click="onOptionClick(sectionIndex, questionIndex, 1)"
                    :disabled="!editable"
                >
                    <CheckIcon/>
                </Button>
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
                {{ '答案/评标：' }}
                <div>
                    <Editor :model-value="question.answer" :editable="false" :section="section.id"/>
                </div>
            </Text>
            <Text 
                v-if="question.analysis" 
                class="analysis"
            >
                {{ '解析：' }}
                <div>
                    <Editor :model-value="question.analysis" :editable="false" :section="section.id"/>
                </div>
            </Text>
            <br v-if="questionIndex < section.questions.length - 1"/>
        </div>
        <Button v-if="ai" class="ai" @click="gotoAI(sectionIndex)">AI</Button>
    </Card>
    <Button v-if="editable" class="submit" @click="trySubmit">Submit</Button>
</template>

<style scoped lang="scss">
.section {
    margin-top: 20px;
}

.section-description {
    z-index: 1;
    height: 300px;
    padding: 10px;
    width: 100%;
}

.question-description {
    display: flex;
    margin-top: 5px;
    margin-left: 13px;
    margin-bottom: 5px;
    white-space: pre-wrap;

    .question-description-content {
        display: flex;
    }
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

.options-wrapper {
    display: flex;
    flex-wrap: wrap;
    column-gap: 20px;

    .option-box {
        display: flex;
        flex-direction: row;
        width: fit-content;

        .option {
            display: flex;
            text-align: left;
            white-space: pre-wrap;

            .option-title {
                top: 0;
                margin: 0 10px 0 0;
                font-weight: bold;
                width: 30px;
                display: flex;
            }

            .option-content {
                flex-grow: 1;
            }
        }
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



.submit {
    display: block;
    margin: 20px auto;
}

.ai {
    background-color: var(--bgcolor);
    position: -webkit-sticky;
    position: sticky;
    bottom: 1rem;
    right: 0;
    margin-left: auto;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>