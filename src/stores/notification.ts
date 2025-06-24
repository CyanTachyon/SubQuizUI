import { ref } from 'vue';

export interface Notification
{
    id: bigint;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    timeout?: number;
}

const notifications = ref([] as Notification[]);
const nextId = ref(1n);

const actions = {
    addError: (message: string | Error) =>
    {
        actions.add({ message: message instanceof Error ? message.message : message, type: 'error' });
    },
    addSuccess: (message: string) =>
    {
        actions.add({ message, type: 'success' });
    },
    addWarning: (message: string) =>
    {
        actions.add({ message, type: 'warning' });
    },
    addInfo: (message: string) =>
    {
        actions.add({ message, type: 'info' });
    },
    add: (notification: Omit<Notification, 'id'>) =>
    {
        const id = nextId.value++;
        notifications.value.push({
            id,
            ...notification,
            timeout: notification.timeout ?? 3000
        });

        if (notification.timeout !== -1)
        {
            setTimeout(() =>
            {
                actions.remove(id);
            }, notification.timeout ?? 3000);
        }
        return id;
    },
    remove: (id: bigint) =>
    {
        const index = notifications.value.findIndex(n => n.id === id);
        if (index !== -1)
        {
            notifications.value.splice(index, 1);
        }
    }
}

export const useNotification = () =>
{
    return actions;
}

export const getNotifications = () =>
{
    return notifications.value;
}