import { createApp, ref, type DefineComponent } from "vue";
import { Capacitor } from '@capacitor/core';
import { connectUrl, Target } from "../networks/utils/sendRequest.ts";
import { safeRedirect } from "./redirect.ts";
import Dialog from "../components/Dialog.vue";
import Input from "../components/Input.vue";
import type { JSX } from "vue/jsx-runtime";
import RealNameRequired from "../templates/RealNameRequired.vue";
import { vMarkdown, vSectionContent } from "./markdown.ts";
import type { Section } from "../dataClasses/Section.ts";
import type { AndroidVersion } from "../dataClasses/AndroidVersion.ts";
import currentVersion from "../../public/android_latest.json";
import { useNotification } from "../stores/notification.ts";
import Button from "../components/Button.vue";
import { InAppBrowser, ToolBarType } from "@capgo/inappbrowser";
import { login } from "../networks/backend/oauth.ts";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { getScale } from "../main.ts";
import { Clipboard } from "@capacitor/clipboard";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { compressImageToMaxBytes } from "./image.ts";

export function tryLogin()
{
    tryOpenSSO('/oauth?needAuthorize=' + environment.ssoServiceId);
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
    InAppBrowser.addListener("closeEvent", async () =>
    {
        await ScreenOrientation.lock({ orientation: 'landscape' });
    });
}

export function tryOpenSSO(url: string)
{
    if (Capacitor.getPlatform() === 'web') 
    {
        const callbackUrl = connectUrl(Target.FRONTEND, "/login", { from: location.pathname });
        const target = connectUrl(Target.SSO_FRONTEND, url, { from: callbackUrl });
        safeRedirect(target);
    }
    else 
    {
        const doneUrl = connectUrl(Target.FRONTEND, '/_app/login');
        const callbackUrl = connectUrl(Target.EMPTY, doneUrl, { from: location.pathname });
        const target = connectUrl(Target.SSO_FRONTEND, url, { from: callbackUrl });
        (async () =>
        {
            await ScreenOrientation.unlock();
            await InAppBrowser.openWebView({ 
                url: target,
                toolbarType: ToolBarType.BLANK,
            });
        })();
    }
}

export function getUrlSearchParams(): Record<string, string>
{
    return Object.fromEntries(new URLSearchParams(location.search).entries());
}


/**
 * 设置当前的url，但是不触发vue router的跳转
 */
export function pushUrl(url: string = location.pathname, query: Record<string, string> = getUrlSearchParams())
{
    window.history.pushState({}, '', connectUrl(Target.EMPTY, url, query));
}

export function replaceUrl(url: string = location.pathname, query: Record<string, string> = getUrlSearchParams())
{
    window.history.replaceState({}, '', connectUrl(Target.EMPTY, url, query));
}

export function dialog(
    innerHtml: JSX.Element | string | DefineComponent,
    onClose: () => void = () => {},
)
{
    if (typeof innerHtml === 'string') innerHtml = <div innerHTML={innerHtml}></div>;
    const container = document.createElement('div');
    container.id = 'quiz-dialog-' + Math.random().toString(36).substring(2, 15);
    document.body.appendChild(container);

    const open = ref(true);
    const app = createApp({
        render()
        {
            const scale = getScale();
            const css = `
                width: ${100 / scale}%;
                height: ${100 / scale}%;
                min-width: ${100 / scale}%;
                min-height: ${100 / scale}%;
                max-width: ${100 / scale}%;
                max-height: ${100 / scale}%;
                overflow: hidden;
                transform: scale(${scale});
                left: 0;
                top: 0;
                margin: 0;
                position: fixed;
                transform-origin: top left;
            `.replace(/\s+/g, ' ').trim();
            return <Dialog open={open.value} onClose={onClose} style={css}>{innerHtml}</Dialog>;
        }
    }).directive('markdown', vMarkdown).directive('section-content', vSectionContent);
    app.mount(container);
    return () =>
    {
        open.value = false;
        app.unmount();
        document.body.removeChild(container);
    };
}

export function inputDialog(
    content: JSX.Element,
    submit: (value: string) => void,
    cancel?: () => void,
    defaultValue?: string,
)
{
    const input = ref<string | null>(defaultValue || null);
    const close = dialog(
        <form autocomplete="off" onSubmit={ (event) => { event.preventDefault(); submit(input.value); close(); } } style="height: fit-content; width: fit-content; display: flex; flex-direction: column; gap: 10px;">
            { content }
            <Input placeholder="Enter here" v-model={ input.value } class="dialog-input"/>
        </form>,
        cancel ? cancel : (() => close()),
    )
    return close;
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

export async function pickImage(maxBytes?: number): Promise<string | null>
{
    let dataUrl: string | null = null;
    let fileName: string | null = null;
    if (Capacitor.getPlatform() === 'web')
    {
        dataUrl = await new Promise<string | null>(async (resolve) =>
        {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.addEventListener("cancel", () => resolve(null), { once: true });
            input.addEventListener("change", (event) =>
            {
                resolve((async () =>
                {
                    const file = (event.target as HTMLInputElement).files?.[0];
                    if (!file) return null;
                    return await readFileAsDataURL(file);
                })());
            }, { once: true });
            input.click();
            input.remove();
        });
    }
    else
    {
        const source = await new Promise<CameraSource | null>((resolve) =>
        {
            const close = dialog(
                <div style="margin: 20px 50px;">
                    <h2 style="display: flex; justify-content: center;">选择图片</h2>
                    <Button onClick={() => {
                        resolve(CameraSource.Camera);
                        close();
                    }}>
                        拍摄新照片
                    </Button>
                    <Button onClick={() => {
                        resolve(CameraSource.Photos);
                        close();
                    }}>
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
        const img = await Camera.getPhoto({
            resultType: CameraResultType.DataUrl,
            promptLabelHeader: '选择图片',
            promptLabelCancel: '取消',
            promptLabelPhoto: '从相册选择',
            promptLabelPicture: '拍照',
            source: source,
        });
        dataUrl = img.dataUrl;
        fileName = img.path
    }
    if (!dataUrl) return null;
    if (!maxBytes) return dataUrl;
    if (dataUrl.startsWith('data:image/png')) fileName = 'image.png';
    else if (dataUrl.startsWith('data:image/jpeg')) fileName = 'image.jpg';
    else if (dataUrl.startsWith('data:image/webp')) fileName = 'image.webp';
    else if (dataUrl.startsWith('data:image/gif')) fileName = 'image.gif';
    else 
    {
        useNotification().addWarning("不支持的图片格式");
        return null;
    }

    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], fileName, { type: blob.type });
    if (file.size < maxBytes) return dataUrl;

    const compressed = await compressImageToMaxBytes(file, { maxBytes });
    return compressed ? (await readFileAsDataURL(compressed)) : null;
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

export async function base64ToFile(base64: string): Promise<File | null>
{
    const response = await fetch(base64);
    const blob = await response.blob();
    const fileName = `image.${blob.type.split('/')[1]}`;
    return new File([blob], fileName, { type: blob.type });
}

export async function pickImageToFile(maxBytes?: number): Promise<File | null>
{
    const base64 = await pickImage(maxBytes);
    if (!base64) return null;
    return await base64ToFile(base64);
}