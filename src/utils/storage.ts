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

export function storageSet(key: string, value: string): void
{
    Capacitor.getPlatform() === 'web' ? localStorage.setItem(key, value) : Preferences.set({ key, value });
}

export function storageRemove(key: string): void
{
    Capacitor.getPlatform() === 'web' ? localStorage.removeItem(key) : Preferences.remove({ key });
}
