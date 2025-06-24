<script lang="tsx" setup>
import { useRoute } from 'vue-router';
import Group from './Group.vue';
import { ref } from 'vue';
import Card from '../../components/Card.vue';
import type { Exam } from '../../dataClasses/Exam';
import Loading from '../../components/Loading.vue';
import { deleteExam, getExam, modifyExam } from '../../networks/backend/exam';
import type { Class } from '../../dataClasses/Class';
import { getClass } from '../../networks/backend/class';
import Text from '../../components/Text.vue';
import SquareEditOutlineIcon from 'vue-material-design-icons/SquareEditOutline.vue';
import DeleteIcon from 'vue-material-design-icons/Delete.vue';
import { getSectionBrief, inputDialog } from '../../utils/utils';
import { router } from '../../main';
import type { Section } from '../../dataClasses/Section';
import type { AnswerType } from '../../dataClasses/Question';
import { getSection } from '../../networks/backend/section';
import UpIcon from 'vue-material-design-icons/ArrowUpThick.vue';
import DownIcon from 'vue-material-design-icons/ArrowDownThick.vue';
import type { SectionId } from '../../dataClasses/Ids';
import Split from '../../templates/Split.vue';
import Spacer from '../../components/Spacer.vue';
import StatusButton from '../../components/StatusButton.vue';
import Switch from '../../components/Switch.vue';
import QuizView from '../../templates/QuizView.vue';

const route = useRoute();

const examId = Number(route.params.id);
const preview = ref(false);
const edit = ref(false);
const loading = ref(false);
const exam = ref(null as null | Exam);
const clazz = ref(null as null | Class);
const sections = ref([] as Section<AnswerType, null, string>[]);

async function init()
{
    const e = await getExam(examId);
    exam.value = e;
    clazz.value = await getClass(e.clazz);
}
init()

function renameExam() 
{
    inputDialog(
        <div style="margin: 13px"> 为考试{ exam.value?.name }重命名 </div>,
        (label: string) => {
            if(exam.value)
            {
                exam.value.name = label;
                modifyExam(exam.value);
            }
        }
    )
}

function updateDescription() 
{
    inputDialog(
        <div style="margin: 13px"> 修改考试{ exam.value?.name }的描述 </div>,
        (description: string) => {
            if(exam.value)
            {
                exam.value.description = description;
                modifyExam(exam.value);
            }
        },
        undefined,
        exam.value?.description || ''
    )
}

function removeExam() 
{
    inputDialog(
        <div style="margin: 13px">警告：<br />将删除该考试，<br /> 输入“确认删除{exam.value?.name}”以确认删除 </div>,
        (value: string) =>
        {
            if (exam.value && value === `确认删除${exam.value.name}`)
                deleteExam(exam.value.id).then(() => router.back());
        }
    );
}

function getSectionInfo(sectionId: number): Section<AnswerType, null, string>
{
    if (sections.value[sectionId]) return sections.value[sectionId] as Section<AnswerType, null, string>;
    getSection(sectionId).then((section) => sections.value[sectionId] = section);
    return {
        id: sectionId,
        type: 0,
        description: '加载中...',
        weight: 0,
        questions: [],
        available: true,
        markdown: false,
    }
}

function moveSectionUp(index: number) 
{
    if (index > 0) {
        const temp = exam.value?.sections[index - 1];
        exam.value.sections[index - 1] = exam.value.sections[index];
        exam.value.sections[index] = temp;
        modifyExam(exam.value).then(() => {}, init);
    }
}
function moveSectionDown(index: number) 
{
    if (index < exam.value?.sections.length - 1) {
        const temp = exam.value?.sections[index + 1];
        exam.value.sections[index + 1] = exam.value.sections[index];
        exam.value.sections[index] = temp;
        modifyExam(exam.value).then(() => {}, init);
    }
}
function removeSection(index: number) 
{
    exam.value?.sections.splice(index, 1);
    modifyExam(exam.value).then(() => {}, init);
}
function addSection(section: SectionId) 
{
    exam.value?.sections.push(section);
    modifyExam(exam.value).then(() => {}, init);
}
function changeAvailability() 
{
    if (exam.value) 
    {
        exam.value.available = !exam.value.available;
        modifyExam(exam.value);
    }
}
</script>

<template>
    <Loading v-if="!exam || !clazz || loading" class="loading" />
    <div v-else-if="preview">
        <StatusButton @click="preview = false;" style="margin: 13px;">
            返回编辑
        </StatusButton>
        <QuizView :quiz="{ correct: null, sections: exam.sections.map(section => getSectionInfo(section)) }" :editable="false">

        </QuizView>
    </div>
    <Split v-else-if="edit" class="split">
        <template #left>
            <Group :group="clazz.group" @clickSection="addSection" />
        </template>
        <template #right>
            <Card class="content">
                <Text style="display: flex;" class="main-title">
                    {{ exam.name }}
                    <Text class="clickable" style="color: darkgray; margin-left: 5px;">
                        <SquareEditOutlineIcon @click="renameExam" class="clickable" />
                        <DeleteIcon @click="removeExam" class="clickable" style="margin-left: 5px;" />
                    </Text>
                </Text>

                <div style="margin-left: 20px;"> {{ exam.description || '该考试没有描述' }} </div>

                <div style="display: flex; align-items: center; gap: 10px; margin-left: 7px;">
                    <StatusButton @click="preview = true">
                        预览考试
                    </StatusButton>
                    <StatusButton @click="updateDescription">
                        修改描述
                    </StatusButton>
                    <Switch :on="exam.available" @click="changeAvailability"/>
                    <span v-if="exam.available">考试已发布</span>
                    <span v-else>考试未发布</span>
                </div>
                <Spacer />

                <div class="sections">
                    <div v-if="exam.sections.length === 0" class="no-section">
                        该考试还没有任何题目<br />
                        点击左侧题目以添加题目
                    </div>
                    <div v-else class="section-wrapper" v-for="(section, index) in exam.sections" :key="section">
                        <div class="section">
                            第{{ index + 1 }}大题：{{ getSectionBrief(getSectionInfo(section)) }}
                        </div>
                        <UpIcon class="clickable" @click="moveSectionUp(index)" />
                        <DownIcon class="clickable" @click="moveSectionDown(index)" />
                        <DeleteIcon class="clickable" @click="removeSection(index)" />
                    </div>
                </div>
            </Card>
        </template>
    </Split>
    <div v-else>
    </div>
</template>

<style lang="scss" scoped>
.loading {
    position: relative;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    height: 20%;
    width: 30%;
}

.split {
    height: 100%;
    width: 100%;
    display: flex;
    min-width: 100%;
    min-height: 100%;
    max-width: 100%;
    max-height: 100%;
}

.sections {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    overflow-y: auto;
    scrollbar-width: none;

    .section-wrapper {
        display: flex;
        align-items: center;
        margin-right: 20px;
        .section {
            flex-grow: 1;
            border: 1px solid lightgray;
            border-radius: 10px;
            padding: 10px;
            margin: 20px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            line-height: 1em;
        }
    }
}

.clickable {
    cursor: pointer;
}

.no-section {
    opacity: 0.5;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.2em;
}

.content {
    display: flex;
    flex-direction: column;
    height: calc(100% - 20px);
    flex-grow: 1;
    width: calc(100% - 26px);
    min-width: 300px;

    .main-title {
        margin: 20px 0 0 20px;
        font-size: 1.5em;
        font-weight: bold;
    }
}
</style>