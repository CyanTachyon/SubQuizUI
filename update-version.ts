import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import packageJson from "./package.json" with { type: "json" };
import configJson from "./config.json" with { type: "json" };

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
    mode = mode || 'default';
    console.log(`Updating app info to ${mode}`);
    let config = configJson[mode] || configJson.default;
    if (!existsSync(path.resolve('public'))) 
        mkdirSync(path.resolve('public'), { recursive: true });    
    writeFileSync(
        androidAppInfoJson, 
        JSON.stringify({
            mode,
            namespace: config.namespace,
            appId: config.appId,
            appName: config.appName,
        })
    )
    copyFileSync(path.resolve(`src/assets/SubQuiz-icon-${config.darkIcon ? 'dark' : 'light'}.png`), path.resolve(`src/assets/SubQuiz-icon-default.png`));
    writeFileSync(
        path.resolve('.env'),
        `
VITE_APP_SUB_QUIZ_CDN=${config.cdn}
VITE_APP_SUB_QUIZ_BACKEND=${config.backend}
VITE_APP_SUB_QUIZ_FRONTEND=${config.frontend}
VITE_APP_SUB_QUIZ_SSO_FRONTEND=${config.ssoFrontend}
VITE_APP_SUB_QUIZ_SSO_BACKEND=${config.ssoBackend}
VITE_APP_SUB_QUIZ_SSO_SERVICE_ID=${config.ssoServiceId}
VITE_APP_SUB_QUIZ_AI_SHARE_BASE=${config.aiShareBase}
            `.trim()
    )
}

updateAndroidVersion(packageJson.version, packageJson.versionId, packageJson.minVersionId, packageJson.downloadUrl, packageJson.aiDownloadUrl);

setAppInfo(process.argv[2]);