<script setup lang="tsx">

import Loading from "../../components/Loading.vue";
import { useRoute, useRouter } from "vue-router";
import { markRaw, ref, watch, type Component } from "vue";
import Card from "../../components/Card.vue";
import { useUser } from "../../stores/user.ts";
import Text from "../../components/Text.vue";
import type { KnowledgePointId, PreparationGroupId, SectionId, SectionTypeId } from "../../dataClasses/Ids.ts";
import NotFound from "../NotFound.vue";
import Spacer from "../../components/Spacer.vue";
import type { PreparationGroup } from "../../dataClasses/PreparationGroup.ts";
import { getPreparationGroup } from "../../networks/backend/preparationGroup.ts";
import { createKnowledgePoint, deleteKnowledgePoint, getKnowledgePointList, updateKnowledgePoint, type KnowledgePointTree } from "../../networks/backend/knowledgePoint.ts";
import SquareEditOutlineIcon from "vue-material-design-icons/SquareEditOutline.vue";
import TreeView, { type TreeNode } from "../../templates/TreeView.vue";
import { getUserPermissionInGroup } from "../../networks/backend/admin.ts";
import { isAdmin } from "../../dataClasses/Permission.ts";
import type { KnowledgePoint } from "../../dataClasses/KnowledgePoint.ts";
import type { SectionType } from "../../dataClasses/SectionType.ts";
import type { Slice } from "../../dataClasses/Slice.ts";
import type { Section } from "../../dataClasses/Section.ts";
import type { AnswerType } from "../../dataClasses/Question.ts";
import { deleteSectionType, getSectionList, getSectionTypeList, modifySectionType, newSectionType } from "../../networks/backend/section.ts";
import PlusIcon from "vue-material-design-icons/Plus.vue";
import Input from "../../components/Input.vue";
import DeleteIcon from "vue-material-design-icons/Delete.vue";
import FolderPlusIcon from "vue-material-design-icons/FolderPlus.vue";
import AdjustIcon from "vue-material-design-icons/Adjust.vue";
import FolderIcon from "vue-material-design-icons/Folder.vue";
import PlusCircleOutlineIcon from "vue-material-design-icons/PlusCircleOutline.vue";
import Button from "../../components/Button.vue";
import TextBoxPlusOutlineIcon from "vue-material-design-icons/TextBoxPlusOutline.vue";
import { getSectionBrief, inputDialog, pushUrl } from "../../utils/utils.tsx";
import Pagination from "../../components/Pagination.vue";

import FolderOutlineIcon from "vue-material-design-icons/FolderOutline.vue";
import FolderOpenOutlineIcon from "vue-material-design-icons/FolderOpenOutline.vue";
import CheckboxBlankOutlineIcon from "vue-material-design-icons/CheckboxBlankOutline.vue";
import MinusBoxMultipleOutlineIcon from "vue-material-design-icons/MinusBoxMultipleOutline.vue";
import CheckboxMultipleBlankOutlineIcon from "vue-material-design-icons/CheckboxMultipleBlankOutline.vue";
import CheckboxMarkedIcon from "vue-material-design-icons/CheckboxMarked.vue";
import CheckboxMultipleMarked from "vue-material-design-icons/CheckboxMultipleMarked.vue";
import Slider from "../../components/Slider.vue";
import { useNotification } from "../../stores/notification.ts";
import ShieldCrownOutlineIcon from "vue-material-design-icons/ShieldCrownOutline.vue";
import Split from "../../templates/Split.vue";

document.title = '备课组 - SubQuiz';

const { onClickSection, group: rawGroup } = defineProps<{ onClickSection?: (SectionId) => void, group?: PreparationGroupId }>();

const user = useUser();
const route = useRoute();
const router = useRouter();
const notification = useNotification();
const group = rawGroup || Number(route.params.id) as PreparationGroupId;
const groupInfo = ref(void 0 as undefined | null | PreparationGroup);
const knowledgePoints = ref(void 0 as KnowledgePointTree[] | undefined);
const hasPermission = ref(undefined as undefined | boolean);

const findKp = (id: KnowledgePointId, kps: KnowledgePointTree[] = knowledgePoints.value ?? []): KnowledgePointTree | null => {
    if (!id) return null;
    for (const kp of kps)
    {
        if (kp.info.id === id) return kp;
        const res = findKp(id, kp.children);
        if (res) return res;
    }
    return null;
}

