import { marked } from "marked";
import markedKatex, { type MarkedKatexOptions } from "./katex";
import "katex/dist/contrib/mhchem.mjs";
import { connectUrl, Target } from "../networks/utils/sendRequest";
import type { Directive } from "vue";
import type { SectionId } from "../dataClasses/Ids";
import { all, createStarryNight } from '@wooorm/starry-night';
import { toHtml } from 'hast-util-to-html'
import "./markdown-code.scss";

let starryNight: Awaited<ReturnType<typeof createStarryNight>>;

(async () => {
    starryNight = await createStarryNight(all);
})()

const katexOptions: MarkedKatexOptions = {
    throwOnError: false,
    output: 'htmlAndMathml',
    nonStandard: true,
    strict: "ignore",
};

marked.use(markedKatex(katexOptions) as any);
marked.setOptions({ silent: true });

// marked库中会用到at方法，但在某些浏览器中可能不支持，因此手动给Array原型添加at方法
const arrayProto: any = Array.prototype;
if (!arrayProto.at) arrayProto.at = function (index: number) 
{
    return this[index < 0 ? this.length + index : index];
};

function sectionMarkdownToHtml(section: SectionId, markdown: string): string
{
    return markdownToHtml(markdown, connectUrl(Target.CDN, '/section_images/' + section + '/'));
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

function markdownToHtml(markdown: string, imgBaseUrl?: string): string 
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
    renderer.code = function (info)
    {
        const lang = info.lang || '';
        const code = info.text || '';
        const scope = starryNight.flagToScope(lang);
        if (!scope) return `<code>${code}</code>`;
        return `<code>` + toHtml(starryNight.highlight(code, scope)) + `</code>`;
    };
    const res = marked.parse(markdown, { renderer }) as string;
    const html = `<quiz-markdown-body class="markdown-body">${res}</quiz-markdown-body>`;
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
    parseHtml?: (ele: HTMLElement) => void;
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
    const { markdown, content, section, parseHtml } = binding;
    if (markdown !== false)
    {
        const tmpDiv = document.createElement('div');
        tmpDiv.className = 'quiz-markdown-tmp-div';
        if (section) tmpDiv.innerHTML = sectionMarkdownToHtml(section, content);
        else tmpDiv.innerHTML = markdownToHtml(content);
        if (parseHtml) parseHtml(tmpDiv.firstElementChild as HTMLElement);
        el.innerHTML = '';
        el.appendChild(tmpDiv.firstElementChild as HTMLElement);
    }
    else el.innerText = content;
}