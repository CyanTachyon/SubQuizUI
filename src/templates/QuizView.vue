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
    <Loading v-if="loading"/>
    <Card v-else v-for="(section, sectionIndex) in quiz.sections" class="section">
        <div class="section-description">
            <p class="title">
                {{ `学科：${subjectNames.get(section.subject)} 类型：${sectionTypeNames.get(section.type)}` }}
            </p>
            <br/>
            {{ section.description }}
        </div>
        <br/>
        <Text class="spacer"/>
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
                              :class="{ 'right-answer': optionIndex === question.answer, 'wrong-answer': question.userAnswer === optionIndex && question.userAnswer !== question.answer && question.answer !== null }"
                >
                    <div class="title">
                        {{ getName(optionIndex) }}
                    </div>
                    {{ option }}
                </StatusButton>
            </div>
            <template v-if="question.analysis">
                <Text>
                    <div class="analysis"
                         :class="question.userAnswer===question.answer ? 'right-answer' : 'wrong-answer'">
                        {{ '解析：' + question.analysis }}
                    </div>
                </Text>
            </template>
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
    width: 80%;
}

.question-description {
    display: flex;
    margin-top: 5px;
    margin-left: 13px;
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
    margin: 0 10px 0 0;
    font-weight: bold;
}

.right-answer {
    color: green;
}

.wrong-answer {
    color: red;
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
}

.analysis {
    margin-left: 13px;
    margin-bottom: 20px;
    width: 60%;
}
</style>