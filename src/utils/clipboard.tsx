import { App } from '@capacitor/app';
import { Clipboard } from '@capacitor/clipboard';
import { router } from '../main';
import { dialog } from './dialog';
import Button from '../components/Button.vue';
import { Capacitor } from '@capacitor/core';

let onClose: () => void = null;
let lastCheck: string = '';
export async function checkClipboardAndHandle()
{
    if (Capacitor.getPlatform() === 'web') return;
    try
    {
        const c = await Clipboard.read();
        const text = c.value ?? '';
        if (!text) return;
        if (text === lastCheck) return;
        lastCheck = text;

        let id = null;
        
        if (!id)
        {
            const regex = /\/ai\/chat\/([0-9a-zA-Z]+)/;
            const match = text.match(regex);
            if (match) id = match[1];
        }

        if (!id)
        {
            // @ts-ignore
            const escapedPrefix = typeof RegExp.escape === 'function' ? RegExp.escape(environment.aiShareBase) : environment.aiShareBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`${escapedPrefix}/([0-9a-zA-Z]+)`);
            const match = text.match(regex);
            if (match) id = match[1];
        }


        if (id)
        {
            if (onClose) onClose();
            const close = dialog(<div style="margin: 20px 50px; display: flex; flex-direction: column; gap: 10px;">
                <p>检测到AI聊天分享：{id}</p>
                <p>是否打开？</p>
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 10px;">
                    <Button onClick={() => { close(); }}>取消</Button>
                    <Button onClick={() => { close(); router.push(`/ai/chat/${id}`); }}>打开</Button>
                </div>
            </div>, () => close());
            onClose = close;
        }
    } 
    catch (e)
    {
        console.error('读取剪贴板失败', e);
    }
}

App.addListener('resume', () =>
{
    checkClipboardAndHandle();
});
App.addListener('appStateChange', ({ isActive }) =>
{
    if (isActive) checkClipboardAndHandle();
});