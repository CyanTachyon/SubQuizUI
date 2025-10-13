import { createApp, ref } from 'vue';
import './style.scss';
import App from './App.vue';
import { createRouter, createWebHistory, isNavigationFailure, type RouteRecordRaw } from 'vue-router';
import Login from "./pages/Login.vue";
import CustomLogin from "./pages/CustomLogin.vue";
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
import { Capacitor } from '@capacitor/core';
import './katex.css';
import { vMarkdown, vSectionContent } from './utils/markdown';
import EditGroup from './pages/admin/EditGroup.vue';
import Group from './pages/admin/Group.vue';
import AiChats from './pages/ai/AiChats.vue';
import AiChatShare from './pages/ai/AiChatShare.vue';
import Classes from './pages/Classes.vue';
import Exam from './pages/admin/Exam.vue';
import Theme from './pages/Settings.vue';
import AiTranslate from './pages/ai/AiTranslate.vue';
import AiToolbox from './pages/ai/Toolbox.vue';
import AiImage from './pages/ai/AiImage.vue';
import AiEssayCorrection from './pages/ai/AiEssayCorrection.vue';
import Practice from './pages/Practice.vue';
import { useUser } from './stores/user';
import { useTheme } from './stores/theme';
import { storageGet } from './utils/storage';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import debounce from './utils/debounce';
import { $appearDuration, useTransitionActions } from './stores/transition';
import AiLibrary from './templates/chat/AiLibrary.vue';
import { isAiApp, isMobileDevice } from './utils/utils';
import { checkClipboardAndHandle } from './utils/clipboard.tsx';
defineCustomElements(window);

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

if (Capacitor.getPlatform() === 'web')
{
    import('./font_cdn.scss');
}
else
{
    import('./font.css');
}

const routes: Readonly<RouteRecordRaw[]> = [
    !isAiApp() ? { path: '/', name: 'Home', component: Home, meta: { sidebar: true } } : { path: '/', name: 'Home', component: AiChats, meta: { sidebar: true } },
    { path: '/about', name: 'About', component: About, meta: { sidebar: true } },
    { path: '/update-info', name: 'UpdateInfo', component: UpdateInfo, meta: { sidebar: true } },
    { path: '/analysis/:id', name: 'Analysis', component: Analysis, meta: { sidebar: true } },
    { path: '/history', name: 'History', component: History, meta: { sidebar: true } },
    { path: '/login', name: 'Login', component: Login },
    { path: '/custom-login', name: 'CustomLogin', component: CustomLogin, meta: { sidebar: true } },
    { path: '/quiz', name: 'Quiz', component: Quiz, meta: { sidebar: true } },
    { path: '/terminal', name: 'Terminal', component: Terminal, meta: { sidebar: true } },
    { path: '/ai', name: 'AiToolbox', component: AiToolbox, meta: { sidebar: true } },
    { path: '/ai/chat', name: 'AIChats', component: AiChats, meta: { sidebar: true } },
    { path: '/ai/chat/:id', name: 'AiChatShare', component: AiChatShare, meta: { sidebar: true } },
    { path: '/ai/chat/lib', name: 'AiChatLib', component: AiLibrary, meta: { sidebar: true } },
    { path: '/ai/translate', name: 'AiTranslate', component: AiTranslate, meta: { sidebar: true } },
    { path: '/ai/essay-correction', name: 'AiEssayCorrection', component: AiEssayCorrection, meta: { sidebar: true } },
    { path: '/ai/image', name: 'AiImage', component: AiImage, meta: { sidebar: true } },
    { path: '/class', name: 'Class', component: Classes, meta: { sidebar: true } },
    { path: '/setting', name: 'Theme', component: Theme, meta: { sidebar: true } },
    { path: '/admin/admins', name: 'Admins', component: Admins, meta: { sidebar: true } },
    { path: '/practice/:id', name: 'Practice', component: Practice, meta: { sidebar: true } },

    { path: '/admin/subject/list', component: SubjectList, meta: { sidebar: true } },
    { path: '/admin/subject/edit/:id', component: EditSubject, meta: { sidebar: true } },
    { path: '/admin/subject/:id', component: Subject, meta: { sidebar: true } },
    
    { path: '/admin/group/edit/:id', component: EditGroup, meta: { sidebar: true } },
    { path: '/admin/group/:id', component: Group, meta: { sidebar: true } },
    
    { path: '/admin/section/:id', component: EditSection, meta: { sidebar: true } },
    
    { path: '/admin/exam/:id', component: Exam, meta: { sidebar: true } },

    { path: '/_app/login', name: 'LoginApp', component: LoginApp },

    { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }
];

export const router = createRouter({
    history: createWebHistory(),
    routes,
});

let beforeChange: {
    id: bigint;
    handler: () => boolean;
}[] = [];
let id = 0n;
export function addBeforeChangeHandler(handler: () => boolean)
{
    beforeChange.push({ id: id, handler });
    return id++;
}

export function removeBeforeChangeHandler(id: bigint)
{
    beforeChange = beforeChange.filter(item => item.id !== id);
}

const transition = useTransitionActions();
router.beforeEach((_, __, next) =>
{
    const beforeChange0 = [...beforeChange].reverse();
    for (const item of beforeChange0)
    {
        if (item.handler()) return next(false);
    }
    transition.onLeave();
    return new Promise((resolve) =>
    {
        setTimeout(() =>
        {
            resolve(next());
        }, $appearDuration);
    });
});

router.afterEach((_, __, failure) =>
{
    if (isNavigationFailure(failure)) return;
    transition.onEnter();
    return new Promise((resolve) =>
    {
        setTimeout(() =>
        {
            resolve(transition.clear());
        }, $appearDuration);
    });
});

export const phone = ref(true);

let scale = 1;
export function getScale(): number
{
    return scale;
}

(async () =>
{

    try
    {
        const theme = useTheme();
        await theme.initialize();
        const user = useUser();
        await user.reload();
    }
    catch (error)
    {
        console.error(error);
    }
    const appEle = (document.querySelector('quiz-app') as any);
    scale = Number(await storageGet('scale')) || (Capacitor.getPlatform() === 'web' && !isMobileDevice() ? 0.8 : 0.7);
    appEle.style = `
        --scale: ${scale};
        transform: scale(${scale});
        transform-origin: top left;
        width: ${100 / scale}%;
        height: ${100 / scale}%;
        min-width: ${100 / scale}%;
        min-height: ${100 / scale}%;
        max-width: ${100 / scale}%;
        max-height: ${100 / scale}%;
        overflow: hidden;
    `;

    const update = debounce(() =>
    {
        // phone.value = window.innerWidth <= window.innerHeight * 4 / 3;
        phone.value = window.innerWidth <= 1300 * scale;
    }, 100);
    update();
    window.onresize = update;

    createApp(App)
        .use(router)
        .directive('markdown', vMarkdown)
        .directive('section-content', vSectionContent)
        .mount('quiz-app');

    // if (Capacitor.getPlatform() === 'android') 
    // {
    //     const route = await storageGet('route');
    //     if (route) 
    //     {
    //         console.log(route);
    //         router.push(route);
    //     }
    //     router.afterEach((to, __, failure) =>
    //     {
    //         if (isNavigationFailure(failure)) return;
    //         return storageSet('route', to.path);
    //     });
    // }

    checkClipboardAndHandle();
})();