import { ref } from 'vue';

export enum State
{
    NONE,
    ENTER,
    LEAVE,
}

export const $appearDuration = 300;
export const $animateDuration = 300;

const state = ref<State>(State.NONE);

const transitionActions = {
    onLeave: () => 
    {
        state.value = State.LEAVE;
    },
    onEnter: () =>
    {
        state.value = State.ENTER;
    },
    clear: () =>
    {
        state.value = State.NONE;
    }
};

export const useTransitionActions = () =>
{
    return transitionActions;
};

const transitionStore = 
{
    get state() : State 
    {
        return state.value;
    }
}

export const useTransitionStore = () =>
{
    return transitionStore;
};