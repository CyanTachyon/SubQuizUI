<script setup lang="tsx">
import Button from "../../components/Button.vue";
import Card from "../../components/Card.vue";
import Input from "../../components/Input.vue";
import NotFound from "../NotFound.vue"
import Loading from "../../components/Loading.vue";
import type { Section } from "../../dataClasses/Section.ts";
import { ref } from "vue";
import { useRoute } from "vue-router";
import type { SectionId, SectionTypeId } from "../../dataClasses/Ids.ts";
import { deleteSection, getSection, getSectionType, modifySection, newSection, } from "../../networks/backend/section.ts";
import PlusIcon from "vue-material-design-icons/Plus.vue";
import ContentSaveIcon from "vue-material-design-icons/ContentSave.vue";
import type { AnswerType, QuestionType } from "../../dataClasses/Question.ts";
import { useRouter } from "vue-router";
import Spacer from "../../components/Spacer.vue";
import TrashCanIcon from "vue-material-design-icons/TrashCan.vue";
import CloseIcon from "vue-material-design-icons/Close.vue";
import CheckIcon from "vue-material-design-icons/Check.vue";
import HelpCircleOutlineIcon from "vue-material-design-icons/HelpCircleOutline.vue";
import Switch from "../../components/Switch.vue";
import QuizView from "../../templates/QuizView.vue";
import { dialog, getOptionName, pushUrl } from "../../utils/utils.tsx";
import Slider from "../../components/Slider.vue";
import type { SectionType } from "../../dataClasses/SectionType.ts";
import { getKnowledgePoint } from "../../networks/backend/knowledgePoint.ts";
import type { KnowledgePoint } from "../../dataClasses/KnowledgePoint.ts";
import Editor from "@src/templates/Editor.vue";
import ResizableWrapper from "@src/components/ResizableWrapper.vue";
import SelectMenu from "@src/components/SelectMenu.vue";

const route = useRoute();
const router = useRouter();
const section = ref(null as Section<AnswerType, null, string> | null);
const notFound = ref(false);
const sectionTypeInfo = ref(null as null | SectionType);
const kpInfo = ref(null as null | KnowledgePoint);

document.title = '编辑题目 - SubQuiz';

