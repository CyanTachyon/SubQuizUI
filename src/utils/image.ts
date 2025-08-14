import { useNotification } from "../stores/notification";

/**
 * 压缩图片到指定大小以内（默认 1MB）。
 * - 优先导出 png；如需 JPEG 可传 mime: 'image/jpeg'
 * - 先按 maxWidth/maxHeight 限制尺寸，再做质量二分；不满足时继续按比例缩放
 * - 会返回新的 File（文件名带上后缀）
 */
export async function compressImageToMaxBytes(
    file: File,
    options?: {
        maxBytes?: number;                 // 目标最大字节数，默认 1_000_000
        mime?: 'image/jpeg' | 'image/png'; // 目标格式
        maxWidth?: number;                 // 初始最大宽（可不设）
        maxHeight?: number;                // 初始最大高（可不设）
        minQuality?: number;               // 质量下限（0-1），默认 0.4
        maxQuality?: number;               // 质量上限（0-1），默认 0.92
        minScale?: number;                 // 最小缩放比例，默认 0.2
        alphaToWhite?: boolean;            // 若导出 JPEG 且存在透明，是否以白底铺底，默认 false
        qualitySearchSteps?: number;       // 质量二分迭代次数，默认 3
        scaleSearchSteps?: number;         // 缩放二分迭代次数，默认 3
        fileNameSuffix?: string;           // 新文件名后缀，默认 '.compressed'
    }
): Promise<File | null>
{
    const {
        maxBytes = 1_000_000,
        mime = 'image/png',
        maxWidth,
        maxHeight,
        minQuality = 0.4,
        maxQuality = 0.92,
        minScale = 0.2,
        alphaToWhite = false,
        qualitySearchSteps = 3,
        scaleSearchSteps = 3,
        fileNameSuffix = '.compressed',
    } = options || {};

    const image = await loadImageBitmap(file);
    const { width: origW, height: origH } = image;

    // 初次缩放（按传入最大宽高）
    let initialScale = 1;
    if (maxWidth || maxHeight)
    {
        const sw = maxWidth ? maxWidth / origW : 1;
        const sh = maxHeight ? maxHeight / origH : 1;
        initialScale = Math.min(1, sw, sh);
    }

    let targetMime: string = mime;
    if (!isMimeSupportedByToBlob(targetMime))
    {
        targetMime = 'image/png';
    }

    let bestBlob: Blob | null = null;

    let max = initialScale;
    let min = minScale;
    for (let i = 0; i < scaleSearchSteps && max - min > 0.01; i++)
    {
        const scale = min + (max - min) / 2;
        const { canvas, ctx } = createCanvasScaled(image, scale);

        if (targetMime === 'image/jpeg' && alphaToWhite)
        {
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
        }

        // 质量二分查找
        const blob = await binarySearchQualityToBlob(
            canvas,
            targetMime,
            maxBytes,
            { minQuality, maxQuality, steps: qualitySearchSteps }
        );

        if (blob)
        {
            bestBlob = blob;
            min = scale;
        } 
        else
        {
            max = scale;
        }
    }

    if (bestBlob)
    {
        return toFile(bestBlob, getTargetFileName(file.name, targetMime, fileNameSuffix));
    }

    // 直接使用最小的质量和缩放压缩
    const { canvas } = createCanvasScaled(image, min);
    const blob = await canvasToBlob(canvas, targetMime, minQuality);
    if (blob && blob.size <= maxBytes)
    {
        return toFile(blob, getTargetFileName(file.name, targetMime, fileNameSuffix));
    }

    useNotification().addError('图片过大');
    return null;
}

function getTargetFileName(original: string, mime: string, suffix: string): string
{
    const ext = mime === 'image/jpeg' ? '.jpg' : mime === 'image/png' ? '.png' : '';
    const dot = original.lastIndexOf('.');
    const base = dot > -1 ? original.slice(0, dot) : original;
    return `${base}${suffix}${ext}`;
}

async function loadImageBitmap(file: File): Promise<ImageBitmap>
{
    if ('createImageBitmap' in window)
    {
        try
        {
            return await createImageBitmap(file);
        } 
        catch {}
    }
    // Fallback: HTMLImageElement
    const url = URL.createObjectURL(file);
    try
    {
        const img = await loadHTMLImage(url);
        const bitmap = await createImageBitmapFromImage(img);
        return bitmap;
    } 
    finally
    {
        URL.revokeObjectURL(url);
    }
}

function loadHTMLImage(src: string): Promise<HTMLImageElement>
{
    return new Promise((resolve, reject) =>
    {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

async function createImageBitmapFromImage(img: HTMLImageElement): Promise<ImageBitmap>
{
    if ('createImageBitmap' in window)
    {
        return await createImageBitmap(img);
    }
    // 极端兜底：画到 canvas 再 createImageBitmap 不可用时直接返回失败
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    // 这里返回一个近似对象（为兼容性极端情况），但通常不会走到
    return await createImageBitmap(canvas);
}

function createCanvasScaled(image: ImageBitmap, scale: number)
{
    const w = Math.max(1, Math.round(image.width * scale));
    const h = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { alpha: true })!;
    // 使用高质量缩放设置
    (ctx as any).imageSmoothingEnabled = true;
    (ctx as any).imageSmoothingQuality = 'high';
    ctx.drawImage(image, 0, 0, w, h);
    return { canvas, ctx };
}

function canvasToBlob(
    canvas: HTMLCanvasElement | OffscreenCanvas,
    mime: string,
    quality?: number
): Promise<Blob | null>
{
    if ('convertToBlob' in canvas)
    {
        const anyCanvas = canvas as any;
        return anyCanvas.convertToBlob({ type: mime, quality });
    }
    return new Promise((resolve) =>
    {
        (canvas as HTMLCanvasElement).toBlob((blob) => resolve(blob), mime, quality);
    });
}

async function binarySearchQualityToBlob(
    canvas: HTMLCanvasElement | OffscreenCanvas,
    mime: string,
    maxBytes: number,
    opts: { minQuality: number; maxQuality: number; steps: number; }
): Promise<Blob | null>
{
    let lo = opts.minQuality;
    let hi = opts.maxQuality;
    let best: { blob: Blob; q: number; } | null = null;
    for (let i = 0; i < opts.steps; i++)
    {
        const mid = (lo + hi) / 2;
        const blob = await canvasToBlob(canvas, mime, mid);
        if (!blob) break;
        if (blob.size <= maxBytes)
        {
            best = !best || mid > best.q ? { blob, q: mid } : best;
            lo = mid;
        } 
        else
        {
            hi = mid;
        }
        if (Math.abs(hi - lo) < 0.01) break;
    }

    return best?.blob || null;
}

function isMimeSupportedByToBlob(mime: string): boolean
{
    const canvas = document.createElement('canvas');
    try
    {
        const dataUrl = canvas.toDataURL(mime);
        return dataUrl.startsWith(`data:${mime}`);
    } 
    catch
    {
        return false;
    }
}

function toFile(blob: Blob, name: string): File
{
    return new File([blob], name, { type: blob.type || 'application/octet-stream', lastModified: Date.now() });
}