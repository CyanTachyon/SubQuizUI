<script setup lang="tsx">
import { computed, markRaw, ref } from 'vue';
import Loading from '../components/Loading.vue';
import { useRoute } from 'vue-router';
import { getPractice as _getPractice, startPractice, updatePractice } from '../networks/backend/practice';
import Card from '../components/Card.vue';
import Text from '../components/Text.vue';
import Button from '../components/Button.vue';
import Switch from '../components/Switch.vue';
import Input from '../components/Input.vue';
import Slider from '../components/Slider.vue';
import TreeView, { type TreeNode } from '../templates/TreeView.vue';
import { useUser } from '../stores/user';
import { getUserPermissionInGroup } from '../networks/backend/admin';
import { getClass } from '../networks/backend/class';
import { isAdmin } from '../dataClasses/Permission';
import type { KnowledgePointId } from '../dataClasses/Ids';
import type { Practice } from '../dataClasses/Practice';
import type { AnswerType } from '../dataClasses/Question';
import type { Quiz } from '../dataClasses/Quiz';
import { avatarUrl } from '../networks/sso/avatar';
import Image from '../components/Image.vue';
import { router } from '../main';
import debounce from '../utils/debounce';
import { useNotification } from '../stores/notification';
import { getKnowledgePointList, type KnowledgePointTree } from '../networks/backend/knowledgePoint';
import FolderOutlineIcon from 'vue-material-design-icons/FolderOutline.vue';
import CheckboxBlankOutlineIcon from 'vue-material-design-icons/CheckboxBlankOutline.vue';
import MinusBoxMultipleOutlineIcon from 'vue-material-design-icons/MinusBoxMultipleOutline.vue';
import CheckboxMultipleBlankOutlineIcon from 'vue-material-design-icons/CheckboxMultipleBlankOutline.vue';
import CheckboxMarkedIcon from 'vue-material-design-icons/CheckboxMarked.vue';
import CheckboxMultipleMarked from 'vue-material-design-icons/CheckboxMultipleMarked.vue';
import ResizableWrapper from '../components/ResizableWrapper.vue';
import Spacer from '../components/Spacer.vue';

const loading = ref(true);
const route = useRoute();
const id = Number(route.params.id);

type GetPracticeResult = Awaited<ReturnType<typeof _getPractice>>;
const data = ref<GetPracticeResult | null>(null);
const clazzName = ref('');
const practice = computed(() => data.value?.practice as Practice | undefined);
const quizzes = computed(() => (data.value?.quizzes || []) as Quiz<AnswerType | null, AnswerType | null, any | null>[]);
const completed = computed(() => !!data.value?.completed);
const users = computed(() => data.value?.users || []);

const admin = ref(false);

const knowledgePoints = ref<KnowledgePointTree[] | null>(null);
type NodeData = { select: boolean | null; updateSelect: () => void; };
const treeNodes = ref<TreeNode<NodeData>[]>([]);

const uiName = ref('');
const uiDescription = ref('');
const uiDueDate = ref('');
const uiAccuracyPercent = ref(0);
const uiSectionCount = ref(0);

const notification = useNotification();

function snapshotPractice(): Practice | null
{
    return practice.value ? JSON.parse(JSON.stringify(practice.value)) as Practice : null;
}

async function savePractice(immediate = false)
{
    if (!data.value || !data.value.practice) return;
    const base = data.value.practice;
    const body: Practice = {
        ...base,
        name: uiName.value,
        description: uiDescription.value,
        dueDate: uiDueDate.value ? new Date(uiDueDate.value).getTime() : null,
        accuracy: Math.max(0, Math.min(100, uiAccuracyPercent.value)) / 100,
        sectionCount: Math.max(1, Math.min(100, Number(uiSectionCount.value) || 1)),
    } as Practice;

    const prev = snapshotPractice();
    const doSend = () => updatePractice(body)
        .then(() =>
        {
            if (data.value && data.value.practice)
            {
                data.value.practice.name = body.name;
                data.value.practice.description = body.description;
                data.value.practice.dueDate = body.dueDate;
                data.value.practice.accuracy = body.accuracy;
                data.value.practice.sectionCount = body.sectionCount;
                data.value.practice.available = body.available;
            }
        })
        .catch((e) =>
        {
            if (prev)
            {
                uiName.value = prev.name;
                uiDescription.value = prev.description;
                uiDueDate.value = formatDateInput(prev.dueDate);
                uiAccuracyPercent.value = Math.round(prev.accuracy * 100);
                uiSectionCount.value = prev.sectionCount;
            }
            notification.addError('保存失败：' + (e?.message || '未知错误'));
        });
    if (immediate) return doSend();
    debouncedSave();
}

