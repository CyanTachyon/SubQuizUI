import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const packageJson = JSON.parse(readFileSync(path.resolve('package.json'), 'utf-8'))
const androidLatestVersionJson = path.resolve('public', 'android_latest.json');

function updateAndroidVersion(versionName, versionId, minVersionId)
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
            url: `https://quiz.bdfzscc.com/SubQuiz.apk`
        })
    )
}

updateAndroidVersion(packageJson.version, packageJson.versionId, packageJson.minVersionId);