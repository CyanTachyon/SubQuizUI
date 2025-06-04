<script setup lang="ts">
import StatusButton from "../../components/StatusButton.vue";
import Card from "../../components/Card.vue";
import Input from "../../components/Input.vue";
import NotFound from "../NotFound.vue"
import Loading from "../../components/Loading.vue";
import type { Section } from "../../dataClasses/Section.ts";
import { ref } from "vue";
import { useRoute } from "vue-router";
import type { SectionId, SectionTypeId } from "../../dataClasses/Ids.ts";
import { deleteSection, getSection, getSectionImages, getSectionType, modifySection, newSection, removeSectionImage, } from "../../networks/backend/section.ts";
import CommonButton from "../../components/CommonButton.vue";
import PlusIcon from "vue-material-design-icons/Plus.vue";
import MinusIcon from "vue-material-design-icons/Minus.vue";
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
import { pushUrl } from "../../utils/utils.tsx";
import { uploadSectionImage } from "../../utils/sectionImage.ts";
import { useNotificationStore } from "../../stores/notification.ts";
import Slider from "../../components/Slider.vue";
import type { SectionType } from "../../dataClasses/SectionType.ts";
import { getKnowledgePoint } from "../../networks/backend/knowledgePoint.ts";
import type { KnowledgePoint } from "../../dataClasses/KnowledgePoint.ts";
import Text from "../../components/Text.vue";

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
            markdown: false,
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
        updateImages();
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
        await modifySection(section.value as Section<AnswerType, null, string>);
            router.push(`/admin/group/${kpInfo.value.group}?kp=${sectionTypeInfo.value.knowledgePoint}`);
        
    })().catch(() => {
        saving.value = false;
    });
}

function deleteSection_()
{
    (async () => {
        await deleteSection(section.value.id);
        router.push(`/admin/group/${kpInfo.value.group}?kp=${sectionTypeInfo.value.knowledgePoint}`);
    })().catch(() => {
        saving.value = false;
    });
}

const preview = ref(false);
const images = ref([] as string[]);

async function updateImages()
{
    loadingImages.value = true;
    try
    {
        images.value = await getSectionImages(section.value.id)
    }
    finally
    {
        loadingImages.value = false;
    }
}

const loadingImages = ref(false);
async function addImage()
{
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files[0];
        if (!file) return;
        uploadSectionImage(file, section.value.id).then(() => {
            updateImages();
        }).catch((e) => {
            useNotificationStore().addError(e);
        });
    };
    input.click();
}

function getImageUrl(key: string)
{
    return environment.cdn + '/' + key;
}

const inputEleRef = ref<InstanceType<typeof Input>>(null);

function onFocus(inputEle: InstanceType<typeof Input>)
{
    inputEleRef.value = inputEle;
    console.log("onFocus", inputEle);
}

function onFocusOut(inputEle: InstanceType<typeof Input>)
{
    if (inputEleRef.value === inputEle) 
    {
        inputEleRef.value = null;
        console.log("onFocusOut", inputEle);
    }
}

function onImageClick(name: string)
{
    section.value.markdown = true;
    const imgMarkdown = `![](${name} "100%x")`;
    const textarea = inputEleRef.value as InstanceType<typeof Input>;
    console.log("onImageClick", inputEleRef.value);
    if (!textarea) return;
    const startPos = textarea.element.selectionStart;
    const endPos = textarea.element.selectionEnd;
    const originalText = textarea.value + "";
    const beforeText = originalText.substring(0, startPos);
    const afterText = originalText.substring(endPos);
    textarea.value = beforeText + imgMarkdown + afterText;
    const newPos = startPos + imgMarkdown.length;
    textarea.element.selectionStart = newPos;
    textarea.element.selectionEnd = newPos;
    textarea.element.focus();
}

function deleteImage(name: string)
{
    (async () => {
        await removeSectionImage(section.value.id, name);
        updateImages();
    })().catch(() => {
        useNotificationStore().addError('删除图片失败');
    });
}

</script>

