/**
 * 防抖函数，支持设置延迟时间、首次调用是否立即执行、冲突时行为
 * @param fn 原函数
 * @param delay 延迟时间
 * @param immediate 首次调用是否立即执行(默认为false)
 * @returns 防抖后的函数
 */
export default function<T extends any[]>(fn: (...args: T) => void, delay: number, immediate: boolean = false)
{
    let timer: number | null = null;
    return function (...args: T)
    {
        if (timer) clearTimeout(timer);
        if (immediate)
        {
            immediate = false;
            fn(...args);
        }
        timer = setTimeout(() =>
        {
            fn(...args);
            timer = null;
        }, delay);

    }
}