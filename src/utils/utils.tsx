import { ref } from "vue";
import { Capacitor } from '@capacitor/core';
import { connectUrl, Target } from "../networks/utils/sendRequest.ts";
import { safeRedirect } from "./redirect.ts";
import RealNameRequired from "../templates/RealNameRequired.vue";
import type { Section } from "../dataClasses/Section.ts";
import type { AndroidVersion } from "../dataClasses/AndroidVersion.ts";
import currentVersion from "../../public/android_latest.json";
import { useNotification } from "../stores/notification.ts";
import Button from "../components/Button.vue";
import { InAppBrowser, ToolBarType } from "@capgo/inappbrowser";
import { login } from "../networks/backend/oauth.ts";
// import { ScreenOrientation } from "@capacitor/screen-orientation";
import { Clipboard } from "@capacitor/clipboard";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { compressImageToMaxBytes } from "./image.ts";
import { useUser } from "../stores/user.ts";
import LoginCard from "../templates/LoginCard.vue";
import { dialog } from "./dialog.tsx";
import appInfo from "../../public/app_info.json";

export function tryLogin()
{
    useUser().logout();
    const close = dialog(<LoginCard onLogin={ () => { close(); } }></LoginCard>);
}

export function ssoLogin()
{
    tryOpenSSO('/oauth?needAuthorize=' + environment.ssoServiceId);
}

export function forceSeiueLogin()
{
    let callbackUrl: string;
    if (Capacitor.getPlatform() === "web") callbackUrl = connectUrl(Target.FRONTEND, "/login", { from: location.pathname });
    else 
    {
        const doneUrl = connectUrl(Target.FRONTEND, '/_app/login');
        callbackUrl = connectUrl(Target.EMPTY, doneUrl, { from: location.pathname });
    }

    const from1 = connectUrl(Target.EMPTY, '/oauth', { needAuthorize: environment.ssoServiceId, from: callbackUrl });
    const from2 = "login:" + connectUrl(Target.SSO_FRONTEND, "/login", { from: from1, redirectWithToken: true })
    const redirect_uri = connectUrl(Target.SSO_FRONTEND, "/seiue", { from: from2 })
    const url = connectUrl(Target.SSO_BACKEND, '/seiue/bind', { redirect_uri })
    openSsoUrl(url);
}


let isSeiueDialogOpen = false;
export function tryBindSeiue()
{
    if (isSeiueDialogOpen) return;
    isSeiueDialogOpen = true;
    const close = dialog(<RealNameRequired close={ () => { close(); isSeiueDialogOpen = false; } }/>);
}

if (Capacitor.getPlatform() !== 'web')
{
    InAppBrowser.addListener("messageFromWebview", async (data) =>
    {
        const code = data.detail["code"];
        InAppBrowser.close();
        if (!code) return;
        await login(code);
    });
    // InAppBrowser.addListener("closeEvent", async () =>
    // {
    //     await ScreenOrientation.lock({ orientation: 'landscape' });
    // });
}

export function tryOpenSSO(url: string)
{
    if (Capacitor.getPlatform() === 'web') 
    {
        const callbackUrl = connectUrl(Target.FRONTEND, "/login", { from: location.pathname });
        const target = connectUrl(Target.SSO_FRONTEND, url, { from: callbackUrl });
        openSsoUrl(target);
    }
    else 
    {
        const doneUrl = connectUrl(Target.FRONTEND, '/_app/login');
        const callbackUrl = connectUrl(Target.EMPTY, doneUrl, { from: location.pathname });
        const target = connectUrl(Target.SSO_FRONTEND, url, { from: callbackUrl });
        openSsoUrl(target);
    }
}

function openSsoUrl(url: string)
{
    if (Capacitor.getPlatform() === "web") safeRedirect(url);
    else (async () =>
    {
        await InAppBrowser.openWebView({
            url: url,
            toolbarType: ToolBarType.BLANK,
        });
    })();
}

export function getUrlSearchParams(): Record<string, string>
{
    return Object.fromEntries(new URLSearchParams(location.search).entries());
}


/**
 * 设置当前的url，但是不触发vue router的跳转
 */
export function pushUrl(url: string = location.pathname, query: Record<string, any> = getUrlSearchParams())
{
    window.history.pushState({}, '', connectUrl(Target.EMPTY, url, query));
}

