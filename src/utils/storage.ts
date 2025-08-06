import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

export async function storageGet(key: string, defaultValue?: string): Promise<string | undefined>
{
    const value = Capacitor.getPlatform() === 'web' ? localStorage.getItem(key) : (await Preferences.get({ key })).value;
    if (value === null)
    {
        return defaultValue;
    }
    return value;
}

export async function storageSet(key: string, value: string): Promise<void>
{
    Capacitor.getPlatform() === 'web' ? localStorage.setItem(key, value) : await Preferences.set({ key, value });
}

export async function storageRemove(key: string): Promise<void>
{
    Capacitor.getPlatform() === 'web' ? localStorage.removeItem(key) : await Preferences.remove({ key });
}
