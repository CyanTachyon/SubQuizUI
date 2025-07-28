<script lang="tsx" setup>
import { useRoute } from 'vue-router';
import Group from './Group.vue';
import { ref } from 'vue';
import Card from '../../components/Card.vue';
import type { Exam } from '../../dataClasses/Exam';
import Loading from '../../components/Loading.vue';
import { deleteExam, getExam, modifyExam, type ExamScore, getExamScores, getStudentExam as _getStudentExam } from '../../networks/backend/exam';
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
import Button from '../../components/Button.vue';
import Switch from '../../components/Switch.vue';
import QuizView from '../../templates/QuizView.vue';
import { computed } from 'vue';
import OpenInNewIcon from 'vue-material-design-icons/OpenInNew.vue';
import type { Quiz } from '../../dataClasses/Quiz';
import { avatarUrl } from '../../networks/sso/avatar';
import Image from '../../components/Image.vue';

const route = useRoute();

const examId = Number(route.params.id);

const preview = ref(false);
const edit = ref(false);
const loading = ref(false);
const showSection = ref(0);
const showStudentExam = ref('');
const showMembers = ref(false);

const exam = ref(null as null | Exam);
const clazz = ref(null as null | Class);
const sections = ref([] as Section<AnswerType, null, string>[]);
const studentExams = ref({} as Record<string, Quiz<AnswerType, AnswerType, string>>);
const rawExamScores = ref([] as ExamScore[]);
const examScores = computed(() => {
    let x = {} as Record<number, {q: { correct: number, all: number }[], correct: number, all: number}>;
    rawExamScores.value.forEach((score) => {
        score.sections.forEach((section) => {
            if (!x[section.id]) x[section.id] = { q: [], correct: 0, all: 0 };

            let c = 0;

            section.questions.forEach((question, index) => 
            {
                if (!x[section.id].q[index]) x[section.id].q[index] = { correct: 0, all: 0 };
                x[section.id].q[index].correct += question.correct ? 1 : 0;
                x[section.id].q[index].all += 1;
                c += question.correct ? 1 : 0;
            });
            x[section.id].correct += c;
            x[section.id].all += section.questions.length;
        })
    })
    return x;
})
const expandedSections = ref(new Set<number>());

