import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import packageJson from "./package.json" with { type: "json" };

const androidLatestVersionJson = path.resolve('public', 'android_latest.json');

function updateAndroidVersion(versionName: string, versionId: number, minVersionId: number, url: string)
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
        })
    )
}

updateAndroidVersion(packageJson.version, packageJson.versionId, packageJson.minVersionId, packageJson.downloadUrl);