const debouncedSave = debounce(() => { savePractice(true); }, 500);

function toTreeNode(node: KnowledgePointTree): TreeNode<NodeData> | null
{
    const children = node.children.map(toTreeNode).filter((c): c is TreeNode<NodeData> => !!c);
    let res: TreeNode<NodeData> = {
        id: node.info.id,
        expand: false,
        icon: markRaw(node.info.folder ? FolderOutlineIcon : CheckboxMarkedIcon),
        label: node.info.name,
        children,
        folder: node.info.folder,
        select: true,
        click()
        {
            if (this.folder)
            {
                this.expand = !this.expand;
                this.updateSelect();
            } else
            {
                this.select = !this.select;
                this.updateSelect();
                if (this.father) this.father.updateSelect();
                syncSelectedKp();
            }
        },
        clickIcon()
        {
            if (this.folder)
            {
                const target = this.select ? false : true;
                const toggle = (n: TreeNode<NodeData>) =>
                {
                    n.select = target;
                    n.children.forEach(toggle);
                };
                toggle(this);
                const updateAll = (n: TreeNode<NodeData>) =>
                {
                    n.updateSelect();
                    n.children.forEach(updateAll);
                };
                updateAll(this);
                syncSelectedKp();
            } else this.click();
        },
        updateSelect()
        {
            if (this.folder)
            {
                let all = true, any = false;
                for (const c of this.children)
                {
                    all &&= c.select === true;
                    any ||= c.select !== false;
                }
                const r = all ? true : any ? null : false;
                if (this.select !== r)
                {
                    this.select = r;
                    if (this.father) this.father.updateSelect();
                }
            }
            let icon;
            if (this.folder) icon = this.select ? CheckboxMultipleMarked : this.select === null ? MinusBoxMultipleOutlineIcon : CheckboxMultipleBlankOutlineIcon;
            else icon = this.select ? CheckboxMarkedIcon : CheckboxBlankOutlineIcon;
            this.icon = markRaw(icon);
        },
    } as any;
    return res;
}

function buildTreeSelected()
{
    if (!knowledgePoints.value) return;
    const set = new Set(practice.value?.knowledgePoints || []);
    const build = (n: TreeNode<NodeData>) =>
    {
        if (!n.folder) n.select = set.has(n.id as number);
        n.children.forEach(build);
        n.updateSelect();
    };
    treeNodes.value = knowledgePoints.value.map(toTreeNode).filter((x): x is TreeNode<NodeData> => !!x);
    treeNodes.value.forEach(build);
}

function getSelectedKp(nodes: TreeNode<NodeData>[] = treeNodes.value): KnowledgePointId[]
{
    const ids: KnowledgePointId[] = [];
    nodes.forEach(n =>
    {
        if (n.folder) ids.push(...getSelectedKp(n.children));
        else if (n.select) ids.push(n.id as KnowledgePointId);
    });
    return ids;
}

const debouncedSaveKp = debounce((body: Practice) =>
{
    updatePractice(body)
        .then(() =>
        {
            if (data.value && data.value.practice)
                data.value.practice.knowledgePoints = body.knowledgePoints;
        })
        .catch((e) =>
        {
            buildTreeSelected();
            notification.addError('保存失败：' + (e?.message || '未知错误'));
        });
}, 400);

function syncSelectedKp()
{
    if (!data.value) return;
    const nextKp = getSelectedKp();
    const base = data.value.practice;
    const body: Practice = {
        ...base,
        name: uiName.value,
        description: uiDescription.value,
        dueDate: uiDueDate.value ? new Date(uiDueDate.value).getTime() : null,
        accuracy: Math.max(0, Math.min(100, uiAccuracyPercent.value)) / 100,
        sectionCount: Math.max(1, Math.min(100, Number(uiSectionCount.value) || 1)),
        knowledgePoints: nextKp,
    } as Practice;
    debouncedSaveKp(body);
}

