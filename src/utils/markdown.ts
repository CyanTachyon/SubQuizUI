import {marked} from "marked";
import markedKatex, { type MarkedKatexOptions } from "marked-katex-extension";
import { connectUrl, Target } from "../networks/utils/sendRequest";
import type { Directive } from "vue";

const katexOptions: MarkedKatexOptions = {
    throwOnError: false,
    output: 'mathml',
    nonStandard: true
};
  
marked.use(markedKatex(katexOptions));
marked.setOptions({silent: true})

// marked库中会用到at方法，但在某些浏览器中可能不支持，因此手动给Array原型添加at方法
const arrayProto: any = Array.prototype;
if (!arrayProto.at) arrayProto.at = function (index: number) 
{
    return this[index < 0 ? this.length + index : index];
};

export function sectionMarkdownToHtml(section: number, markdown: string): string
{
    return markdownToHtml(markdown, connectUrl(Target.CDN, '/section_images/' + section + '/'));
}

export function markdownToHtml(markdown: string, imgBaseUrl?: string): string 
{   
    const renderer = new marked.Renderer();
    if (imgBaseUrl) renderer.image = function (info) 
    {
        let { href, text, title } = info
        if (!href.startsWith('http'))
            href = imgBaseUrl + href
        let size_ = '';
        if (title) 
        {
            let size = title.split('x');
            if (size[0]) size_ += 'width=' + size[0];
            if (size[1]) size_ += ' height=' + size[1];                                                                                                                     
        }
        return `<img src="${href}" alt="${text || ''}" ${size_} />`; 
    }
    const res = marked.parse(markdown, { renderer }) as string;
    return ` <div class="markdown-body"> ${res} </div> `;
}

export interface MarkdownContent {
    markdown?: boolean;
    section?: number;
    content: string;
}

export const vMarkdown: Directive<any, MarkdownContent> = {
    mounted(el, binding) 
    {
        updateMarkdown(el, binding.value);
    },
    updated(el, binding) 
    {
        updateMarkdown(el, binding.value);
    }
}

function updateMarkdown(el: HTMLElement, binding: MarkdownContent) 
{
    const {markdown, content, section} = binding;
    if (markdown !== false)
    {
        if (section) el.innerHTML = sectionMarkdownToHtml(section, content);
        else el.innerHTML = markdownToHtml(content);
    }
    else el.innerText = content;
}