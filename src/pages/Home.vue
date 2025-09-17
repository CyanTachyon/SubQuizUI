<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from "vue-router";
import Card from '../components/Card.vue';
import type { Quiz } from '../dataClasses/Quiz.ts';
import type { AnswerType } from '../dataClasses/Question.ts';
import { getUnfinishedQuizzes } from '../networks/backend/quiz.ts';
import Spacer from '../components/Spacer.vue';
import { phone } from '../main.ts';
import type { Practice } from '../dataClasses/Practice.ts';
import { getUnfinishedPractices } from '../networks/backend/practice.ts';
import { getDoneSectionCount } from '../networks/backend/home.ts';
import { useUser } from '../stores/user.ts';
import LoginCard from '../templates/LoginCard.vue';

document.title = 'SubQuiz';

const loading = ref(true);
const router = useRouter();

const unfinishedQuizzes = ref<Quiz<null, AnswerType | null, null>[]>([]);
const unfinishedPractices = ref<Practice[]>([]);
const doneSectionCount = ref<{day: number, count: number}[]>([]);

// 规范化为最近30天（[29, ..., 0] 从左到右）的数组，缺失日期补0
const last30Days = computed(() => {
    const map = new Map<number, number>();
    for (const item of doneSectionCount.value || []) {
        map.set(item.day, item.count);
    }
    const arr: { day: number; count: number }[] = [];
    for (let d = 29; d >= 0; d--) {
        arr.push({ day: d, count: map.get(d) ?? 0 });
    }
    return arr;
});

const maxCount = computed(() => {
    const m = Math.max(0, ...last30Days.value.map(i => i.count));
    return m === 0 ? 1 : m; // 避免除以0
});

// 将最大值向上取整到 4 的倍数，便于刻度（0,25%,50%,75%,100%）
const scaleMax = computed(() => {
    const step = Math.max(1, Math.ceil(maxCount.value / 4));
    return step * 4;
});

// 刻度数组：0..scaleMax，分5等份
const yTicks = computed(() => {
    return Array.from({ length: 5 }, (_, i) => Math.round((scaleMax.value / 4) * i));
});

(async() => 
{
    if (!useUser().getToken()) 
    {
        loading.value = false;
        return;
    }
    const r1 = getUnfinishedQuizzes();
    const r2 = getUnfinishedPractices();
    const r3 = getDoneSectionCount();
    unfinishedQuizzes.value = await r1;
    unfinishedPractices.value = await r2;
    doneSectionCount.value = await r3;
    loading.value = false;
})();