(async () => 
{
    if (route.params.id === 'new')
    {
        const type = Number(route.query.type) as SectionTypeId;
        if (!type)
        {
            notFound.value = true;
            return;
        }
        let section_: Section<AnswerType, null, string> = {
            id: 0,
            type: type,
            description: '',
            weight: 50,
            available: false,
            questions: [],
        };
        section_.id = await newSection(section_);
        section.value = section_;
        pushUrl(`/admin/section/${section_.id}`);
    }
    else
    {
        section.value = await getSection(Number(route.params.id) as SectionId);
    }

    if (section.value)
    {
        sectionTypeInfo.value = await getSectionType(section.value.type);
        kpInfo.value = await getKnowledgePoint(sectionTypeInfo.value.knowledgePoint)
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

function changeQuestionType(questionIndex: number, newType: QuestionType)
{
    const oldQuestion = section.value.questions[questionIndex];
    const oldType = oldQuestion.type;
    if (oldType === newType) return;
    const newQuestion = {
        description: oldQuestion.description,
        options: null,
        answer: null,
        userAnswer: null,
        analysis: oldQuestion.analysis,
        type: newType,
        key: (oldQuestion as any).key || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    };

    // 切换题目类型的时候，尽可能保留原有的选项和答案

    if ((oldType === 'single' || oldType === 'multiple') && (newType === 'single' || newType === 'multiple')) 
        newQuestion.options = oldQuestion.options;
    if (oldType === 'single' && newType === 'multiple') 
        newQuestion.answer = [oldQuestion.answer];
    if (oldType === 'multiple' && newType === 'single') 
        newQuestion.answer = oldQuestion.answer[0] || 0;
    if ((oldType === 'essay' && newType === 'fill') || (oldType === 'fill' && newType === 'essay')) 
        newQuestion.answer = oldQuestion.answer || '';

    // 兜底措施，如果没有提供答案，则使用默认值

    if (newType === 'single')
        newQuestion.answer = newQuestion.answer || 0;
    if (newType === 'multiple')
        newQuestion.answer = newQuestion.answer || [];
    if (newType === 'judge')
        newQuestion.answer = newQuestion.answer || false;
    if (newType === 'fill' || newType === 'essay') 
        newQuestion.answer = newQuestion.answer || '';

    // 兜底措施，如果没有提供选项，则使用默认值

    if (newType === 'single' || newType === 'multiple')
        newQuestion.options = newQuestion.options || ['', '', '', ''];
    else 
        newQuestion.options = null;

    section.value.questions[questionIndex] = newQuestion;
}

const questionTypes = [
    {
        value: 'single',
        label: '单选'
    },
    {
        value: 'multiple',
        label: '多选'
    },
    {
        value: 'judge',
        label: '判断'
    },
    {
        value: 'fill',
        label: '填空'
    },
    {
        value: 'essay',
        label: '简答'
    }
]

function addOption(questionIndex: number)
{
    section.value.questions[questionIndex].options.push('');
}

function deleteOption(questionIndex: number, optionIndex: number)
{
    section.value.questions[questionIndex].options = section.value.questions[questionIndex].options.filter((_, i) => i !== optionIndex);
    const oldAnswer = section.value.questions[questionIndex].answer;
    if (typeof oldAnswer === 'number')
    {
        section.value.questions[questionIndex].answer = oldAnswer === optionIndex ? 0 : oldAnswer < optionIndex ? oldAnswer : oldAnswer - 1;
    }
    else if (Array.isArray(oldAnswer))
    {
        section.value.questions[questionIndex].answer = (section.value.questions[questionIndex].answer as number[]).filter((x) => x !== optionIndex).map((x) => x > optionIndex ? x - 1 : x);
    }
}

function deleteQuestion(questionIndex: number)
{
    section.value.questions.splice(questionIndex, 1);
}

let saving = ref(false);

function saveSection()
{
    (async () => 
    {
        if (saving.value) return;
        saving.value = true;
        await modifySection(section.value as Section<AnswerType, null, string>);
            router.push(`/admin/group/${kpInfo.value.group}?kp=${sectionTypeInfo.value.knowledgePoint}`);
    })().catch(() => 
    {
        saving.value = false;
    });
}

function deleteSection_()
{
    const delete_ = (async () => 
    {
        await deleteSection(section.value.id);
        router.push(`/admin/group/${kpInfo.value.group}?kp=${sectionTypeInfo.value.knowledgePoint}`);
    });
    const close = dialog(
        <>
            <p style="display: flex; justify-content: center; align-items: center;">注意删除后将无法找回，确定删除该大题吗？</p>
            <div style="display: flex; justify-content: flex-end;">
                <Button onClick={() => close()}>取消</Button>
                <Button onClick={() => { close(); delete_(); }}>确认</Button>
            </div>
        </>,
        () => close()
    );
}

function getQuestionKey(questionIndex: number)
{
    if ((section.value.questions[questionIndex] as any).key) return (section.value.questions[questionIndex] as any).key;
    (section.value.questions[questionIndex] as any).key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    return (section.value.questions[questionIndex] as any).key;
}

const preview = ref(false);

</script>

<template>
    <NotFound v-if="notFound" />
    <Loading v-else-if="section === null || !sectionTypeInfo" class="main-loading" />
    <Card v-else-if="!preview" class="section-container" :scroll="true" style="flex-grow: 1;">
        <p class="main-title">{{ section.id === 0 ? '新建' : '编辑' }}题目</p>
        <p class="title">{{ `类型：${sectionTypeInfo.name}` }}</p>
        <Button @click="preview = true">
            题目预览
        </Button>
        <Spacer />
        <p class="small-title">大题描述</p>
        <div style="display: flex;">
            <ResizableWrapper style="max-width: 100%; max-height: fit-content;" height-resizable>
                <Editor v-model="section.description" :editable="true" :section="section.id"></Editor>
            </ResizableWrapper>
        </div>
        <br />
        <div v-for="(question, questionIndex) in section.questions" :key="getQuestionKey(questionIndex)" class="question">
            <Spacer style="margin-bottom: 10px; margin-top: 10px;" />
            <div class="question-description">
                <p class="q-title">
                    {{ questionIndex + 1 }}.
                </p>
                <div class="button-box">
                    <SelectMenu :options="questionTypes" :model-value="question.type" @update:model-value="(value) => changeQuestionType(questionIndex, value)">
                    </SelectMenu>
                    <Button @click="deleteQuestion" class="add-button">
                        <TrashCanIcon /> 删除该小题
                    </Button>
                </div>
            </div>
            <ResizableWrapper style="max-width: 100%; max-height: fit-content;" height-resizable width-resizable>
                <Editor v-model="question.description" :editable="true" :section="section.id"></Editor>
            </ResizableWrapper>

            <!-- 单选和多选 -->

            <div v-if="question.type === 'single' || question.type === 'multiple'"
                v-for="(_, optionIndex) in question.options" :key="`${question.options.length}:${optionIndex}`"
                class="option-box">
                <div class="button-box">
                    <Button class="option-title" @click="setAnswer(questionIndex, optionIndex)"
                        :down="Array.isArray(question.answer) ? question.answer.includes(optionIndex) : question.answer === optionIndex"
                        :class="{ 'right-answer': Array.isArray(question.answer) ? question.answer.includes(optionIndex) : question.answer === optionIndex }">
                        {{ getOptionName(optionIndex) }}
                    </Button>
                    <Button class="add-button" @click="deleteOption(questionIndex, optionIndex)">
                        <TrashCanIcon /> 删除该选项
                    </Button>
                </div>
                <ResizableWrapper
                    style="min-width: min-content; min-height: min-content; margin-left: 50px; max-width: 100%; max-height: fit-content; width: fit-content;"
                    height-resizable width-resizable>
                    <Editor v-model="question.options[optionIndex]" :editable="true" :section="section.id"></Editor>
                </ResizableWrapper>
            </div>

            <div v-if="question.type === 'single' || question.type === 'multiple'" class="option-box">
                <div class="button-box">
                    <Button @click="addOption(questionIndex)" class="add-button">
                        <PlusIcon /> 添加选项
                    </Button>
                </div>
            </div>

            <!-- 判断 -->
            <div v-else-if="question.type === 'judge'" class="judge-option-box">
                <Button class="judge-option" :down="question.answer === false"
                    :class="{ 'right-answer': question.answer === false }" @click="setAnswer(questionIndex, false)">
                    <CloseIcon />
                </Button>
                <Button class="judge-option" :down="question.answer === true"
                    :class="{ 'right-answer': question.answer === true }" @click="setAnswer(questionIndex, true)">
                    <CheckIcon />
                </Button>
            </div>

            <!-- 填空/简答 -->
            <template v-else-if="question.type === 'fill' || question.type === 'essay'">
                <div class="title">
                    答案/评标
                    <span title="简答题和填空题将由AI判卷，因此请尽可能详细描述评分标准，以提高判卷的准确性。">
                        <HelpCircleOutlineIcon />
                    </span>
                </div>
                <div class="analysis-box">
                    <ResizableWrapper style="max-width: 100%; max-height: fit-content;" height-resizable
                        width-resizable>
                        <Editor v-model="question.answer" :editable="true" :section="section.id"></Editor>
                    </ResizableWrapper>
                </div>
            </template>

            <p class="title">解析</p>
            <ResizableWrapper style="max-width: 100%; max-height: fit-content;" height-resizable width-resizable>
                <Editor v-model="question.analysis" :editable="true" :section="section.id"></Editor>
            </ResizableWrapper>
        </div>
        <div class="button-box">
            <Button @click="addQuestion" class="add-button">
                <PlusIcon /> 添加小题
            </Button>
        </div>
        <Spacer style="margin-bottom: 10px; margin-top: 10px;" />
        <quiz-small-title style="display: flex;">
            <Switch :on="section.available" @click="section.available = !section.available" />
            {{ section.available ? ' 公开题目' : ' 私有题目' }}
        </quiz-small-title>
        <quiz-small-title style="display: flex;">
            {{ section.available ? ' *题目公开可被学生在刷题中刷到' : ' *题目私有不可被学生在刷题中刷到，但仍可添加到考试中' }}
        </quiz-small-title>
        <p class="title">权重（权重越大越容易被学生刷到）</p>
        <div style="width: 280px;">
            <Input :area="false" placeholder="Section Weight" type="number" v-model="section.weight"
                style="width: 300px;" />
            <Slider :min-value="0" :max-value="100" :step="1" v-model="section.weight" style="width: 300px;" />
        </div>
        <div class="button-box">
            <Button @click="saveSection" class="add-button">
                <ContentSaveIcon /> 保存题目
            </Button>
            <Button @click="deleteSection_" class="add-button">
                <TrashCanIcon /> 删除题目
            </Button>
        </div>
    </Card>
    <template v-else>
        <Button @click="preview = false">返回编辑</Button>
        <QuizView :quiz="{ sections: [section], correct: null }" :editable="false" />
    </template>
</template>

<style scoped lang="scss">
.main-loading {
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

.section-container {
    display: flex;
    flex-direction: column;
    height: calc(100% - 20px);
    margin-top: 13px;
    margin-bottom: 7px;
}

quiz-small-title {
    margin: 10px;
    font-size: 16px;

    display: flex;
    align-items: center;
    white-space: pre;
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
    flex-direction: column;
    .option-title {
        height: 48px;
        margin: 10px;
        font-weight: bold;
        width: 50px;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: auto;
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
    padding: 10px;
}
</style>