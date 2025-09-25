import { createApp, ref, type DefineComponent } from "vue";
import type { JSX } from "vue/jsx-runtime";
import { addBeforeChangeHandler, getScale, removeBeforeChangeHandler } from "../main";
import Dialog from "../components/Dialog.vue";
import Input from "../components/Input.vue";
import { vMarkdown, vSectionContent } from "./markdown.ts";

export function dialog(
    innerHtml: JSX.Element | string | DefineComponent,
    onClose: () => void = () => {},
)
{
    if (typeof innerHtml === 'string') innerHtml = <div innerHTML={innerHtml}></div>;
    const container = document.createElement('div');
    container.id = 'quiz-dialog-' + Math.random().toString(36).substring(2, 15);
    document.body.appendChild(container);

    const open = ref(true);
    const app = createApp({
        setup()
        {
            const scale = getScale();
            const css = `
                width: ${100 / scale}%;
                height: ${100 / scale}%;
                min-width: ${100 / scale}%;
                min-height: ${100 / scale}%;
                max-width: ${100 / scale}%;
                max-height: ${100 / scale}%;
                overflow: hidden;
                transform: scale(${scale});
                left: 0;
                top: 0;
                margin: 0;
                position: fixed;
                transform-origin: top left;
            `.replace(/\s+/g, ' ').trim();
            return () => <Dialog open={open.value} onClose={onClose} style={css}>{innerHtml}</Dialog>;
        }
    }).directive('markdown', vMarkdown).directive('section-content', vSectionContent);
    app.mount(container);

    const id = addBeforeChangeHandler(() => 
    {
        onClose();
        return true;
    })

    function cleanup()
    {
        removeBeforeChangeHandler(id);
        open.value = false;
        try { app.unmount(); } catch { /* noop */ }
        try { if (container.parentNode) document.body.removeChild(container); } catch { /* noop */ }
    }
    return cleanup;
}

export function inputDialog(
    content: JSX.Element,
    submit: (value: string) => void,
    cancel?: () => void,
    defaultValue?: string,
)
{
    const input = ref<string | null>(defaultValue || null);
    const close = dialog(
        <form autocomplete="off" onSubmit={(event) => { event.preventDefault(); submit(input.value); close(); }} style="height: fit-content; width: fit-content; display: flex; flex-direction: column; gap: 10px;">
            {content}
            <Input placeholder="Enter here" v-model={input.value} class="dialog-input" />
        </form>,
        cancel ? cancel : (() => close()),
    );
    return close;
}