function timeToString(time: number)
{
    if (!time) return '无';
    const date = new Date(time);
    const padZero = (num: number) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}:${padZero(date.getSeconds())}`;
}
</script>

<template>
    <quiz-main-container :class="{ phone }" v-if="useUser().getToken()">
        <quiz-main-left>
            <Card class="chart-card">
                <p class="title" style="margin-left: 20px;">最近30天做题记录</p>
                <div class="chart-wrapper">
                    <svg class="chart-svg" viewBox="0 0 320 160" preserveAspectRatio="xMidYMid meet">
                        <!-- 坐标轴 -->
                        <line x1="20" y1="140" x2="310" y2="140" stroke="var(--fg-2, #aaa)" stroke-width="1" />
                        <line x1="20" y1="20" x2="20" y2="140" stroke="var(--fg-2, #aaa)" stroke-width="1" />

                        <!-- 动态网格线与刻度文字 -->
                        <g v-for="tick in yTicks" :key="tick">
                            <!-- 跳过最底部0的水平虚线，只画上方网格线，底部已有x轴线 -->
                            <line v-if="tick !== 0"
                                  x1="20" :y1="140 - (tick / scaleMax) * 120"
                                  x2="310" :y2="140 - (tick / scaleMax) * 120"
                                  stroke="var(--fg-3, #ccc)" stroke-width="0.5" stroke-dasharray="3 3" />
                            <text x="18" :y="144 - (tick / scaleMax) * 120" font-size="8" text-anchor="end" fill="var(--fg-2, #888)">{{ tick }}</text>
                        </g>

                        <!-- 柱子 -->
                        <g>
                            <!-- 计算柱宽与间距：区域宽(310-20)=290，放30个柱子 -->
                            <!-- 每个柱子宽度 6，间距 4，总宽 30*(6+4)=300，略超，微调为宽度 6，间距 3.67 左右 -->
                            <!-- 实际按索引定位：x = 22 + i*9.3 近似到一屏显示 -->
                            <!-- 这里改为基于可用宽度计算：barW=6, gap=(290-30*barW)/29 -->
                            <template v-for="(item, i) in last30Days" :key="item.day">
                                <!-- 可用区域：x:[20,310], y:[20,140] 高度120 -->
                                <rect
                                    :x="20 + i * ((290 - 30 * 6) / 29 + 6) + 1"
                                    :y="140 - (item.count / scaleMax) * 120"
                                    :width="6"
                                    :height="(item.count / scaleMax) * 120"
                                    rx="1" ry="1"
                                    fill="var(--primary, #4e8cff)"
                                    opacity="0.9"
                                >
                                    <title>
                                        {{ `距离今天${item.day}天：${item.count}` }}
                                    </title>
                                </rect>
                            </template>
                        </g>

                        <!-- 辅助文字：左侧“29天前”，右侧“今天” -->
                        <text x="20" y="155" font-size="8" text-anchor="start" fill="var(--fg-2, #888)">29天前</text>
                        <text x="310" y="155" font-size="8" text-anchor="end" fill="var(--fg-2, #888)">今天</text>
                    </svg>
                </div>
                <div class="legend">
                    <span class="legend-color"></span>
                    <span class="legend-text">完成题目数</span>
                </div>
            </Card>
        </quiz-main-left>

        <Card class="main-right">
            <p class="title" style="margin-left: 20px;">未完成的练习</p>
            <Spacer class="spacer" />
            <quiz-quizzes v-if="unfinishedPractices.length > 0">
                <Card v-for="q in unfinishedPractices" :key="q.id" @click="router.push('/practice/' + q.id)" :max-tilt="5"
                    class="unfinished">
                    <p>{{ q.name }}</p>
                    <Spacer />
                    <p>练习ID：{{ q.id }}</p>
                    <p>题目数量：{{ q.sectionCount }}</p>
                    <p>截至时间：{{ timeToString(q.dueDate) }}</p>
                </Card>
            </quiz-quizzes>
            <div v-else class="no-quizzes">暂无未完成的练习</div>
        </Card>
        <Card class="main-right">
            <p class="title" style="margin-left: 20px;">未完成的测试</p>
            <Spacer class="spacer" />
            <quiz-quizzes v-if="unfinishedQuizzes.length > 0">
                <Card v-for="q in unfinishedQuizzes" :key="q.id" @click="router.push('/quiz?id=' + q.id)" :max-tilt="5"
                    class="unfinished">
                    <p>{{ timeToString(q.time) }}</p>
                    <Spacer />
                    <p>测试ID：{{ q.id }}</p>
                    <p>题目数量：{{ q.sections.length }}</p>
                    <p>测试状态：{{ q.finished ? '已完成' : '进行中' }}</p>
                </Card>
            </quiz-quizzes>
            <div v-else class="no-quizzes">暂无未完成的测试</div>
        </Card>
    </quiz-main-container>
    <div v-else style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
        <Card :max-tilt="5" style="max-width: 100%; max-height: 100%; display: flex; justify-content: center; align-items: center;">
            <LoginCard/>
        </Card>
    </div>
</template>

<style scoped lang="scss">
quiz-main-container {
    margin-top: 3px;
    display: flex;
    flex-direction: row;
    height: calc(100% - 3px);
    width: 100%;
}

quiz-main-container.phone {
    flex-direction: column;
    overflow-y: scroll;
    scrollbar-width: none;
}

quiz-main-left {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
}

.chart-card {
    // width: 100%;
    max-width: 600px;
}

.chart-wrapper {
    width: 100%;
    padding: 10px 16px 4px 16px;
}

.chart-svg {
    width: 100%;
    height: auto;
}

.legend {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 6px 16px 12px 16px;
    color: var(--fg-2, #666);
    font-size: 12px;
}

.legend-color {
    width: 10px;
    height: 10px;
    background: var(--primary, #4e8cff);
    border-radius: 2px;
    display: inline-block;
}

.main-right {
    display: flex;
    flex-direction: column;
    quiz-quizzes {
        overflow-y: scroll;
        scrollbar-width: none;
        flex-grow: 1;
    }
    .spacer {
        width: 296px;
    }
}

.phone .main-right {
    quiz-quizzes {
        display: flex;
        flex-direction: row;
    }
    .spacer {
        width: unset;
    }
    height: 310px;
    min-height: 310px;
    max-height: 310px;
}

.unfinished {
    padding: 15px 30px 30px 30px;
    cursor: pointer;
    width: 270px;
    min-width: 270px;
    max-width: 270px;
}

.no-quizzes {
    width: 100%;
    text-align: center;
    align-items: center;
    justify-content: center;
    display: flex;
    flex-grow: 1;
}

.title {
    margin: 10px;
}

.description {
    width: 400px;
    height: 200px;
}

.main-title {
    font-size: 1.5em;
    font-weight: bold;
    text-align: center;
    margin: 20px 0;
}

quiz-main-button-container {
    display: flex;
    justify-content: center;
    margin-top: 20px;
}

.main {
    margin: auto;
}

.custom-login {
    margin-left: auto;
}
</style>