const reload = async (kp?: KnowledgePointId) => {

    try
    {
        let value = await getPreparationGroup(group);
        groupInfo.value = value;
        knowledgePoints.value = await getKnowledgePointList(value.id);
        hasPermission.value = user.hasAdmin() || isAdmin(await getUserPermissionInGroup(group, user.userId()));
        changeKP(findKp(kp ?? current.value.knowledgePoint?.id ?? Number(route.query.kp)));
    }
    catch (e)
    {
        groupInfo.value = null;
        knowledgePoints.value = null;
        hasPermission.value = false;
        changeKP(null);
    }
}

reload(Number(route.query.kp));

function editGroup()
{
    router.push('/admin/group/edit/' + group + '?subject=' + groupInfo.value?.subject)
}

function gotoAdmin()
{
    router.push('/admin/admins?group=' + group);
}


function toTreeNode(node: KnowledgePointTree, selectable: boolean): TreeNode<{ select: boolean; updateSelect: () => void; }> | null
{
    const children = node.children.map(child => toTreeNode(child, selectable)).filter(child => child !== null);
    if (selectable && children.length === 0 && node.info.folder) return null;
    let res: TreeNode<{ select: boolean; updateSelect: () => void; }> = {
        id: node.info.id,
        expand: false,
        icon: markRaw(selectable ? (node.info.folder ? CheckboxMultipleMarked : CheckboxMarkedIcon) : (node.info.folder ? FolderOutlineIcon : AdjustIcon)),
        label: node.info.name,
        children: children,
        folder: node.info.folder,
        select: true,

        click()
        {
            if (!selectable) changeKP(node);
            else if (this.folder) 
            {
                this.expand = !this.expand;
                this.updateSelect();
            }
            else
            {
                this.select = !this.select;
                this.updateSelect();
                if (this.father) this.father.updateSelect();
            }
        },

        clickIcon() 
        {
            if (!selectable)
            {
                if (this.folder) 
                {
                    this.expand = !this.expand;
                    this.icon = markRaw(this.expand ? FolderOpenOutlineIcon : FolderOutlineIcon);   
                }
                else changeKP(node);
            }
            else if (this.folder) 
            {
                if (!this.select) this.children.forEach(child => {if (!child.select) child.clickIcon();});
                else this.children.forEach(child => {if (child.select) child.clickIcon();});
                this.updateSelect();
            }
            else this.click();
        },

        updateSelect()
        {
            if (this.folder)
            {
                let allSelect = true;
                let hasSelect = false;
                for (const child of this.children)
                {
                    allSelect &&= child.select;
                    hasSelect ||= (child.select !== false);
                }
                const rSelect = allSelect ? true : hasSelect ? null : false;                
                if (this.select !== rSelect)
                {
                    this.select = rSelect;
                    if (this.father) this.father.updateSelect();
                }
            }

            let icon: Component;
            if (selectable)
            {
                if (this.folder) icon = this.select ? CheckboxMultipleMarked : this.select === null ? MinusBoxMultipleOutlineIcon : CheckboxMultipleBlankOutlineIcon;
                else icon = this.select ? CheckboxMarkedIcon : CheckboxBlankOutlineIcon;
            }
            else icon = this.folder ? (this.expand ? FolderOpenOutlineIcon : FolderOutlineIcon) : AdjustIcon;
            this.icon = markRaw(icon);
        }
    };
    return res;
}

const treeNodes = ref<TreeNode<{ select: boolean; updateSelect: () => void; }>[]>([]);
watch(knowledgePoints, (newValue) => {
    if (newValue)
        treeNodes.value = newValue.map(t => toTreeNode(t, !hasPermission.value));
}, { immediate: true });

function createKP(folder: boolean)
{
    inputDialog(
        <>请输入新的{folder ? '文件夹' : '知识点'}名称</>,
        (label: string) => {
            createKnowledgePoint({
                name: label,
                folder: folder,
                group: group,
                father: current.value.knowledgePoint?.id ?? null,
            }).then(() => {
                reload();
            });
        }
    );
}

interface Node
{
    knowledgePoint: KnowledgePoint | null;
    children: KnowledgePointTree[] | null;
    sectionTypes: SectionType[] | null;
    sectionType: SectionTypeId | null;
    page: number;
    sections: Slice<Section<AnswerType, null, any>> | null;
}

const sectionCount = 30;
const current = ref<Node>({
    knowledgePoint: null,
    sectionType: null,
    page: 1,

    children: null,
    sectionTypes: null,
    sections: null,
});

watch(() => current.value.knowledgePoint?.id, (newValue) => {
    if (newValue && !rawGroup)
    {
        pushUrl('/admin/group/' + group, { 'kp': newValue + '' });
    }
});

