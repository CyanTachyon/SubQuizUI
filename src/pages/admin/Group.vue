<script setup lang="ts">

import Loading from "../../components/Loading.vue";
import { useRoute, useRouter } from "vue-router";
import { markRaw, ref, watch, type Component } from "vue";
import Card from "../../components/Card.vue";
import { useUser } from "../../stores/user.ts";
import Text from "../../components/Text.vue";
import type { KnowledgePointId, PreparationGroupId, SectionTypeId } from "../../dataClasses/Ids.ts";
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
import StatusButton from "../../components/StatusButton.vue";
import type { SectionType } from "../../dataClasses/SectionType.ts";
import type { Slice } from "../../dataClasses/Slice.ts";
import type { Section } from "../../dataClasses/Section.ts";
import type { AnswerType } from "../../dataClasses/Question.ts";
import { deleteSectionType, getSectionList, getSectionTypeList, modifySectionType, newSectionType } from "../../networks/backend/section.ts";
import PlusIcon from "vue-material-design-icons/Plus.vue";
import Dialog from "../../components/Dialog.vue";
import Input from "../../components/Input.vue";
import DeleteIcon from "vue-material-design-icons/Delete.vue";
import FolderPlusIcon from "vue-material-design-icons/FolderPlus.vue";
import AdjustIcon from "vue-material-design-icons/Adjust.vue";
import FolderIcon from "vue-material-design-icons/Folder.vue";
import PlusCircleOutlineIcon from "vue-material-design-icons/PlusCircleOutline.vue";
import CommonButton from "../../components/CommonButton.vue";
import TextBoxPlusOutlineIcon from "vue-material-design-icons/TextBoxPlusOutline.vue";
import { pushUrl } from "../../utils/utils.ts";
import Pagination from "../../components/Pagination.vue";

import FolderOutlineIcon from "vue-material-design-icons/FolderOutline.vue";
import FolderOpenOutlineIcon from "vue-material-design-icons/FolderOpenOutline.vue";
import CheckboxBlankOutlineIcon from "vue-material-design-icons/CheckboxBlankOutline.vue";
import CheckboxMultipleBlankOutlineIcon from "vue-material-design-icons/CheckboxMultipleBlankOutline.vue";
import CheckboxMarkedIcon from "vue-material-design-icons/CheckboxMarked.vue";
import CheckboxMultipleMarked from "vue-material-design-icons/CheckboxMultipleMarked.vue";
import Slider from "../../components/Slider.vue";
import { useNotificationStore } from "../../stores/notification.ts";
import ShieldCrownOutlineIcon from "vue-material-design-icons/ShieldCrownOutline.vue";

const user = useUser();
const route = useRoute();
const router = useRouter();
const notification = useNotificationStore();
const group = Number(route.params.id) as PreparationGroupId;
const groupInfo = ref(void 0 as undefined | null | PreparationGroup);
const knowledgePoints = ref(void 0 as KnowledgePointTree[] | undefined);
const hasPermission = ref(undefined as undefined | boolean);

document.title = '备课组 - SubQuiz';

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

function toTreeNode(node: KnowledgePointTree, selectable: boolean)
{
    let res: TreeNode<{ select: boolean; updateSelect: () => void; }> = {
        id: node.info.id,
        expand: false,
        icon: markRaw(selectable ? (node.info.folder ? CheckboxMultipleMarked : CheckboxMarkedIcon) : (node.info.folder ? FolderOutlineIcon : AdjustIcon)),
        label: node.info.name,
        children: node.children.map(child => toTreeNode(child, selectable)),
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
                for (const child of this.children)
                {
                    if (!child.select)
                    {
                        allSelect = false;
                        break;
                    }
                }
                if (allSelect !== this.select)
                {
                    this.select = allSelect;
                    if (this.father) this.father.updateSelect();
                }
            }

            let icon: Component;
            if (selectable)
            {
                if (this.folder && !this.expand) icon = this.select ? CheckboxMultipleMarked : CheckboxMultipleBlankOutlineIcon;
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
    dialog.value = {
        text: `请输入新的${folder ? '文件夹' : '知识点'}名称`,
        submit: (label: string) => {
            createKnowledgePoint({
                name: label,
                folder: folder,
                group: group,
                father: current.value.knowledgePoint?.id ?? null,
            }).then(() => {
                reload();
            });
            dialog.value = null;
        },
        cancel: () => {
            dialog.value = null;
        }
    };
}

interface Node
{
    knowledgePoint: KnowledgePoint | null;
    children: KnowledgePointTree[] | null;
    sectionTypes: SectionType[] | null;
    sectionType: SectionTypeId | null;
    page: number;
    sections: Slice<Section<AnswerType, null, string>> | null;
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
    if (newValue)
    {
        pushUrl('/admin/group/' + group, { 'kp': newValue + '' });
    }
});

