export interface Slice<T>
{
    totalSize: number,
    begin: number,
    count: number,
    list: T[],
}