export function replaceUrl(url: string = location.pathname, query: Record<string, any> = getUrlSearchParams())
{
    window.history.replaceState({}, '', connectUrl(Target.EMPTY, url, query));
}

export function getOptionName(index: number)
{
    if (!index) return 'A.';
    const base = 26;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '.';
    while (index > 0)
    {
        result = letters[index % base] + result;
        index = Math.floor(index / base);
    }
    return result;
}

export function richtextToString(richtext: any)
{
    if (!richtext) return richtext;
    if (typeof richtext !== 'object') return '' + richtext;
    if (Array.isArray(richtext)) return richtext.map(richtextToString).join('');
    if (richtext.text) return richtext.text;
    if (richtext.content) return richtextToString(richtext.content);
    return '';
}

export function getSectionBrief(section: Section<any, any, any>)
{
    if (!section) return '暂无描述';
    const qBrief = section
        .questions
        .map((q, i) => ({ i, description: richtextToString(q.description) + (q?.options?.map((o, id) => getOptionName(id) + ' ' + richtextToString(o))?.join(' ') || '') }))
        .map(q => 
            {
            const des = richtextToString(q.description);
            if (des.trim()) return `第${q.i + 1}问：${des}`;
            return '';
        })
        .join('')
        .replace('\n', ' ');

    if (richtextToString(section.description).trim() === '')
    {
        if (richtextToString(qBrief).trim() === '') return '暂无描述';
        return qBrief;
    }
    return richtextToString(section.description) + ' ' + qBrief;
}

export const versionInfo = ref(null as AndroidVersion | null);
export enum CheckUpdateReason
{
    NONE = 0,
    SERVER_REQUIRED = 1,
    USER_ACTIVATED = 2,
}
export async function checkUpdate(reason: CheckUpdateReason)
{
    let r1 = await fetch(environment.frontend + '/android_latest.json' + `?timestamp=${Date.now()}`, { cache: "reload", });
    let res = (await r1.json()) as AndroidVersion;
    if (Capacitor.getPlatform() === 'web')
    {
        if (reason === CheckUpdateReason.NONE)
        {
            if (res.version !== currentVersion.version) 
            {
                window.location.reload();
                return;
            }
        }
        return;
    }
    else if (reason === CheckUpdateReason.NONE)
    {
        if (res.minVersionCode > currentVersion.versionCode) 
            versionInfo.value = res;
    }
    else if (reason === CheckUpdateReason.SERVER_REQUIRED) versionInfo.value = res;
    else if (reason === CheckUpdateReason.USER_ACTIVATED)
    {
        if (res.versionCode > currentVersion.versionCode) 
        {
            const close = dialog(
                <div style="margin: 20px 50px;">
                    <h2 style="display: flex; justify-content: center;">发现新版本</h2>
                    <p style="display: flex; justify-content: center;">当前版本：{currentVersion.version}</p>
                    <p style="display: flex; justify-content: center;">最新版本：{res.version}</p>
                    <div style="display: flex; gap: 10px; justify-content: center; margin-top: 10px;">
                        <Button onClick={() => {versionInfo.value = res;close();}}>下载新版本</Button>
                    </div>
                </div>,
                () => close()
            );
        }
        else 
        {
            versionInfo.value = null;
            useNotification().addInfo(`当前版本已是最新版本：${currentVersion.version}`);
        }
    }
}

export function copyToClipboard(text: string)
{
    if (Capacitor.getPlatform() === 'web')
    {
        navigator.clipboard.writeText(text).then(() => 
        {
            useNotification().addSuccess('已复制到剪贴板');
        }).catch(() => 
        {
            useNotification().addError('复制失败，请手动复制');
        });
    }
    else
    {
        Clipboard.write({
            string: text,
        }).then(() => 
        {
            useNotification().addSuccess('已复制到剪贴板');
        }).catch(() => 
        {
            useNotification().addError('复制失败，请手动复制');
        })
    }
}

