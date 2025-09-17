import { checkResponse } from "../utils/checkResponse";
import { sendRequest, Target } from "../utils/sendRequest";

const doneSectionCountUrl = '/home/doneSectionCount';
export async function getDoneSectionCount(): Promise<{day: number, count: number}[]> 
{
    return checkResponse(sendRequest({
        target: Target.BACKEND,
        url: doneSectionCountUrl,
        method: 'GET',
    }));
}