function onChangeAvailable() 
{
    if (!data.value || !data.value.practice) return;
    const prev = snapshotPractice();
    const base = data.value.practice;
    const body: Practice = {
        ...base,
        name: uiName.value,
        description: uiDescription.value,
        dueDate: uiDueDate.value ? new Date(uiDueDate.value).getTime() : null,
        accuracy: Math.max(0, Math.min(100, uiAccuracyPercent.value)) / 100,
        sectionCount: Math.max(1, Math.min(100, Number(uiSectionCount.value) || 1)),
        available: !base.available,
    } as Practice;
    updatePractice(body)
        .then(() => 
        {
            if (data.value && data.value.practice) data.value.practice.available = body.available;
        })
        .catch((e) => 
        {
            if (prev && data.value && data.value.practice) data.value.practice.available = prev.available;
            notification.addError('保存失败：' + (e?.message || '未知错误'));
        });
}

function onChangeSectionCount(v: number) 
{ 
    if (!data.value || !data.value.practice) return; 
    uiSectionCount.value = v; 
    savePractice(); 
}
function onChangeAccuracyPercent(v: number) 
{ 
    if (!data.value || !data.value.practice) return; 
    uiAccuracyPercent.value = v; 
    savePractice(); 
}
function onChangeName(v: string) 
{ 
    if (!data.value || !data.value.practice) return; 
    uiName.value = v;
    savePractice(); 
}
function onChangeDescription(v: string) 
{
    if (!data.value || !data.value.practice) return;
    uiDescription.value = v;
    savePractice();
}
function onChangeDueDate(str: string) 
{
    if (!data.value || !data.value.practice) return;
    uiDueDate.value = str;
    savePractice();
}

