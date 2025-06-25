<script setup lang="tsx">
import Card from "../components/Card.vue";
import { ref } from "vue";
import Spacer from "../components/Spacer.vue";
import Button from "../components/Button.vue";
import Text from "../components/Text.vue";
import type { ClassWithMembers } from "../dataClasses/Class";
import { getClassList } from "../networks/backend/class";
import { getPreparationGroup } from "../networks/backend/preparationGroup";
import Loading from "../components/Loading.vue";
import type { Exam } from "../dataClasses/Exam";
import { getExams, newExam } from "../networks/backend/exam";
import { useRouter } from "vue-router";
import { avatarUrl } from "../networks/sso/avatar";
import Image from "../components/Image.vue";
import { getUserPermissionInGroup } from "../networks/backend/admin";
import { isAdmin } from "../dataClasses/Permission";
import { useUser } from "../stores/user";
import { dialog, inputDialog } from "../utils/utils";

const router = useRouter();
let open = ref(true);
let sidebarClassName = ref(open.value ? 'sidebar-opened' : 'sidebar-closed');

const isLoading = ref(false);
const hasMore = ref(true);
const classes = ref<ClassWithMembers[]>([]);
const info = ref(null as null | ClassWithMembers);
const pgName = ref('' as string);
const exams = ref(null as null | Exam[]);
const chosen = ref(0 as number);
const admin = ref(null as boolean | null);

function loadClasses(reload: boolean)
{
    if (isLoading.value || !hasMore.value) return;
    
    isLoading.value = true;
    if (reload) {
        classes.value = [];
        hasMore.value = true;
    }
    getClassList(null, null, classes.value.length, 20).then((result) => {
        const { list } = result;
        classes.value.push(...list);
        if (list.length < 20) hasMore.value = false;
        isLoading.value = false;
    }).catch(() => {
        isLoading.value = false;
    });
}

function handleScroll(event: Event) {
    const target = event.target as HTMLElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    
    // 检查是否滚动到底部（允许一点误差）
    if (scrollHeight - scrollTop - clientHeight < 10) {
        loadClasses(false);
    }
}

loadClasses(false);

function changeClass(clazz: ClassWithMembers)
{
    info.value = clazz; 
    pgName.value = null; 
    exams.value = null;
    admin.value = null;
    
    getPreparationGroup(info.value.group).then((pg) =>
    {
        pgName.value = pg.name;
    }).catch(() =>
    {
        pgName.value = '未知';
    });

    getExams(info.value.id).then((result) => exams.value = result);

    if (useUser().hasAdmin()) admin.value = true; 
    else getUserPermissionInGroup(info.value.group, 0).then((perm) => admin.value = isAdmin(perm));
}

function gotoExam(exam: Exam)
{
    if (admin.value) router.push('/admin/exam/' + exam.id); 
    else 
    {
        const close = dialog(
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 20px;">
                开始考试：{ exam.name }
                <div style="margin-top: 10px; display: flex; flex-direction: row; gap: 10px;">
                    <Button onClick={() => { close(); router.push('/quiz?exam=' + exam.id); }}>
                        开始
                    </Button>
                    <Button onClick={() => close()}>
                        取消
                    </Button>
                </div>
            </div>,
            () => close()
        );
    }
}

function createExam()
{
    const x = inputDialog(
        <div>
            请输入考试名称
        </div>,
        (name) => {
            newExam({
                name,
                available: false,
                description: '',
                clazz: info.value.id,
                sections: [],
            }).then((exam) => router.push('/admin/exam/' + exam))
        },
        () => x()
    )
}

</script>

<template>
    <quiz-classes>
        <Card :class="sidebarClassName" class="sidebar">
            <div class="menu-title-box box">
                <!-- <Button @click="changeSidebarState" class="menu-btn">
                    <MenuOpenIcon v-if="open" />
                    <MenuCloseIcon v-else />
                </Button> -->
                <div class="menu-title">我的班级</div>
            </div>

            <Spacer style="margin-bottom: 10px;" />
            <div class="classes" @scroll="handleScroll">
                <Button class="item" v-for="clazz in classes" :key="clazz.id" @click="changeClass(clazz)">
                    {{ clazz.name }}
                </Button>
                <Text v-if="isLoading" class="loading-indicator">
                    加载中...
                </Text>
                <Text v-if="!hasMore && classes.length > 0" class="no-more-indicator">
                    没有更多班级了
                </Text>
            </div>
            <Text class="sidebar-empty" v-if="!classes.length">
                还没有班级
            </Text>

        </Card>

        <Card class="main-content">
            <template v-if="info && pgName && exams !== null && admin !== null">
                <Text class="main-title">{{ info.name }}</Text>
                <Text class="main-description"> {{ pgName }} </Text>
                <div class="section-types-container-header">
                    <Button class="item" @click="chosen = 0" :down="chosen === 0">考试</Button>
                    <Button class="item" @click="chosen = 1" :down="chosen === 1">成员</Button>
                </div>
                <Spacer />
                <div style="overflow: auto; scrollbar-width: none; flex-grow: 1;">
                    <Button v-if="chosen === 0 && admin" style="margin-left: 20px;" @click="createExam()">
                        新建考试
                    </Button>
                    <div class="exams" v-if="chosen === 0">
                        <Card v-for="e in exams" @click="gotoExam(e)" :max-tilt="5">
                            <p class="title">{{ e.name }}</p>
                            <Spacer />
                            <p>ID: {{ e.id }}</p>
                            <p>大题数量：{{ e.sections.length }}</p>
                            <p class="description">{{ e.description }}</p>
                        </Card>
                        <Text v-if="exams.length === 0" class="no-exam">暂无考试</Text>
                    </div>
                    <div class="members" v-if="chosen === 1">
                        <Card v-for="m in info.members" :key="m.seiue.studentId" class="member-item" :max-tilt="7">
                            <quiz-user-box class="box">
                                <Image class="avatar" :src="avatarUrl(m.user)" />
                                <quiz-username-box>
                                    <quiz-username>{{ m.seiue.realName }}</quiz-username>
                                    <quiz-user-id>{{ m.seiue.studentId }}</quiz-user-id>
                                </quiz-username-box>
                            </quiz-user-box>
                        </Card>
                    </div>
                </div>
            </template>
            <div class="class-area" v-else-if="!info">
                <Text class="empty-state">
                    <p>请选择一个班级查看详情</p>
                </Text>
            </div>
            <Loading v-else class="loading" />
        </Card>
    </quiz-classes>
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

