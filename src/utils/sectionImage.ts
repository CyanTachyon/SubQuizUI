import SparkMD5 from 'spark-md5';
import { addSectionImage } from '../networks/backend/section';

async function getFileMD5(file: File): Promise<string>
{
    return new Promise((resolve, reject) =>
    {
        const reader = new FileReader();
        const spark = new SparkMD5.ArrayBuffer();

        reader.onload = (event) => 
        {
            if (event.target?.result) 
            {
                spark.append(event.target.result as ArrayBuffer);
                const hashBinary = spark.end(true);
                const base64 = btoa(hashBinary);
                resolve(base64);
            }
            else 
            {
                reject(new Error('Failed to read file.'));
            }
        };

        reader.onerror = () => reject(new Error('File read error.'));
        reader.readAsArrayBuffer(file);
    });
}

export async function uploadSectionImage(file: File, sectionId: number, onProgress?: (event: { progress: number; }) => void)
{
    return uploadImage(file, sectionId, onProgress);
}

export async function uploadImage(file: File, id: number, onProgress?: (event: { progress: number; }) => void)
{
    let contentType: 'GIF' | 'JPEG' | 'PNG' | 'SVG' | 'XIcon';
    switch (file.type)
    {
        case 'image/gif':
            contentType = 'GIF';
            break;
        case 'image/jpeg':
            contentType = 'JPEG';
            break;
        case 'image/png':
            contentType = 'PNG';
            break;
        case 'image/svg+xml':
            contentType = 'SVG';
            break;
        case 'image/x-icon':
            contentType = 'XIcon';
            break;
        default:
            console.error('Unsupported file type:', file.type);
            return;
    }
    const md5 = await getFileMD5(file);
    const url = await addSectionImage(id, contentType, md5);
    if (!url.uploadUrl) return url.imageId;
    var xhr = new XMLHttpRequest();
    xhr.open('PUT', url.uploadUrl, true);
    xhr.setRequestHeader('Content-MD5', md5);
    let res = new Promise((resolve, reject) =>
    {
        xhr.onload = () =>
        {
            resolve(void 0);
        };
        xhr.onerror = () =>
        {
            reject(new Error('Failed to upload image.'));
        };
        xhr.upload.onprogress = (event) =>
        {
            if (event.lengthComputable)
            {
                const percentComplete = (event.loaded / event.total);
                console.log(`Upload progress: ${percentComplete}`);
                onProgress?.({ progress: percentComplete });
            }
        };
    });
    xhr.send(file);
    await res;
    return url.imageId;
}