function renameKP()
{
    dialog.value = {
        text: `为知识点${current.value.knowledgePoint?.name}重命名`,
        submit: (label: string) => {
            if (current.value.knowledgePoint)
            {
                current.value.knowledgePoint.name = label;
                updateKnowledgePoint(current.value.knowledgePoint).then(() => reload());
                input.value = null;
            }
            dialog.value = null;
        },
        cancel: () => {
            dialog.value = null;
        }
    };
}

function deleteKP()
{
    if (current.value.knowledgePoint)
    {
        dialog.value = {
            text: `警告：<br>将删除知识点及其中的全部子知识点和题目，<br>输入“确认删除${current.value.knowledgePoint.name}”以确认删除`,
            submit: (value: string) => {
                if (current.value.knowledgePoint && value === `确认删除${current.value.knowledgePoint.name}`)
                    deleteKnowledgePoint(current.value.knowledgePoint.id).then(reload);
                
                dialog.value = null;
            },
            cancel: () => {
                dialog.value = null;
            }
        };
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

function fetchSections()
{
    if (current.value.knowledgePoint && !current.value.knowledgePoint.folder)
        getSectionList(
            sectionCount * (current.value.page - 1), 
            sectionCount, 
            current.value.knowledgePoint.id, 
            current.value.sectionType ?? undefined
        )
        .then(value => {
            current.value.sections = value;
        });
    else 
        current.value.sections = null;
}

function addNewSectionType()
{
    dialog.value = {
        text: `请输入新的题目类型名称`,
        submit: (label: string) => {
            newSectionType(current.value.knowledgePoint.id, label).then(updateTypes);
            dialog.value = null;
        },
        cancel: () => {
            dialog.value = null;
        }
    };
}

const dialog = ref<{ text?: string, submit: (str: string) => void, cancel: () => void } | null>(null);
const input = ref<string | null>(null);
watch(() => !!(dialog.value), (newValue) => {if (!newValue) input.value = null;}, { immediate: true });


function getSectionBrief(section: Section<AnswerType, any, string>)
{
    const qBrief = section
        .questions
        .map((q, i) => ({description: q.description, i}))
        .filter(q => q.description.trimStart().trimEnd() !== '')
        .map(q => `第${q.i + 1}题：${q.description}`)
        .join('\n');
    
    if (section.description.trimStart().trimEnd() === '')
    {
        if (qBrief.trimStart().trimEnd() === '') return '暂无描述';
        return qBrief;
    }
    return section.description + '\n' + qBrief;
}

function gotoSection(section: Section<AnswerType, any, string>)
{
    router.push('/admin/section/' + section.id);
}

function createSection(type: SectionTypeId)
{
    router.push('/admin/section/new?type=' + type);
}

function renameSectionType()
{
    if (current.value.sectionType)
    {
        dialog.value = {
            text: `重命名题目类型${current.value.sectionTypes?.find(type => type.id === current.value.sectionType)?.name}`,
            submit: (label: string) => {
                if (current.value.sectionType)
                {
                    const type = current.value.sectionTypes?.find(type => type.id === current.value.sectionType);
                    modifySectionType(current.value.sectionType, type.knowledgePoint, label).then(() => 
                    {
                        updateTypes();
                        changeType(type.id);
                    });
                    input.value = null;
                }
                dialog.value = null;
            },
            cancel: () => {
                dialog.value = null;
            }
        };
    }
}

function removeSectionType()
{
    if (current.value.sectionType)
    {
        dialog.value = {
            text: `警告：<br>将删除题目类型及其中的全部题目，<br>输入“确认删除${current.value.sectionTypes?.find(type => type.id === current.value.sectionType)?.name}”以确认删除`,
            submit: (value: string) => {
                if (current.value.sectionType && value === `确认删除${current.value.sectionTypes?.find(type => type.id === current.value.sectionType)?.name}`)
                    deleteSectionType(current.value.sectionType).then(updateTypes);
                
                dialog.value = null;
            },
            cancel: () => {
                dialog.value = null;
            }
        };
    }
}

function getTotalPage()
{
    if (current.value.sections)
    {
        return Math.ceil(current.value.sections.count / sectionCount);
    }
    return 1;
}

function changePage(page: number)
{
    current.value.page = page;
    fetchSections();
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

    <Dialog :open="!!dialog" @close="dialog?.cancel">
        <form autocomplete="off" @submit="(event) => { event.preventDefault(); dialog?.submit(input); }">
            <div v-if="dialog?.text" v-html="dialog.text"/>
            <Input placeholder="Enter here" v-model="input" class="dialog-input"/>
        </form>
    </Dialog>


    <NotFound v-if="groupInfo === null"/>
    <Loading v-else-if="knowledgePoints === undefined || groupInfo === undefined" class="loading"/>
    <div v-else class="section-types-container">
        <Card class="sidebar">
            <Text class="main-title" style="display: flex;">
                <quiz-empty @click="changeKP(null)" class="clickable"> {{ groupInfo.name }} </quiz-empty>
                <Text v-if="hasPermission" style="color: darkgray; margin-left: 5px;" @click="editGroup" class="clickable">
                    <SquareEditOutlineIcon/>
                </Text>
                <Text v-if="hasPermission" style="color: darkgray; margin-left: 5px;" @click="gotoAdmin" class="clickable">
                    <ShieldCrownOutlineIcon/>
                </Text>
            </Text>
            <Text class="main-description">{{ groupInfo.description }}</Text>
            <Spacer/>
            <TreeView v-if="knowledgePoints" v-model="treeNodes"/>
            <div v-if="knowledgePoints?.length === 0" class="no-section-types">
                暂无知识点
            </div>
        </Card>
        <Card class="content">
            <Text v-if="current.knowledgePoint && hasPermission" class="main-title" style="display: flex;">
                {{ current.knowledgePoint.name }}
                <Text v-if="hasPermission" style="color: darkgray; margin-left: 5px;" class="clickable">
                    <SquareEditOutlineIcon @click="renameKP" class="clickable"/>  
                    <DeleteIcon @click="deleteKP" class="clickable" style="margin-left: 5px;"/>
                </Text>
            </Text>
            <Text v-else class="main-title" style="display: flex;">
                {{ groupInfo.name }}
            </Text>
            <Spacer/>

            <!-- 题目列表 -->
            <template v-if="hasPermission && current.sectionTypes !== null">
                <div style="display: flex; margin-left: 20px;">
                    <p style="min-width: 110px; margin-top: 20px;">题目类型:</p>
                    <div style="display: flex; align-items: center; flex-wrap: wrap;">
                        <StatusButton :down="current.sectionType == null" @click="changeType(null)">全部</StatusButton>
                        <StatusButton 
                            v-for="type in current.sectionTypes"
                            :key="type.id"
                            :down="current.sectionType == type.id"
                            @click="changeType(type.id)"
                        >
                            {{ type.name }}
                        </StatusButton>
                        <PlusIcon class="clickable" @click="addNewSectionType"/>
                    </div>
                </div>

                <quiz-sections-ops v-if="current.sectionType">
                    <StatusButton @click="createSection(current.sectionType)">
                        <TextBoxPlusOutlineIcon/>
                        创建新题目
                    </StatusButton>
                    <StatusButton @click="renameSectionType">
                        <SquareEditOutlineIcon/>
                        修改题目类型
                    </StatusButton>
                    <StatusButton @click="removeSectionType">
                        <DeleteIcon/>
                        删除题目类型
                    </StatusButton>
                </quiz-sections-ops>
                <quiz-sections-empty v-if="current.sections && current.sections.list.length === 0">
                    <p> 此知识点暂无题目 </p>
                </quiz-sections-empty>
                <quiz-sections-wrapper v-if="current.sections">
                    <Card v-for="section in current.sections.list" :key="section.id" @click="gotoSection(section)" class="clickable">
                        <Text>小题数量：{{ section.questions.length }}</Text>
                        <Text>题目类型：{{ current.sectionTypes.find(type => type.id === section.type)?.name }}</Text>
                        <Spacer/>
                        <p class="description">
                            {{ getSectionBrief(section) }}
                        </p>
                    </Card>
                </quiz-sections-wrapper>
                <Pagination v-if="current.sections && current.sections.list.length > 0" :count="getTotalPage()" :current="current.page" @change-page="changePage"/>
            </template>
            <!--  文件夹 -->
            <template v-else-if="hasPermission">
                <div v-if="current.children !== null" style="display: flex;">
                    <CommonButton  @click="createKP(true)">
                        <FolderPlusIcon/>
                    </CommonButton>
                    <CommonButton @click="createKP(false)">
                        <PlusCircleOutlineIcon/>
                    </CommonButton>
                </div>

                <quiz-children-wrapper v-if="current.children !== null">
                    <Card v-for="kp in current.children" :key="kp.info.id" @click="changeKP(kp)" class="clickable">
                        <FolderIcon v-if="kp.info.folder"/>
                        <AdjustIcon v-else/>
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
                    <Slider :min-value="0" :max-value="100" :step="1" v-model="count"/>
                    <quiz-main-button-container>
                        <StatusButton @click="startQuiz">开始测试</StatusButton>
                    </quiz-main-button-container>
                </Card>
            </quiz-main-container>
        </Card>
    </div>
</template>

<style scoped lang="scss">
.loading {
    position: relative;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    height: 20%;
    width: 30%;
}

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
    width: fit-content;
    padding-right: 20px;
}

.content {
    display: flex;
    flex-direction: column;
    height: calc(100% - 20px);
    width: fit-content;
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

.dialog-input {
    width: 100%;
    margin: 20px 0;
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