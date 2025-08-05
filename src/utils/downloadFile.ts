import { Capacitor } from "@capacitor/core";
import { FileTransfer } from "@capacitor/file-transfer";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { useNotification } from "../stores/notification";

export function downloadFile(fileName: string, url: string): void 
{
    useNotification().addInfo(`正在下载文件 ${fileName}...`);
    if (Capacitor.getPlatform() === 'web') 
    {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        useNotification().addSuccess(`文件 ${fileName} 下载完成`);
        return;
    }
    Filesystem.getUri({
        directory: Directory.Documents,
        path: fileName
    }).then((file) =>
    {
        return FileTransfer.downloadFile({
            url: '' + url,
            path: file.uri,
            progress: true
        });
    }).then(() =>
    {
        useNotification().addSuccess(`文件 ${fileName} 下载完成`);
    }).catch((error) =>
    {
        console.error(error);
        useNotification().addError(`下载文件 ${fileName} 失败` + (error.message ? `: ${error.message}` : ''));
    });
}