function renameKP()
{
    inputDialog(
        <>为知识点{current.value.knowledgePoint?.name}重命名</>,
        (label: string) => {
            if (current.value.knowledgePoint)
            {
                current.value.knowledgePoint.name = label;
                updateKnowledgePoint(current.value.knowledgePoint).then(() => reload());
            }
        }
    );
}

function deleteKP()
{
    if (current.value.knowledgePoint) 
    {
        inputDialog(
            <>警告：<br/>将删除知识点及其中的全部子知识点和题目，<br/>输入“确认删除{current.value.knowledgePoint.name}”以确认删除</>,
            (value: string) => {
                if (current.value.knowledgePoint && value === `确认删除${current.value.knowledgePoint.name}`)
                    deleteKnowledgePoint(current.value.knowledgePoint.id).then(reload);
            }
        );   
    }
}

function changeKP(kp: KnowledgePointTree | null)
{
    current.value.knowledgePoint = kp?.info ?? null;
    if (kp === null) current.value.children = knowledgePoints.value ?? null;
    else current.value.children = kp.info.folder ? kp.children : null;
    
    if (hasPermission.value) updateTypes();
}

function updateTypes()
{
    current.value.sectionType = null;
    current.value.page = 1;
    loadingPage.value = true;

    if (current.value.knowledgePoint && !current.value.knowledgePoint.folder)
    {
        getSectionTypeList(current.value.knowledgePoint.id)
            .then(value => {
                current.value.sectionTypes = value;
                fetchSections();
            });
    }
    else 
    {
        loadingPage.value = false;
        current.value.sectionTypes = null;
        current.value.sections = null;
    }
}

function changeType(id: SectionTypeId | null)
{
    current.value.sectionType = id;
    current.value.page = 1;
    fetchSections();
}

async function fetchSections()
{
    loadingPage.value = true;
    try
    {
        if (current.value.knowledgePoint && !current.value.knowledgePoint.folder)
            current.value.sections = await getSectionList(
                sectionCount * (current.value.page - 1),
                sectionCount,
                current.value.knowledgePoint.id,
                current.value.sectionType ?? undefined
            )
        else 
            current.value.sections = null;
    }
    finally
    {
        loadingPage.value = false;
    }
}

function addNewSectionType()
{
    inputDialog(
        <>请输入新的题目类型名称</>,
        (label: string) => {
            newSectionType(current.value.knowledgePoint.id, label).then(updateTypes);
        },
    );
}

function gotoSection(section: Section<AnswerType, any, any>)
{
    if (onClickSection) onClickSection(section.id);
    else router.push('/admin/section/' + section.id);
}

function createSection(type: SectionTypeId)
{
    router.push('/admin/section/new?type=' + type);
}

function renameSectionType()
{
    if (current.value.sectionType)
    {
        inputDialog(
            <>重命名题目类型{current.value.sectionTypes?.find(type => type.id === current.value.sectionType)?.name}</>,
            (label: string) => {
                if (current.value.sectionType)
                {
                    const type = current.value.sectionTypes?.find(type => type.id === current.value.sectionType);
                    modifySectionType(current.value.sectionType, type.knowledgePoint, label).then(() => 
                    {
                        updateTypes();
                        changeType(type.id);
                    });
                }
            }
        );
    }
}

function removeSectionType()
{
    if (current.value.sectionType)
    {
        inputDialog(
            <>
                警告：<br/>
                将删除题目类型及其中的全部题目，<br/>
                输入“确认删除{current.value.sectionTypes?.find(type => type.id === current.value.sectionType)?.name}”以确认删除
            </>,
            (value: string) => {
                if (current.value.sectionType && value === `确认删除${current.value.sectionTypes?.find(type => type.id === current.value.sectionType)?.name}`)
                    deleteSectionType(current.value.sectionType).then(updateTypes);
            },
        );
    }
}

function getTotalPage()
{
    if (current.value.sections)
    {
        return Math.ceil(current.value.sections.totalSize / sectionCount) || 1;
    }
    return 1;
}

const loadingPage = ref(false);
function changePage(page: number)
{
    loadingPage.value = true;
    current.value.page = page;
    fetchSections().finally(() => loadingPage.value = false);
}

// quiz

const count = ref(10);

const getSelectedKp = (node: TreeNode<{ select: boolean; updateSelect: () => void; }>[] = treeNodes.value) => 
{
    const ids = [] as KnowledgePointId[];
    node.forEach(n => {
        if (n.folder) ids.push(...getSelectedKp(n.children));
        else if (n.select) ids.push(n.id as KnowledgePointId);
    });
    return ids;
}

