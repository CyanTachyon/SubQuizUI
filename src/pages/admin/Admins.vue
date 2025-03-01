<script setup lang="ts">
import {useRoute} from 'vue-router';
import type {BasicUserInfo, UserInfo} from '../../dataClasses/User';
import {ref, watch} from 'vue';
import {
    changeUserPermissionGlobal,
    changeUserPermissionInSubject,
    getGlobalAdminList,
    getSubjectAdminList,
    getUserPermissionInSubject
} from '../../networks/backend/admin';
import {getUserInfo} from '../../networks/backend/user';
import type {Slice} from '../../dataClasses/Slice';
import type {Subject} from '../../dataClasses/Subject';
import {getSubject} from '../../networks/backend/subject';
import NotFound from '../NotFound.vue';
import Card from '../../components/Card.vue';
import Input from '../../components/Input.vue';
import Slider from '../../components/Slider.vue';
import CommonButton from '../../components/CommonButton.vue';
import {isAdmin, Permission, permissionFromNumber, permissionToNumber} from '../../dataClasses/Permission';
import {useNotificationStore} from '../../stores/notification';
import debounce from '../../utils/debounce';
import {useUser} from '../../stores/user';
import Pagination from '../../components/Pagination.vue';
import Text from '../../components/Text.vue';
import Loading from '../../components/Loading.vue';
import Spacer from "../../components/Spacer.vue";
const user = useUser();
const route = useRoute();
const subject = route.query.subject ? Number(route.query.subject) : null;
const subjectInfo = ref(void 0 as undefined | null | Subject);
const page = ref(Number(route.query.page) || 1);
const notification = useNotificationStore();
const count = 10;
const id = ref(0);
const username = ref('');
const permission = ref(0);
const notFound = ref(false);

document.title = '管理员列表 - SubQuiz';

async function checkPermission()
{
    if (!subject)
    {
        notFound.value = !user.hasAdmin();
    }
    else
    {
        notFound.value = !user.hasAdmin() && !isAdmin(await getUserPermissionInSubject(subject, id.value));
    }
}

function getStart()
{
    return (page.value - 1) * count;
}

const admins = ref(void 0 as Slice<{ user: BasicUserInfo, permission: Permission }> | null | undefined);

async function fetchAdmins()
{
    if (subject)
    {
        subjectInfo.value = await getSubject(subject);
    }
    const ids = subject ? await getSubjectAdminList(subject, getStart(), count) : await getGlobalAdminList(getStart(), count);
    const promises = []
    for (const id of ids.list)
    {
        promises.push(getUserInfo(id.user));
    }
    admins.value = {
        list: (await Promise.all(promises)).map((user, i) => ({
            user: user as BasicUserInfo,
            permission: ids.list[i].permission
        })),
        totalSize: ids.totalSize,
        begin: ids.begin,
        count: ids.count
    }
}

async function init()
{
    await checkPermission();
    if (!notFound.value) await fetchAdmins();
}

init().catch(() => admins.value = null);

function save()
{
    if (!id.value) return;
    let promise;
    if (subject)
    {
        promise = changeUserPermissionInSubject(subject, id.value, permissionFromNumber(permission.value));
    }
    else
    {
        promise = changeUserPermissionGlobal(id.value, permissionFromNumber(permission.value));
    }
    promise.then(() =>
    {
        notification.addSuccess('用户权限修改成功');
        init();
    }).catch(() => notification.addError('用户权限修改失败'));
}

function updateUsername()
{
    if (id.value)
    {
        getUserInfo(id.value).then((user) =>
        {
            if (user)
            {
                if (!subject) permission.value = permissionToNumber((user as UserInfo).permission);
                username.value = user.username;
            }
            else
            {
                notification.addError('用户不存在');
                if (!subject) permission.value = 1;
                username.value = '';
            }
        }, () => username.value = '');
        if (subject)
        {
            getUserPermissionInSubject(subject, id.value).then((p) => permission.value = permissionToNumber(p));
        }
    }
    else
    {
        permission.value = 1;
        username.value = '';
    }
}

watch(id, debounce(updateUsername, 500));

function setAdmin(admin: { user: BasicUserInfo, permission: Permission })
{
    id.value = admin.user.id;
    username.value = admin.user.username;
    permission.value = permissionToNumber(admin.permission);
}

function getTotalPage()
{
    return Math.ceil((admins.value?.totalSize || 0) / count) || 1;
}

function handlePageChange(newPage: number)
{
    page.value = newPage;
    fetchAdmins();
}

</script>

<template>
    <NotFound v-if="admins === null || notFound"/>
    <Loading v-else-if="admins === void 0" class="loading"/>
    <div v-else class="subjects-container">
        <Text class="main-title">{{ subjectInfo?.name || '全局' }} 管理员列表</Text>
        <Card class="admin-card">
            <label>用户ID</label>
            <Input :area="false" placeholder="用户ID" type="number" v-model="id"/>
            <label>用户名</label>
            <Input :area="false" placeholder="用户名" type="text" v-model="username" disabled/>
            <label>用户权限</label>
            <Input placeholder="用户权限" type="text" :value="permissionFromNumber(permission)" @input="" disabled/>
            <Slider class="permission-slider" :min-value="0" :max-value="3" :step="1" v-model="permission"/>
            <CommonButton @click="save">保存</CommonButton>
        </Card>

        <div class="subjects">
            <template v-for="q in admins.list">
                <Card class="subject" @click="setAdmin(q)">
                    <p class="title">{{ q.user.username }}</p>
                    <Spacer/>
                    <p>ID: {{ q.user.id }}</p>
                    <p class="description">权限：{{ q.permission }}</p>  <!-- 添加class -->
                </Card>
            </template>
            <Text v-if="admins.list.length === 0" class="no-subjects">暂无管理员</Text>
        </div>
        <Pagination :count="getTotalPage()" :current="page" @change-page="handlePageChange" class="pagination"/>
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

.main-title {
    margin-top: 20px;
  margin-left: 10px;
  font-size: 30px;
  font-weight: 550;
}

.admins-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  width: 300px;

  label {
    margin-left: 10px;
    margin-bottom: -15px;
  }

  .permission-slider {
    margin-top: -5px;
  }
}


.subjects-container {
  display: flex;
  flex-direction: column;
  max-height: 100%;
  max-width: 100%;
  min-height: 100%;
  min-width: 100%;

  .no-subjects {
    margin: 20px auto;
  }

  .create-subject {
    margin: 20px 0 0 20px;
  }
}

.subjects {
  margin: 20px 0 0 0;
  display: grid;
  flex-grow: 1;
  grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
  justify-content: start;
  overflow-y: auto;
  scrollbar-width: none;
}

.subject {
  padding: 15px 30px 30px 30px;
  cursor: pointer;
  height: 200px;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  margin: 20px;

  .description {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
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
</style>