export async function pickFile(accept?: string, customProps?: Record<string, string>): Promise<{name: string,data: string,} | null>
{
    return new Promise<{name: string, data: string} | null>(async (resolve) =>
    {
        const input = document.createElement('input');
        input.type = 'file';
        if (accept) input.accept = accept;
        for (const [key, value] of Object.entries(customProps || {}))
        {
            input.setAttribute(key, value);
        }
        input.addEventListener("cancel", () => resolve(null), { once: true });
        input.addEventListener("change", (event) =>
        {
            resolve((async () =>
            {
                const file = (event.target as HTMLInputElement).files?.[0];
                if (!file) return null;
                return { name: file.name, data: await readFileAsDataURL(file) };
            })());
        }, { once: true });
        input.click();
        input.remove();
    });
}

export async function pickImage(maxBytes?: number): Promise<{name: string,data: string} | null>
{
    let fileName: string | null = null;
    const source = await new Promise<CameraSource | null>((resolve) =>
    {
        const close = dialog(
            <div style="margin: 20px 50px;">
                <h2 style="display: flex; justify-content: center;">选择图片</h2>
                <Button onClick={() => {
                    resolve(CameraSource.Camera);
                    close();
                }} style="min-width: max-content;">
                    拍摄新照片
                </Button>
                <Button onClick={() => {
                    resolve(CameraSource.Photos);
                    close();
                }} style="min-width: max-content;">
                    从相册选择
                </Button>
            </div>,
            () => 
            {
                resolve(null);
                close();
            }
        );
    });
    if (!source) return null;

    let dataUrl: string | null = null;

    if (Capacitor.getPlatform() === 'android')
    {
        const img = await Camera.getPhoto({
            resultType: CameraResultType.DataUrl,
            promptLabelHeader: '选择图片',
            promptLabelCancel: '取消',
            promptLabelPhoto: '从相册选择',
            promptLabelPicture: '拍照',
            source: source,
        });
        dataUrl = img.dataUrl;
    }
    else 
    {
        if (source === CameraSource.Photos)
        {
            const img = await pickFile('image/*');
            if (!img) return null;
            dataUrl = img.data;
            fileName = img.name;
        }
        else
        {
            let supportCapture = true;
            supportCapture &&= /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const tmp = document.createElement('input')
            tmp.capture = 'camera';
            supportCapture &&= tmp.capture === 'camera';
            if (!supportCapture) 
            {
                const img = await Camera.getPhoto({
                    resultType: CameraResultType.DataUrl,
                    promptLabelHeader: '选择图片',
                    promptLabelCancel: '取消',
                    promptLabelPhoto: '从相册选择',
                    promptLabelPicture: '拍照',
                    source: CameraSource.Camera,
                });
                dataUrl = img.dataUrl;
            }
            else
            {
                const img = await pickFile('image/*', { capture: 'c' });
                if (!img) return null;
                dataUrl = img.data;
                fileName = img.name;
            }
        }
    }

    if (!dataUrl) return null;
    if (!fileName)
    {
        if (dataUrl.startsWith('data:image/png')) fileName = 'image.png';
        else if (dataUrl.startsWith('data:image/jpeg')) fileName = 'image.jpg';
        else if (dataUrl.startsWith('data:image/webp')) fileName = 'image.webp';
        else if (dataUrl.startsWith('data:image/gif')) fileName = 'image.gif';
        else 
        {
            useNotification().addWarning("不支持的图片格式");
            return null;
        }
    }
    if (!maxBytes) return { name: fileName, data: dataUrl };

    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], fileName, { type: blob.type });
    if (file.size < maxBytes) return { name: fileName, data: dataUrl };

    const compressed = await compressImageToMaxBytes(file, { maxBytes });
    return compressed ? { name: fileName, data: (await readFileAsDataURL(compressed))! } : null;
}

async function readFileAsDataURL(file: File): Promise<string | null>
{
    return new Promise((resolve) =>
    {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}

export async function base64ToFile(fileName: string, base64: string): Promise<File | null>
{
    const response = await fetch(base64);
    const blob = await response.blob();
    fileName = fileName || `image.${blob.type.split('/')[1]}`;
    return new File([blob], fileName, { type: blob.type });
}

export async function pickImageToFile(maxBytes?: number): Promise<File | null>
{
    const base64 = await pickImage(maxBytes);
    if (!base64) return null;
    return await base64ToFile(base64.name, base64.data);
}

export function isAiApp() 
{
    return appInfo.mode === 'AI';
}