function startQuiz()
{
    if (count.value <= 0)
    {
        notification.addError('题目数量必须大于0');
        return;
    }
    if (count.value > 100)
    {
        notification.addError('题目数量不能超过100');
        return;
    }
    if (count.value !== parseInt(count.value.toString()))
    {
        notification.addError('题目数量必须为整数');
        return;
    }
    const ids = getSelectedKp();
    if (ids.length === 0)
    {
        notification.addError('请至少选择一个知识点');
        return;
    }
    router.push(`/quiz?count=${count.value}` + ids.map(kp => `&kp=${kp}`).join(''));
}

</script>

<template>
    <NotFound v-if="groupInfo === null" />
    <Loading v-else-if="knowledgePoints === undefined || groupInfo === undefined" class="loading" />
    <Split v-else class="section-types-container" initial-left-width="20%" min-right-width="390px" min-left-width="230px">
        <template #left>
            <Card class="sidebar">
                <Text class="main-title" style="display: flex;">
                    <quiz-empty @click="changeKP(null)" class="clickable"> {{ groupInfo.name }} </quiz-empty>
                    <Text v-if="hasPermission" style="color: darkgray; margin-left: 5px;" @click="editGroup"
                        class="clickable">
                        <SquareEditOutlineIcon />
                    </Text>
                    <Text v-if="hasPermission" style="color: darkgray; margin-left: 5px;" @click="gotoAdmin"
                        class="clickable">
                        <ShieldCrownOutlineIcon />
                    </Text>
                </Text>
                <Text class="main-description">{{ groupInfo.description }}</Text>
                <Spacer />
                <TreeView v-if="knowledgePoints" v-model="treeNodes" />
                <div v-if="knowledgePoints?.length === 0" class="no-section-types">
                    暂无知识点
                </div>
            </Card>
        </template>
        <template #right>
            <Card class="content">
                <Text v-if="current.knowledgePoint && hasPermission" class="main-title" style="display: flex;">
                    {{ current.knowledgePoint.name }}
                    <Text v-if="hasPermission" style="color: darkgray; margin-left: 5px;" class="clickable">
                        <SquareEditOutlineIcon @click="renameKP" class="clickable" />
                        <DeleteIcon @click="deleteKP" class="clickable" style="margin-left: 5px;" />
                    </Text>
                </Text>
                <Text v-else class="main-title" style="display: flex;">
                    {{ groupInfo.name }}
                </Text>
                <Spacer />

                <!-- 题目列表 -->
                <template v-if="hasPermission && current.sectionTypes !== null">
                    <div style="display: flex; margin-left: 20px;">
                        <p style="min-width: 110px; margin-top: 20px;">题目类型:</p>
                        <div style="display: flex; align-items: center; flex-wrap: wrap;">
                            <Button :down="current.sectionType == null" @click="changeType(null)">全部
                            </Button>
                            <Button v-for="type in current.sectionTypes" :key="type.id"
                                :down="current.sectionType == type.id" @click="changeType(type.id)">
                                {{ type.name }}
                            </Button>
                            <PlusIcon class="clickable" @click="addNewSectionType" />
                        </div>
                    </div>

                    <quiz-sections-ops v-if="current.sectionType">
                        <Button @click="createSection(current.sectionType)">
                            <TextBoxPlusOutlineIcon />
                            创建新题目
                        </Button>
                        <Button @click="renameSectionType">
                            <SquareEditOutlineIcon />
                            修改题目类型
                        </Button>
                        <Button @click="removeSectionType">
                            <DeleteIcon />
                            删除题目类型
                        </Button>
                    </quiz-sections-ops>
                    <quiz-empty v-if="loadingPage" style="flex-grow: 1;">
                        <Loading/>
                    </quiz-empty>
                    <quiz-sections-empty v-else-if="current.sections && current.sections.list.length === 0">
                        <p> 此知识点暂无题目 </p>
                    </quiz-sections-empty>
                    <quiz-sections-wrapper v-else-if="current.sections">
                        <Card :max-tilt="5" v-for="section in current.sections.list" :key="section.id" @click="gotoSection(section)"
                            class="clickable">
                            <Text>小题数量：{{ section.questions.length }}</Text>
                            <Text>题目类型：{{ current.sectionTypes.find(type => type.id === section.type)?.name }}</Text>
                            <Spacer />
                            <p class="description">
                                {{ getSectionBrief(section) }}
                            </p>
                        </Card>
                    </quiz-sections-wrapper>
                    <Pagination v-if="current.sections" :count="getTotalPage()" :current="current.page" @change-page="changePage" :disabled="loadingPage" />
                </template>
                <!--  文件夹 -->
                <template v-else-if="hasPermission">
                    <div v-if="current.children !== null" style="display: flex;">
                        <Button @click="createKP(true)">
                            <FolderPlusIcon />
                        </Button>
                        <Button @click="createKP(false)">
                            <PlusCircleOutlineIcon />
                        </Button>
                    </div>

                    <quiz-children-wrapper v-if="current.children !== null">
                        <Card v-for="kp in current.children" :key="kp.info.id" @click="changeKP(kp)" class="clickable">
                            <FolderIcon v-if="kp.info.folder" />
                            <AdjustIcon v-else />
                            <Text>{{ kp.info.name }}</Text>
                        </Card>
                    </quiz-children-wrapper>
                    <quiz-children-empty v-if="current.children !== null && current.children.length === 0">
                        <p> 此文件夹暂无子知识点 </p>
                    </quiz-children-empty>
                </template>
                <!--  没有权限 -->
                <quiz-main-container v-else>
                    <Card>
                        <p class="main-title">开始新的测试</p>
                        <p style="display: flex; align-items: center; justify-content: center;">在左侧选择知识点以开始测试</p>
                        <p class="title" style="display: flex; align-items: center; justify-content: center;">题目数量</p>
                        <Input :area="false" placeholder="Section Count" type="number" v-model="count" />
                        <Slider :min-value="0" :max-value="100" :step="1" v-model="count" />
                        <quiz-main-button-container>
                            <Button @click="startQuiz">开始测试</Button>
                        </quiz-main-button-container>
                    </Card>
                </quiz-main-container>
            </Card>
        </template>
    </Split>
