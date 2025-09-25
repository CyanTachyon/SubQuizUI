import { App } from '@capacitor/app';
import { Clipboard } from '@capacitor/clipboard';
import { router } from '../main';
import { dialog } from './dialog';
import Button from '../components/Button.vue';

export async function checkClipboardAndHandle()
{
    try
    {
        const c = await Clipboard.read();
        const text = c.value ?? '';
        if (!text) return;
        // 匹配类似/chat/ai/xxxxx
        const regex = /\/ai\/chat\/([0-9a-zA-Z]+)/;
        const match = text.match(regex);
        console.log(match);
        if (match)
        {
            const id = match[1];
            const close = dialog(<div style="margin: 20px 50px; display: flex; flex-direction: column; gap: 10px;">
                <p>检测到AI聊天分享：{id}</p>
                <p>是否打开？</p>
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 10px;">
                    <Button onClick={() => {close();}}>取消</Button>
                    <Button onClick={() => {close(); router.push(`/ai/chat/${id}`);}}>打开</Button>
                </div>
            </div>, () => close());
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