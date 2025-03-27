import { readFileSync, writeFileSync } from "fs";
import path from "path";

const packageJson = JSON.parse(readFileSync(path.resolve('package.json'), 'utf-8'))
const androidLatestVersionJson = path.resolve('public', 'android_latest.json');

function parseVersion(str)
{
    while(str.length < 2) str = '0' + str;
    return str;
}

function versionToNumber(version)
{
    return Number(version.split('.').map(parseVersion).join('0'))
}

function updateAndroidVersion(version)
{
    writeFileSync(androidLatestVersionJson, JSON.stringify({
        version, 
        versionCode: versionToNumber(version),
        url: `https://cdn.subit.org.cn/SubQuiz-${version}.apk`
    }))
}

updateAndroidVersion(packageJson.version)