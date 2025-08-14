<script setup lang="ts">
import { useRoute } from 'vue-router';
import type { BasicUserInfo, UserInfo } from '../../dataClasses/User';
import { ref, watch } from 'vue';
import
    {
        changeUserPermissionGlobal,
        changeUserPermissionInGroup,
        getGlobalAdminList,
        getGroupAdminList,
        getUserPermissionInGroup,
    } from '../../networks/backend/admin';
import { getUserInfo } from '../../networks/backend/user';
import type { Slice } from '../../dataClasses/Slice';
import NotFound from '../NotFound.vue';
import Card from '../../components/Card.vue';
import Input from '../../components/Input.vue';
import Slider from '../../components/Slider.vue';
import Button from '../../components/Button.vue';
import { isAdmin, Permission, permissionFromNumber, permissionToNumber } from '../../dataClasses/Permission';
import { useNotification } from '../../stores/notification';
import debounce from '../../utils/debounce';
import { useUser } from '../../stores/user';
import Pagination from '../../components/Pagination.vue';
import Text from '../../components/Text.vue';
import Loading from '../../components/Loading.vue';
import Spacer from "../../components/Spacer.vue";
import type { PreparationGroup } from '../../dataClasses/PreparationGroup';
import { getPreparationGroup } from '../../networks/backend/preparationGroup';
const user = useUser();
const route = useRoute();
const group = route.query.group ? Number(route.query.group) : null;
const groupInfo = ref(void 0 as undefined | null | PreparationGroup);
const page = ref(Number(route.query.page) || 1);
const notification = useNotification();
const count = 10;
const id = ref(0);
const username = ref('');
const permission = ref(0);
const notFound = ref(false);

document.title = '管理员列表 - SubQuiz';

async function checkPermission()
{
    if (!group)
    {
        notFound.value = !user.hasAdmin();
    }
    else
    {
        notFound.value = !user.hasAdmin() && !isAdmin(await getUserPermissionInGroup(group, id.value));
    }
}

function getStart()
{
    return (page.value - 1) * count;
}

const admins = ref(void 0 as Slice<{ user: BasicUserInfo, permission: Permission; }> | null | undefined);

async function fetchAdmins()
{
    if (group)
    {
        groupInfo.value = await getPreparationGroup(group);
    }
    const ids = group ? await getGroupAdminList(group, getStart(), count) : await getGlobalAdminList(getStart(), count);
    const promises = [];
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
    };
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
    if (group)
    {
        promise = changeUserPermissionInGroup(group, id.value, permissionFromNumber(permission.value));
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
                if (!group) permission.value = permissionToNumber((user as UserInfo).permission);
                username.value = user.username;
            }
            else
            {
                notification.addError('用户不存在');
                if (!group) permission.value = 1;
                username.value = '';
            }
        }, () => username.value = '');
        if (group)
        {
            getUserPermissionInGroup(group, id.value).then((p) => permission.value = permissionToNumber(p));
        }
    }
    else
    {
        permission.value = 1;
        username.value = '';
    }
}

watch(id, debounce(updateUsername, 500));

function setAdmin(admin: { user: BasicUserInfo, permission: Permission; })
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
    <NotFound v-if="admins === null || notFound" />
    <Loading v-else-if="admins === void 0"/>
    <quiz-admins-container v-else>
        <Text>{{ groupInfo?.name || '全局' }} 管理员列表</Text>
        <Card>
            <label>用户ID</label>
            <Input :area="false" placeholder="用户ID" type="number" v-model="id" />
            <label>用户名</label>
            <Input :area="false" placeholder="用户名" type="text" v-model="username" disabled />
            <label>用户权限</label>
            <Input placeholder="用户权限" type="text" :value="permissionFromNumber(permission)" @input="" disabled />
            <Slider :min-value="0" :max-value="3" :step="1" v-model="permission" />
            <Button @click="save">保存</Button>
        </Card>

        <quiz-admins>
            <Card @click="setAdmin(q)" v-for="q in admins.list">
                <p class="username">{{ q.user.username }}</p>
                <Spacer />
                <p>ID: {{ q.user.id }}</p>
                <p class="permission">权限：{{ q.permission }}</p> <!-- 添加class -->
            </Card>
            <Text v-if="admins.list.length === 0" class="no-admins">暂无管理员</Text>
        </quiz-admins>
        <Pagination :count="getTotalPage()" :current="page" @change-page="handlePageChange"/>
    </quiz-admins-container>
</template>

<style scoped lang="scss">


quiz-admins-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
}

quiz-admins-container > quiz-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px;
    width: 300px;

    label {
        margin-left: 10px;
        margin-bottom: -15px;
    }

    quiz-slider {
        margin-top: -5px;
    }
}

quiz-admins-container > quiz-text {
    margin-top: 20px;
    margin-left: 10px;
    font-size: 30px;
    font-weight: 550;
}

quiz-admins {
    margin: 20px 0 0 0;
    display: grid;
    flex-grow: 1;
    grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
    justify-content: start;
    overflow-y: auto;
    scrollbar-width: none;

    .no-admins {
        display: flex;
        justify-content: center;
    }
}

quiz-admins > quiz-card {
    padding: 15px 30px 30px 30px;
    cursor: pointer;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    margin: 20px;
    height: 200px;

    .permission {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
}

.username {
    font-size: 1.25em;
    margin-bottom: 0px;
    font-weight: bold;
}

quiz-pagination {
    width: calc(min(100%, 800px));
    margin: 20px auto;
}
</style>
