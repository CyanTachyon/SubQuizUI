import { defineStore } from 'pinia';

export enum State
{
    NONE,
    ENTER,
    LEAVE,
}

export const $appearDuration = 750;

export const useTransitionStore = defineStore('transition', {
    state: () => ({
        state: State.NONE,
    }),
    actions: {
        onLeave()
        {
            this.state = State.LEAVE;
        },

        onEnter()
        {
            this.state = State.ENTER;
        },

        clear()
        {
            this.state = State.NONE;
        },
    }
});