import {createApp} from 'vue'
import './style.scss'
import App from './App.vue'
import {createRouter, createWebHistory, type RouteRecordRaw} from 'vue-router'
import {createPinia} from "pinia";
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
import EditSectionType from './pages/admin/EditSectionType.vue';
import EditSubject from './pages/admin/EditSubject.vue';
import SectionType from './pages/admin/SectionType.vue';
import DeleteSectionType from './pages/admin/DeleteSectionType.vue';
import EditSection from './pages/admin/EditSection.vue';
import Admins from './pages/admin/Admins.vue';
import UpdateInfo from './pages/UpdateInfo.vue';
const routes: Readonly<RouteRecordRaw[]> = [
    { path: '/', name: 'Home', component: Home },
    { path: '/about', name: 'About', component: About },
    { path: '/update-info', name: 'UpdateInfo', component: UpdateInfo },
    { path: '/analysis/:id', name: 'Analysis', component: Analysis },
    { path: '/history', name: 'History', component: History },
    { path: '/login', name: 'Login', component: Login },
    { path: '/quiz', name: 'Quiz', component: Quiz },
    { path: '/terminal', name: 'Terminal', component: Terminal },
    { path: '/admin/admins', name: 'Admins', component: Admins },
    { path: '/admin/subject/list', component: SubjectList },
    { path: '/admin/subject/edit/:id', component: EditSubject },
    { path: '/admin/subject/:id', component: Subject },
    { path: '/admin/section/type/edit/:id', component: EditSectionType },
    { path: '/admin/section/type/:id', component: SectionType },
    { path: '/admin/section/type/delete/:id', component: DeleteSectionType },
    { path: '/admin/section/edit/:id', component: EditSection },
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

createApp(App)
    .use(createPinia())
    .use(router)
    .mount('#app')