<template>
    <NotFound v-if="notFound"/>
    <Loading v-else-if="section === null || !sectionTypeInfo" class="main-loading"/>
    <div v-else-if="!preview" class="section-container">
        <Card class="section">
            <p class="main-title">{{ section.id === 0 ? '新建' : '编辑' }}题目</p>
            <p class="title">{{ `类型：${sectionTypeInfo.name}` }}</p>
            <StatusButton @click="preview = true">
                题目预览
            </StatusButton>
            <Spacer/>
            <p class="small-title">大题描述</p>
            <quiz-small-title>
                <Switch :on="section.markdown" @click="section.markdown = !section.markdown"/>
                {{ section.markdown ? ' markdown' : ' text' }}
            </quiz-small-title>
            <div style="display: flex;">
                <Input :area="true" placeholder="Section Description" type="text" v-model="section.description" class="section-description-input" @focus="onFocus" @focus-out="onFocusOut"/>
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
                <Input :area="true" placeholder="Question Description" type="text" v-model="question.description" class="question-description-input" @focus="onFocus" @focus-out="onFocusOut"/>

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
                    <Input placeholder="Option Description" type="text" v-model="question.options[optionIndex]" class="option-input" @focus="onFocus" @focus-out="onFocusOut"/>
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
                        <Input :area="true" placeholder="Answer" type="text" class="analysis-input" :value="question.answer" @input="setAnswer(questionIndex, $event.target.value)" @focus="onFocus" @focus-out="onFocusOut"/>
                    </div>
                </template>

                <p class="title">解析</p>
                <div class="analysis-box">
                    <Input :area="true" placeholder="Analysis" type="text" v-model="question.analysis" class="analysis-input" @focus="onFocus" @focus-out="onFocusOut"/>
                </div>
            </div>

            <Spacer style="margin-bottom: 10px; margin-top: 10px;"/>
            <quiz-small-title style="display: flex;">
                <Switch :on="section.available" @click="section.available = !section.available"/>
                {{ section.available ? ' 题目可用' : ' 题目不可用' }}
            </quiz-small-title>
            <p class="title">权重</p>
            <div style="width: 280px;">
                <Input :area="false" placeholder="Section Weight" type="number" v-model="section.weight" style="width: 300px;"/>
                <Slider :min-value="0" :max-value="100" :step="1" v-model="section.weight" style="width: 300px;"/>
            </div>
            <div class="button-box">
                <CommonButton @click="addQuestion" class="add-button"><PlusIcon/></CommonButton>
                <CommonButton @click="deleteQuestion" class="add-button"><MinusIcon/></CommonButton>
                <StatusButton @click="saveSection" class="add-button"><ContentSaveIcon/></StatusButton>
                <StatusButton @click="deleteSection_" class="add-button"><TrashCanIcon/></StatusButton>
            </div>
        </Card>
        <Card>
            <div style="font-weight: bold; display: flex; flex-direction: row; align-items: center; margin-right: auto;">
                <p style="margin-left: 10px; cursor: pointer; " @click="addImage">图库</p> 
                <Text @click="addImage" style="cursor: pointer; "><PlusIcon /></Text>
            </div>
            <Loading v-if="loadingImages"/>
            <template v-else>
                <div v-if="images.length" style="margin-left: 10px;">
                    点击图片将其插入光标所在位置
                </div>
                <div v-else style="margin: 10px 10px 20px 10px;">
                    暂无图片
                </div>
                <div class="img-sources">
                    <Text v-for="img in images" class="img" :key="img" :style="'--img-url: url(' + getImageUrl(img) + ');'" @click="onImageClick(img.substring(img.lastIndexOf('/')))">
                        <TrashCanIcon :size="30" @click.stop="deleteImage(img.substring(img.lastIndexOf('/')))" class="remove-img"/>
                    </Text>
                </div>
            </template>
            <!-- <CommonButton  class="add-img-button">添加图片附件</CommonButton> -->
        </Card>
    </div> 
    <template v-else>
        <StatusButton @click="preview = false">返回编辑</StatusButton>
        <QuizView :quiz="{ sections: [section], correct: null }" :editable="false"/>
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
    width: 100%;
    height: 100%;
}

.section {
    overflow: auto;
    scrollbar-width: none;
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


///// img

.img-sources {
    // width: 100%;
    display: flex;
    flex-direction: row;
    scrollbar-width: none;
    overflow-x: auto;
    gap: 10px;
    margin-left: 10px;
    margin-right: 10px;
}
.img {
    --img-url: ;
    background-image: var(--img-url);
    min-width: 200px;
    max-width: 200px;
    min-height: 200px;
    max-height: 200px;
    background-size: 100% 100%;
    background-position: center;
    background-repeat: no-repeat;
    background-clip: content-box;
    border-radius: 10px;
    position: relative;

    .remove-img {
        position: absolute;
        bottom: 5px;
        right: 5px;
        color: red;
        cursor: pointer;
    }
}
</style>