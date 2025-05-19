import { marked } from "marked";
import markedKatex, { type MarkedKatexOptions } from "marked-katex-extension";
import { connectUrl, Target } from "../networks/utils/sendRequest";
import type { Directive } from "vue";
import type { SectionId } from "../dataClasses/Ids";

const katexOptions: MarkedKatexOptions = {
    throwOnError: false,
    output: 'htmlAndMathml',
    nonStandard: true,
};

marked.use(markedKatex(katexOptions));
marked.setOptions({ silent: true });

// marked库中会用到at方法，但在某些浏览器中可能不支持，因此手动给Array原型添加at方法
const arrayProto: any = Array.prototype;
if (!arrayProto.at) arrayProto.at = function (index: number) 
{
    return this[index < 0 ? this.length + index : index];
};

export function sectionMarkdownToHtml(section: SectionId, markdown: string): string
{
    if (section > 0) return markdownToHtml(markdown, connectUrl(Target.CDN, '/section_images/' + section + '/'));
    else return markdownToHtml(markdown, connectUrl(Target.CDN, '/exam_images/' + (-section) + '/'));
}

function supportsMathML()
{
    try
    {
        const mathElem = document.createElementNS(
            'http://www.w3.org/1998/Math/MathML',
            'math'
        );
        return (
            mathElem instanceof MathMLElement &&
            typeof mathElem.attributeStyleMap === 'object'
        );
    } 
    catch (e)
    {
        return false;
    }
}

export function markdownToHtml(markdown: string, imgBaseUrl?: string): string 
{
    const renderer = new marked.Renderer();
    if (imgBaseUrl) renderer.image = function (info) 
    {
        let { href, text, title } = info;
        if (!href.startsWith('http'))
            href = imgBaseUrl + href;
        let size_ = '';
        if (title) 
        {
            let size = title.split('x');
            if (size[0]) size_ += 'width=' + size[0];
            if (size[1]) size_ += ' height=' + size[1];
        }
        return `<img src="${href}" alt="${text || ''}" ${size_} />`;
    };
    const res = marked.parse(markdown, { renderer }) as string;
    const html = `<quiz-markdown-body>${res}</quiz-markdown-body>`;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    if (supportsMathML()) tempDiv.querySelectorAll(".katex-html").forEach((elem) => elem.remove());
    else tempDiv.querySelectorAll(".katex-mathml").forEach((elem) => elem.remove());
    return tempDiv.innerHTML;
}

export interface MarkdownContent
{
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
};

function updateMarkdown(el: HTMLElement, binding: MarkdownContent) 
{
    const { markdown, content, section } = binding;
    if (markdown !== false)
    {
        if (section) el.innerHTML = sectionMarkdownToHtml(section, content);
        else el.innerHTML = markdownToHtml(content);
    }
    else el.innerText = content;
}