</template>

<style scoped lang="scss">


.section-types-container {
    display: flex;
    width: 100%;
    height: 100%;

    .no-section-types {
        margin: 20px auto;
    }

    .create-subject {
        margin: 20px 0 0 20px ;
    }

    .main-title {
        margin: 20px 0 0 20px;
        font-size: 1.5em;
        font-weight: bold;
    }

    .main-description {
        margin: 20px 0px 0px 20px;
    }

    .section-types-container-header {
        display: flex;
        flex-direction: row;
        justify-content: start;
        gap: 20px;
        margin: 0 0 20px 0px;
    }
}

.section-types {
    margin: 20px 0 0 0;
    display: grid;
    flex-grow: 1;
    grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
    justify-content: start;
    overflow-y: auto;
    scrollbar-width: none;
}

.section-type {
    padding: 15px 30px 30px 30px;
    height: 200px;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    margin: 20px;

    .description {
        overflow: hidden;
        white-space: nowrap;
    }
}

.title {
    font-size: 1.25em;
    margin-bottom: 0px;
    font-weight: bold;
}

.pagination {
    width: calc(min(100%, 800px));
    margin: 20px auto;
}

.clickable {
    cursor: pointer;
}

.sidebar {
    display: flex;
    flex-direction: column;
    height: calc(100% - 20px);
    width: calc(100% - 26px);
    padding-right: 20px;
}

.content {
    display: flex;
    flex-direction: column;
    height: calc(100% - 20px);
    width: calc(100% - 26px);
    flex-grow: 1;
}

quiz-children-wrapper {
    display: block;
    margin: 20px 0 0 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    justify-content: start;
    overflow-y: auto;
    scrollbar-width: none;
}

quiz-children-wrapper > quiz-card {
    display: flex;
    flex-direction: row;
}

quiz-children-wrapper > quiz-card > quiz-text {
    display: flex;
    flex-grow: 1;
    justify-content: center;
    align-items: center;
}

quiz-children-empty {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
    font-size: 1.5em;
}

quiz-sections-empty {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
    font-size: 1.5em;
}

quiz-sections-wrapper {
    margin: 20px 0 0 0;
    display: grid;
    flex-grow: 1;
    grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
    justify-content: start;
    overflow-y: auto;
    scrollbar-width: none;
}

quiz-sections-wrapper > quiz-card {
    padding: 15px 30px 30px 30px;
    height: 240px;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    margin: 20px;
    cursor: pointer;

    .description {
        margin-bottom: 0;
        overflow: hidden;
    }
}

quiz-sections-ops {
    display: flex;
    flex-direction: row;
}

quiz-sections-ops > quiz-button {
    margin-left: 20px;
}

quiz-pagination {
    width: calc(min(100%, 800px));
    margin: auto auto 20px auto;
}

quiz-main-container {
    display: flex;
    height: 100%;
    width: 100%;
    justify-content: center;
    align-items: center;

    .title {
        margin: 10px;
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
}
</style>