function formatDateInput(ts: number | null): string
{
    if (!ts) return '';
    const d = new Date(ts);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function calcQuizAccuracy(q: Quiz<AnswerType | null, AnswerType | null, any | null>): number | null
{
    if (!q.correct) return null;
    let total = 0, correct = 0;
    q.correct.forEach(section => section.forEach(c => { total++; if (c) correct++; }));
    return total > 0 ? Math.round(correct / total * 100) : null;
}

const bestAccuracy = computed(() =>
{
    const list = quizzes.value.map(calcQuizAccuracy).filter((x): x is number => x !== null);
    return list.length ? Math.max(...list) : null;
});

async function init() 
{
    loading.value = true;
    const res = await _getPractice(id);
    data.value = res;
    const clazz = await getClass(res.practice.clazz);
    clazzName.value = clazz.name;
    const user = useUser();
    if (user.hasAdmin()) admin.value = true;
    else admin.value = isAdmin(await getUserPermissionInGroup(clazz.group, user.userId()));
    knowledgePoints.value = await getKnowledgePointList(clazz.group);
    buildTreeSelected();
    uiName.value = res.practice.name;
    uiDescription.value = res.practice.description;
    uiDueDate.value = formatDateInput(res.practice.dueDate);
    uiAccuracyPercent.value = Math.round(res.practice.accuracy * 100);
    uiSectionCount.value = res.practice.sectionCount;
    loading.value = false;
}
init();

function onStartPractice()
{
    startPractice(id).then((quizId) => router.push('/quiz?id=' + quizId));
}

</script>

<template>
    <Loading v-if="loading" />
    <Card v-else class="content" scroll>
        <Text class="main-title">{{ practice?.name || '练习' }}</Text>
        <div class="desc">{{ practice?.description || '暂无描述' }}</div>

        <div class="row">
            <span>是否发布：</span>
            <Switch v-if="admin && practice" :on="practice.available" :onClick="onChangeAvailable" />
            <span v-else>{{ practice?.available ? '已发布' : '未发布' }}</span>
        </div>

        <div v-if="admin && practice" class="edit-panel">
            <div class="field" style="width: fit-content;">
                <label>名称</label>
                <Input :area="false" :model-value="uiName" @update:model-value="onChangeName" />
            </div>
            <ResizableWrapper class="field" height-resizable s>
                <label>描述</label>
                <Input :area="true" :model-value="uiDescription" @update:model-value="onChangeDescription" style="resize: none; flex-grow: 1;" />
            </ResizableWrapper>
            <div class="field-row">
                <div class="field">
                    <label>截止时间</label>
                    <input class="native-input" type="datetime-local" :value="uiDueDate" @change="(e: any) => onChangeDueDate(e.target.value)" />
                </div>
                <div class="field">
                    <label>目标正确率(%)</label>
                    <Input :area="false" type="number" :model-value="uiAccuracyPercent"
                        @update:model-value="(v: number) => onChangeAccuracyPercent(Number(v))" />
                    <Slider :min-value="0" :max-value="100" :step="1" :model-value="uiAccuracyPercent" @update:model-value="onChangeAccuracyPercent" />
                </div>
                <div class="field">
                    <label>题目数量</label>
                    <Input :area="false" type="number" :model-value="uiSectionCount" @update:model-value="(v: number) => onChangeSectionCount(Number(v))" />
                </div>
            </div>
        </div>

        <div v-if="admin && knowledgePoints" class="kp">
            <p class="title">选择知识点</p>
            <div class="kp-container scrollbar">
                <TreeView v-model="treeNodes" />
            </div>
        </div>

        <template v-if="!admin">
            <div class="info-grid">
                <div>题目数量：{{ practice?.sectionCount }}</div>
                <div>目标正确率：{{ practice ? Math.round(practice.accuracy * 100) : 0 }}%</div>
                <div>截止时间：{{ practice?.dueDate ? new Date(practice.dueDate).toLocaleString() : '无' }}</div>
                <div>所属班级：{{ clazzName }}</div>
            </div>
            <Spacer />
            <div class="student">
                <div>完成状态：<span :style="{ color: completed ? 'green' : 'red' }">{{ completed ? '已完成' : '未完成' }}</span>
                </div>
                <div>最高正确率：{{ bestAccuracy === null ? '暂无' : bestAccuracy + '%' }}</div>
                <div class="ops">
                    <Button @click="onStartPractice">开始测试</Button>
                </div>
            </div>
            <div class="quizzes">
                <p class="title">我的作答记录</p>
                <div v-if="quizzes.length === 0" class="empty">暂无记录</div>
                <div v-else class="quiz-list">
                    <Card v-for="q in quizzes" :key="q.id" :max-tilt="5" class="quiz-item"
                        @click="router.push('/quiz?id=' + q.id)">
                        <div>开始时间：{{ new Date(q.time).toLocaleString() }}</div>
                        <div>题目数量：{{ q.sections.length }}</div>
                        <div>状态：{{ q.finished ? '已完成' : '进行中' }}</div>
                        <div>正确率：{{ calcQuizAccuracy(q) === null ? '未知' : calcQuizAccuracy(q) + '%' }}</div>
                    </Card>
                </div>
            </div>
        </template>

        <div class="users">
            <p class="title">成员完成情况</p>
            <div v-if="users.length === 0" class="empty">暂无数据</div>
            <div v-else class="user-list">
                <Card v-for="u in users" :key="u.member.user" class="user-item" :max-tilt="5">
                    <div class="box">
                        <Image class="avatar" :src="avatarUrl(u.member.user)" />
                        <div class="meta">
                            <div class="name">{{ u.member.seiue.realName }}</div>
                            <div>正确率：<span :style="{ color: u.completed ? 'green' : 'red' }">{{ u.accuracy === null ?
                                '暂无' :
                                Math.round(u.accuracy * 100) + '%' }}</span></div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    </Card>
</template>

<style scoped lang="scss">
.content {
    display: flex;
    flex-direction: column;
    height: calc(100% - 20px);
    width: calc(100% - 26px);
    margin-top: 7px;
}

.main-title {
    margin: 20px 0 0 20px;
    font-size: 1.5em;
    font-weight: bold;
}

.desc {
    margin: 10px 20px;
    opacity: 0.8;
}

.row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 20px;
}

.edit-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px 20px;
}

.field-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(220px, 1fr));
    gap: 10px;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.native-input {
    height: 36px;
    background: var(--bgcolor);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0 10px;
}

.kp {
    margin: 10px 20px;
}

.kp-container {
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px;
    max-height: 320px;
    overflow: auto;
    scrollbar-width: none;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 10px;
    padding: 10px 20px;
}

.student {
    margin: 10px 20px;
}

.ops {
    margin-top: 10px;
}

.quizzes {
    margin: 10px 20px;
}

.quiz-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
    gap: 10px;
}

.quiz-item {
    padding: 15px 20px;
    cursor: pointer;
}

.users {
    margin: 10px 20px;
}

.user-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
    gap: 10px;
}

.user-item {
    padding: 10px 15px;
}

.box {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
}

.avatar {
    min-width: 50px;
    min-height: 50px;
    max-width: 50px;
    max-height: 50px;
    border-radius: 50%;
}

.meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.title {
    font-weight: bold;
    margin: 10px 0;
}

.empty {
    opacity: 0.6;
    padding: 10px;
}
</style>