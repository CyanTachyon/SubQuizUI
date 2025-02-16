type Func = (() => any);
export interface Animation
{
    actions: Func[];
}

class AnimationQueue
{
    private animations: Animation[] = [];
    private promise: Promise<void> | null = null;

    constructor()
    {
    }

    private async resolve()
    {
        while (this.animations.length > 0)
        {
            const animation = this.animations.shift();
            if (animation)
            {
                for (const action of animation.actions)
                    await action();
            }
        }
    }

    private startResolve()
    {
        if (!this.promise) this.promise = this.resolve().finally(() =>
        {
            this.promise = null;
            if (this.animations.length > 0) this.startResolve();
        });
    }

    public push(actions: Func[], appendIfHasPromise = true): boolean
    {
        if (this.promise && !appendIfHasPromise) return false;
        this.animations.push({actions});
        if (!this.promise) this.startResolve();
        return true;
    }
}

export function createAnimationsController()
{
    return new AnimationQueue();
}