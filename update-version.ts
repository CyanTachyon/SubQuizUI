import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import packageJson from "./package.json" with { type: "json" };

const androidLatestVersionJson = path.resolve('public', 'android_latest.json');
const androidAppInfoJson = path.resolve('public', 'app_info.json');
const indexHtml = path.resolve('index.html');

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

function setAppInfo(mode: string, namespace: string, appId: string, appName: string)
{
    console.log(`Updating app info to ${mode} ${namespace} (${appId})`);
    if (!existsSync(path.resolve('public'))) 
        mkdirSync(path.resolve('public'), { recursive: true });    
    writeFileSync(
        androidAppInfoJson, 
        JSON.stringify({
            mode,
            namespace,
            appId,
            appName,
        })
    )
    writeFileSync(
        indexHtml,
        readFileSync(indexHtml, 'utf-8').replace(/\/src\/assets\/SubQuiz-icon-(light|dark).png/g, `/src/assets/SubQuiz-icon-${mode === 'AI' ? 'dark' : 'light'}.png`)
    )
}

updateAndroidVersion(packageJson.version, packageJson.versionId, packageJson.minVersionId, packageJson.downloadUrl, packageJson.aiDownloadUrl);
if (process.argv.includes('ai'))
    setAppInfo('AI', 'cn.org.subit.quiz.ai', 'cn.org.subit.quiz.ai', 'SubQuizAI');
else 
    setAppInfo('normal', 'cn.org.subit.quiz', 'cn.org.subit.quiz', 'SubQuiz');
