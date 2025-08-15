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

export const isStatic = (ele: Element) =>
{
    if (!ele) return false;
    
    let style = window.getComputedStyle(ele).getPropertyValue('--transition').trim();
    
    while (style.startsWith("'") || style.startsWith('"')) style = style.slice(1);
    while (style.endsWith("'") || style.endsWith('"')) style = style.slice(0, -1);
    console.log(style);
    return style === 'static';
}