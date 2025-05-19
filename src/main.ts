import { createApp } from 'vue';
import './style.scss';
import App from './App.vue';
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { createPinia } from "pinia";
import Login from "./pages/Login.vue";
import About from "./pages/About.vue";
import Home from "./pages/Home.vue";
import Quiz from "./pages/Quiz.vue";
import Analysis from "./pages/Analysis.vue";
import Terminal from "./pages/Terminal.vue";
import History from "./pages/History.vue";
import SubjectList from "./pages/admin/SubjectList.vue";
import NotFound from './pages/NotFound.vue';
import Subject from './pages/admin/Subject.vue';
import EditSubject from './pages/admin/EditSubject.vue';
import EditSection from './pages/admin/Section.vue';
import Admins from './pages/admin/Admins.vue';
import UpdateInfo from './pages/UpdateInfo.vue';
import { App as CapacitorApp } from '@capacitor/app';
import LoginApp from './pages/_app/LoginDone.vue';
import SSO from './pages/_app/SSO.vue';
import { Capacitor } from '@capacitor/core';
import './katex.css';
import { vMarkdown } from './utils/markdown';
import EditGroup from './pages/admin/EditGroup.vue';
import Group from './pages/admin/Group.vue';

if (Capacitor.getPlatform() === 'web')
{
    import('./font_cdn.scss');
}
else
{
    import('./font.css');
}

const routes: Readonly<RouteRecordRaw[]> = [
    { path: '/', name: 'Home', component: Home, meta: { sidebar: true } },
    { path: '/about', name: 'About', component: About, meta: { sidebar: true } },
    { path: '/update-info', name: 'UpdateInfo', component: UpdateInfo, meta: { sidebar: true } },
    { path: '/analysis/:id', name: 'Analysis', component: Analysis, meta: { sidebar: true } },
    { path: '/history', name: 'History', component: History, meta: { sidebar: true } },
    { path: '/login', name: 'Login', component: Login },
    { path: '/quiz', name: 'Quiz', component: Quiz, meta: { sidebar: true } },
    { path: '/terminal', name: 'Terminal', component: Terminal, meta: { sidebar: true } },
    { path: '/admin/admins', name: 'Admins', component: Admins, meta: { sidebar: true } },

    { path: '/admin/subject/list', component: SubjectList, meta: { sidebar: true } },
    { path: '/admin/subject/edit/:id', component: EditSubject, meta: { sidebar: true } },
    { path: '/admin/subject/:id', component: Subject, meta: { sidebar: true } },
    
    { path: '/admin/group/edit/:id', component: EditGroup, meta: { sidebar: true } },
    { path: '/admin/group/:id', component: Group, meta: { sidebar: true } },
    
    { path: '/admin/section/:id', component: EditSection, meta: { sidebar: true } },

    { path: '/_app/login', name: 'LoginApp', component: LoginApp },
    { path: '/_app/sso/:url*', name: 'SSO', component: SSO },

    { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }
];

export const router = createRouter({
    history: createWebHistory(),
    routes,
});

// 监听 deep link 事件
CapacitorApp.addListener('appUrlOpen', (data) =>
{
    try
    {
        const parsedUrl = new URL(data.url);
        const code = parsedUrl.searchParams.get('code') || '';
        const from = parsedUrl.searchParams.get('from') || '/';
        router.push({ path: '/login', query: { code, from } });
    }
    catch (err)
    {
        console.error('Failed to parse deep link URL:', err);
    }
});

createApp(App)
    .use(createPinia())
    .use(router)
    .directive('markdown', vMarkdown)
    .mount('quiz-app');