/*** sidebar ***/

.sidebar {
    display: flex;
    flex-direction: column;
    height: calc(100% - 20px);
    margin-bottom: 7px;
    --sidebar-close-width: 80px;
    --sidebar-open-width: 200px;

    .sidebar-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
    }

    .classes {
        margin: -10px;
        padding: 10px;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        scrollbar-width: none;
        flex-grow: 1;
        max-height: calc(100% - 80px);
        min-height: calc(100% - 80px);
    }

    .loading-indicator,
    .no-more-indicator {
        text-align: center;
        padding: 15px;
        font-size: 14px;
        opacity: 0.5;
    }

    .loading-indicator {
        color: var(--color)
    }

    .item {
        overflow: hidden;
        margin: 5px;
        min-width: 170px;
        max-width: 170px;
        min-height: 51px;
        max-height: 51px;
        display: flex;
        align-items: center;
        justify-content: start;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        cursor: pointer;
    }
}

.main-content {
    width: 100%;
    height: 100%;
    scrollbar-width: none;
    position: relative;
    display: flex;

    margin-bottom: 7px; 
    flex-direction: column;
    height: calc(100% - 20px);

    .main-title {
        margin: 20px 0 0 20px;
        font-size: 1.5em;
        font-weight: bold;
    }

    .main-description {
        margin: 20px 0px 0px 20px;
        opacity: 0.7;
    }

    .section-types-container-header {
        display: flex;
        flex-direction: row;
        justify-content: start;
        gap: 20px;
        margin: 0 0 20px 0px;

        .item {
            margin: 20px 0 0 20px;
        }
    }

    .exams {
        margin: 20px 0 0 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
        justify-content: start;
        overflow-y: auto;
        scrollbar-width: none;

        quiz-card {
            padding: 15px 30px 30px 30px;
            cursor: pointer;
            max-height: 220px;
            max-width: 400px;
            display: flex;
            flex-direction: column;
            margin: 20px;
    
            .description {
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
            }
            .title {
                font-size: 1.25em;
                margin-bottom: 0px;
                font-weight: bold;
            }
        }

        .no-exam {
            margin: 20px auto;
        }
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
    }
}

quiz-classes {
    height: 100%;
    width: 100%;
    display: flex;
}

.sidebar-opened {
    width: var(--sidebar-open-width);
    min-width: var(--sidebar-open-width);
    max-width: var(--sidebar-open-width);
}

.sidebar-closed {
    width: var(--sidebar-close-width);
    min-width: var(--sidebar-close-width);
    max-width: var(--sidebar-close-width);
}

.sidebar-open {
    animation: open-sidebar 0.8s ease-in-out forwards;
}

.sidebar-close {
    animation: open-sidebar 0.8s ease-in-out reverse forwards;
}

div.sidebar-center {
    flex-grow: 1;
}

/*** components ***/

.box {
    overflow: hidden;
    display: flex;
    height: fit-content;
}

div.menu-title-box {
    margin-left: -6px;
    margin-right: -6px;
    margin-top: -6px;
    padding: 6px;
    flex-direction: row-reverse;
    
    ///
    min-height: 80px;
    max-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;

    .menu-btn {
        position: relative;
        height: 48px;
        width: 50px;
        margin-left: 5px;
        margin-right: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding-left: 1.4rem;
    }

    div.menu-title {
        min-width: 125px;
        max-width: 125px;
        margin-top: auto;
        margin-bottom: auto;
        font-size: 25px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
    }
}

/*** class area ***/

.class-area {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.empty-state {
    opacity: 0.5;
    text-align: center;
    
    p {
        font-size: 18px;
        margin: 0;
    }
}
</style>