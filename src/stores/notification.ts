import { defineStore } from 'pinia'

export interface Notification {
    id: number
    message: string
    type?: 'info' | 'success' | 'warning' | 'error'
    timeout?: number
}

export const useNotificationStore = defineStore('notification', {
    state: () => ({
        notifications: [] as Notification[],
        nextId: 1
    }),
    actions: {
        addError(message: string | Error) {
            this.add({ message: message instanceof Error ? message.message : message, type: 'error' })
        },
        addSuccess(message: string) {
            this.add({ message, type: 'success' })
        },
        addWarning(message: string) {
            this.add({ message, type: 'warning' })
        },
        addInfo(message: string) {
            this.add({ message, type: 'info' })
        },
        add(notification: Omit<Notification, 'id'>) 
        {
            const id = this.nextId++
            this.notifications.push({
                id,
                ...notification,
                timeout: notification.timeout ?? 3000
            })

            if (notification.timeout !== -1)
            {
                setTimeout(() => {
                    this.remove(id)
                }, notification.timeout ?? 3000)
            }
            return id
        },
        remove(id: number) {
            const index = this.notifications.findIndex(n => n.id === id)
            if (index !== -1) {
                this.notifications.splice(index, 1)
            }
        }
    }
})