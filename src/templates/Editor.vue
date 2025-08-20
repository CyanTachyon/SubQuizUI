<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import { SimpleEditor } from "../react_bridge/simple-editor-wrapper.js";
import { applyPureReactInVue } from "veaury";
import { type SectionId } from "../dataClasses/Ids.ts";
import { uploadSectionImage } from "@src/utils/sectionImage.ts";
import { connectUrl, Target } from "@src/networks/utils/sendRequest.ts";
import { useNotification } from "@src/stores/notification.ts";

import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Selection } from "@tiptap/extensions";
import ImageUploadNode from "@src/react_bridge/image-upload-node-extension.js";

const EditorElement = applyPureReactInVue(SimpleEditor);

const props = defineProps<{
    section: SectionId;
    editable: boolean;
    modelValue: any;
}>();
const emit = defineEmits<{
    (e: 'update:modelValue', value: any): void;
}>();

const editorWrapper = ref<HTMLElement>();
onMounted(() => 
{
    editorWrapper.value.childNodes.forEach((node) => 
    {
        if (node.nodeName === 'DIV' && (node as HTMLElement).hasAttribute('__use_react_component_wrap')) 
        {
            (node as HTMLElement).setAttribute('style', 'width: 100%; height: 100%;');
            (node as HTMLElement).removeAttribute('__use_react_component_wrap');
        }
    });
})

const uploadImage: (
    file: File,
    onProgress?: (event: { progress: number; }) => void,
    abortSignal?: AbortSignal
) => Promise<string> = async (file, onProgress, _) => 
{
    const id = await uploadSectionImage(file, props.section, onProgress);
    return connectUrl(Target.CDN, '/section_images/' + props.section + '/' + id);
}

const uploadImageError = (error: Error) => 
{
    console.error("Image upload failed:", error);
    useNotification().addError("上传图片失败: " + error.message);
}

let editor = null;

const editorConfig = ({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editable: props.editable,
    editorProps: {
        attributes: {
            autocomplete: "off",
            autocorrect: "off",
            autocapitalize: "off",
            "aria-label": "Main content area, start typing to enter text.",
            class: "simple-editor",
        },
    },
    extensions: [
        StarterKit.configure({
            blockquote: {},
            bold: {},
            bulletList: {},
            code: {},
            codeBlock: {},
            dropcursor: {},
            // gapcursor: true,
            hardBreak: {},
            heading: {},
            undoRedo: {},
            horizontalRule: {},
            italic: {},
            listItem: {},
            listKeymap: {},
            orderedList: {},
            paragraph: {},
            strike: {},
            underline: {},
            trailingNode: {},
        }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Highlight.configure({ multicolor: true }),
        Image.configure({}),
        Typography,
        Superscript,
        Subscript,
        Selection,
        ImageUploadNode.configure({
            accept: "image/*",
            maxSize: 5 * 1024 * 1024,
            limit: 128,
            upload: uploadImage,
            onError: uploadImageError,
        }),
    ],
    content: props.modelValue,
    onUpdate: () => 
    {
        emit('update:modelValue', editor.getJSON());
    }
});

watch(props.modelValue, (c) => 
{
    console.log(c);
    if (editor.getJSON() === c) return;
    editor?.commands?.setContent(c)
});

onUnmounted(() => 
{
    editor?.destroy();
});

</script>
<template>
    <div ref="editorWrapper"
        style="width: 100%; height: 100%; min-width: 100%; max-width: 100%; min-height: 100%; max-height: min(100%, fit-content);"
        :class="[editable ? 'editable' : '']">
        <EditorElement :editor="editorConfig" :setEditor="(e) => editor = e"></EditorElement>
    </div>
</template>