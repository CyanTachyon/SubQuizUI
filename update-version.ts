import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import packageJson from "./package.json" with { type: "json" };

const androidLatestVersionJson = path.resolve('public', 'android_latest.json');
const androidAppInfoJson = path.resolve('public', 'app_info.json');

function updateAndroidVersion(versionName: string, versionId: number, minVersionId: number, url: string, aiUrl: string)
{
    console.log(`Updating version to ${versionName} (${versionId})`);
    if (!existsSync(path.resolve('public'))) 
        mkdirSync(path.resolve('public'), { recursive: true });    
    writeFileSync(
        androidLatestVersionJson, 
        JSON.stringify({
            version: versionName, 
            versionCode: versionId,
            minVersionCode: minVersionId,
            url,
            aiUrl,
        })
    )
}

function setAppInfo(mode: string)
{
    console.log(`Updating app info to ${mode}`);
    if (!existsSync(path.resolve('public'))) 
        mkdirSync(path.resolve('public'), { recursive: true });    
    writeFileSync(
        androidAppInfoJson, 
        JSON.stringify({
            mode,
            namespace: mode === 'AI' ? 'cn.org.subit.quiz.ai' : 'cn.org.subit.quiz',
            appId: mode === 'AI' ? 'cn.org.subit.quiz.ai' : 'cn.org.subit.quiz',
            appName: mode === 'AI' ? 'SubQuizAI' : 'SubQuiz',
        })
    )
    copyFileSync(path.resolve(`src/assets/SubQuiz-icon-${mode === 'AI' ? 'dark' : 'light'}.png`), path.resolve(`src/assets/SubQuiz-icon-default.png`));
    writeFileSync(
        path.resolve('.env'),
        mode !== 'AI' ? 
            `
VITE_APP_SUB_QUIZ_CDN=https://cdn.bdfzscc.com
VITE_APP_SUB_QUIZ_BACKEND=https://bdfz.chat/api
VITE_APP_SUB_QUIZ_FRONTEND=https://bdfz.chat

VITE_APP_SUB_QUIZ_SSO_FRONTEND=https://pkus.sso.subit.org.cn
VITE_APP_SUB_QUIZ_SSO_BACKEND=https://pkus.sso.subit.org.cn/api
VITE_APP_SUB_QUIZ_SSO_SERVICE_ID=3

VITE_APP_SUB_QUIZ_AI_SHARE_BASE=https://bdfz.chat
            `.trim()
            :
            `
VITE_APP_SUB_QUIZ_CDN=https://cdn.bdfzscc.com
VITE_APP_SUB_QUIZ_BACKEND=https://quiz.pkuschool.edu.cn/api
VITE_APP_SUB_QUIZ_FRONTEND=https://quiz.pkuschool.edu.cn
VITE_APP_SUB_QUIZ_SSO_FRONTEND=https://pkus.sso.subit.org.cn
VITE_APP_SUB_QUIZ_SSO_BACKEND=https://pkus.sso.subit.org.cn/api
VITE_APP_SUB_QUIZ_SSO_SERVICE_ID=3
VITE_APP_SUB_QUIZ_AI_SHARE_BASE=https://bdfz.chat
            `.trim()
    )
}

updateAndroidVersion(packageJson.version, packageJson.versionId, packageJson.minVersionId, packageJson.downloadUrl, packageJson.aiDownloadUrl);

if (process.argv.includes('ai')) setAppInfo('AI');
else setAppInfo('normal');