async function init()
{
    const e = await getExam(examId);
    exam.value = e;
    clazz.value = await getClass(e.clazz);
    
    // 获取考试分数数据
    try {
        rawExamScores.value = await getExamScores(examId);
    } catch (error) {
        console.error('获取考试分数失败:', error);
        rawExamScores.value = [];
    }
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

function getStudentExam(studentId: string): Quiz<AnswerType, AnswerType, string>
{
    if (studentExams.value[studentId]) return studentExams.value[studentId] as Quiz<AnswerType, AnswerType, string>;
    _getStudentExam(examId, studentId).then((section) => studentExams.value[studentId] = section);
    return {
        id: 0,
        user: 0,
        time: 0,
        duration: null,
        sections: [{
            id: 0,
            type: 0,
            description: '加载中...',
            weight: 0,
            questions: [],
            available: true,
            markdown: false,
        }],
        finished: false,
        correct: null,
        tokenUsage: null,
    };
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

function toggleSectionExpansion(sectionId: number) {
    if (expandedSections.value.has(sectionId)) {
        expandedSections.value.delete(sectionId);
    } else {
        expandedSections.value.add(sectionId);
    }
}

function openSection(section: SectionId) 
{
    showSection.value = section;
}
</script>

<template>
    <Loading v-if="!exam || !clazz || loading" class="loading" />
    <div v-else-if="preview">
        <Button @click="preview = false;" style="margin: 13px;">
            返回编辑
        </Button>
        <QuizView :quiz="{ correct: null, sections: exam.sections.map(section => getSectionInfo(section)) }"
            :editable="false" />
    </div>
    <div v-else-if="showSection" class="section-view">
        <Button @click="showSection = 0;" style="margin: 13px;">
            返回考试
        </Button>
        <QuizView :quiz="{ correct: null, sections: [getSectionInfo(showSection)] }" :editable="false" />
    </div>
    <div v-else-if="showStudentExam">
        <Button @click="showStudentExam = '';" style="margin: 13px;">
            返回考试
        </Button>
        <QuizView :quiz="getStudentExam(showStudentExam)" :editable="false" />
    </div>
    <Split v-else-if="edit" class="split" min-right-width="433px" min-left-width="623px">
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
                    <Button @click="edit = false">
                        考试数据
                    </Button>
                    <Button @click="preview = true">
                        预览考试
                    </Button>
                    <Button @click="updateDescription">
                        修改描述
                    </Button>
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
    <Card v-else-if="showMembers" style="height: calc(100% - 20px); margin-bottom: 6px;" class="content">
        <Button @click="showMembers = false;" style="margin: 13px;">
            返回考试
        </Button>
        <div class="members" :class="{ empty: rawExamScores.length === 0 }">
            <div v-if="rawExamScores.length === 0" class="no-scores">
                暂无作答数据
            </div>
            <Card v-else v-for="m in rawExamScores.map((e) => e.member)" :key="m.seiue.studentId" class="member-item"
                :max-tilt="7">
                <quiz-user-box class="box" @click="showStudentExam = m.seiue.studentId">
                    <Image class="avatar" :src="avatarUrl(m.user)" />
                    <quiz-username-box>
                        <quiz-username>{{ m.seiue.realName }}</quiz-username>
                        <quiz-user-id>{{ m.seiue.studentId }}</quiz-user-id>
                    </quiz-username-box>
                </quiz-user-box>
            </Card>
        </div>
    </Card>
    <Card v-else style="height: calc(100% - 20px); margin-bottom: 6px;" class="content">
        <Text style="display: flex;" class="main-title">
            {{ exam.name }}
        </Text>

        <div style="margin-left: 20px;"> {{ exam.description || '该考试没有描述' }} </div>

        <div style="display: flex; align-items: center; gap: 10px; margin-left: 7px;">
            <Button @click="preview = true">
                预览考试
            </Button>
            <Button @click="edit = true">
                编辑考试
            </Button>
            <Button @click="showMembers = true">
                查看作答
            </Button>
            <Switch :on="exam.available" @click="changeAvailability" />
            <span v-if="exam.available">考试已发布</span>
            <span v-else>考试未发布</span>
        </div>
        <Spacer />

        <div class="exam-scores">
            <div v-if="Object.keys(examScores).length === 0" class="no-scores">
                暂无考试数据
            </div>
            <div v-else v-for="(section, index) in exam.sections" :key="section" class="score-section">
                <div class="section-header" @click="toggleSectionExpansion(section)">
                    <div class="section-title">
                        <div style="display: flex;">
                            第{{ index + 1 }}大题：
                            <OpenInNewIcon :size="16" @click="openSection(section)" />
                        </div>
                        <div class="section-content">
                            {{ getSectionBrief(getSectionInfo(section)) }}
                        </div>
                    </div>
                    <div class="score-bar-container">
                        <div class="score-text">
                            {{ examScores[section]?.correct || 0 }}/{{ examScores[section]?.all || 0 }}
                            ({{ examScores[section]?.all > 0 ? Math.round((examScores[section]?.correct || 0) /
                            examScores[section].all * 100) : 0 }}%)
                        </div>
                        <div class="score-bar">
                            <div class="score-bar-fill"
                                :style="{ width: examScores[section]?.all > 0 ? (examScores[section]?.correct || 0) / examScores[section].all * 100 + '%' : '0%' }">
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="expandedSections.has(section)" class="questions-scores">
                    <div v-for="(question, qIndex) in examScores[section]?.q || []" :key="qIndex"
                        class="question-score">
                        <div class="question-title">
                            第{{ qIndex + 1 }}小题
                        </div>
                        <div class="score-bar-container">
                            <div class="score-text">
                                {{ question.correct }}/{{ question.all }}
                                ({{ question.all > 0 ? Math.round(question.correct / question.all * 100) : 0 }}%)
                            </div>
                            <div class="score-bar">
                                <div class="score-bar-fill"
                                    :style="{ width: question.all > 0 ? question.correct / question.all * 100 + '%' : '0%' }">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Card>
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

.members.empty {
    display: flex;
    height: 100%;
    width: 100%;
}
.members {
    margin: 20px 0 0 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
    justify-content: start;
    overflow-y: auto;
    scrollbar-width: none;

    quiz-card {
        margin: 20px;
    }

    quiz-user-box {
        display: flex;
        flex-direction: row;
        margin-left: -6px;
        margin-right: -6px;

        .avatar {
            min-width: 50px;
            max-width: 50px;
            min-height: 50px;
            max-height: 50px;
        }

        quiz-username-box {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-width: 0;
            margin-left: 10px;

            quiz-username {
                margin-right: 5px;
                display: block;
                max-width: 100%;
                margin-right: 1px;
                margin-top: 15px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                flex-grow: 1;
                min-width: 0;
            }

            quiz-user-id {
                display: block;
                max-width: 100%;
                margin-right: 5px;
                margin-top: -2px;
                margin-bottom: 15px;
                opacity: 0.4;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                font-size: small;
                flex-grow: 1;
            }
        }
    }

    .no-scores {
        opacity: 0.5;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 1.2em;
    }
}

.exam-scores {
    flex-grow: 1;
    overflow-y: auto;
    padding: 0 20px;
    scrollbar-width: none;
    margin-top: 10px;
    
    .no-scores {
        opacity: 0.5;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 1.2em;
    }
    
    .score-section {
        margin-bottom: 15px;
        border: 1px solid var(--glass-border);
        border-radius: 8px;
        overflow: hidden;
        
        .section-header {
            padding: 15px;
            cursor: pointer;
            background-color: var(--glass-button-background);
            border-bottom: 1px solid var(--glass-border);
            transition: background-color 0.2s;
            
            &:hover {
                background-color: var(--glass-button-hover-background);
            }
            
            .section-title {
                margin-bottom: 10px;
                .section-content {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-weight: 400;
                }
            }
            
            .score-bar-container {
                display: flex;
                align-items: center;
                gap: 15px;
                
                .score-text {
                    min-width: 120px;
                    font-size: 0.9em;
                    opacity: 0.5;
                }
                
                .score-bar {
                    flex-grow: 1;
                    height: 12px;
                    background-color: var(--glass-button-background);
                    border-radius: 6px;
                    overflow: hidden;
                    
                    .score-bar-fill {
                        height: 100%;
                        background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
                        transition: width 0.3s ease;
                        border-radius: 6px;
                    }
                }
            }
        }
        
        .questions-scores {
            background-color: var(--glass-button-background);
            
            .question-score {
                padding: 12px 20px;
                border-bottom: 1px solid var(--glass-border);

                &:last-child {
                    border-bottom: none;
                }
                
                .question-title {
                    font-size: 0.9em;
                    margin-bottom: 8px;
                    font-weight: 500;
                }
                
                .score-bar-container {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    
                    .score-text {
                        min-width: 100px;
                        font-size: 0.85em;
                        opacity: 0.4;
                    }
                    
                    .score-bar {
                        flex-grow: 1;
                        height: 8px;
                        background-color: var(--glass-button-background);
                        border-radius: 4px;
                        overflow: hidden;
                        
                        .score-bar-fill {
                            height: 100%;
                            background: linear-gradient(90deg, #007bff 0%, #6f42c1 100%);
                            transition: width 0.3s ease;
                            border-radius: 4px;
                        }
                    }
                }
            }
        }
    }
}
</style>