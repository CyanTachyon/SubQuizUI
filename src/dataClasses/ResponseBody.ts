export interface ResponseBody<DATA>
{
    code: number;
    subStatus: number;
    message: string;
    data: DATA | null;
}