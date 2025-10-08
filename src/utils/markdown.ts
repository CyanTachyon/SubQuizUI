import { marked } from "marked";
import markedKatex, { type MarkedKatexOptions } from "./katex";
import "katex/dist/contrib/mhchem.mjs";
import { connectUrl, Target } from "../networks/utils/sendRequest";
import type { Directive } from "vue";
import type { SectionId } from "../dataClasses/Ids";
import { all, createStarryNight } from '@wooorm/starry-night';
import { toHtml } from 'hast-util-to-html'
import "./markdown-code.scss";
import { useNotification } from "../stores/notification";
import { copyToClipboard, richtextToString } from "./utils";

let starryNight: Awaited<ReturnType<typeof createStarryNight>>;

createStarryNight(all).then((sn) => starryNight = sn);

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

function sectionMarkdownToHtml(section: SectionId, markdown: string, renderHtml?: boolean): string
{
    return markdownToHtml(markdown, connectUrl(Target.CDN, '/section_images/' + section + '/'), renderHtml);
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

function markdownToHtml(markdown: string, imgBaseUrl?: string, renderHtml?: boolean): string 
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
    if (renderHtml === false) renderer.html = function (info): string
    {
        const tmpDiv = document.createElement('div');
        tmpDiv.innerText = info.text;
        return tmpDiv.innerHTML;
    };
    renderer.code = function (info)
    {
        const lang = info.lang || '';
        const code = info.text || '';
        let inner: string;
        try
        {
            const scope = starryNight.flagToScope(lang);
            if (!scope) inner = `<code>${code}</code>`;
            else inner = `<code>` + toHtml(starryNight.highlight(code, scope)) + `</code>`;
        }
        catch (e)
        {
            console.log(e);
            inner = `<code>${code}</code>`;
        }
        const tempDiv = document.createElement('div');
        const copyEle = document.createElement('span');
        copyEle.className = 'code-copy';
        copyEle.setAttribute('code', code);
        copyEle.innerText = '复制';
        tempDiv.appendChild(copyEle);
        

        return `
        <div class="code">
            <div class="code-header">
                <span class="code-lang">${lang}</span>
                ${tempDiv.innerHTML}
            </div>
            ${inner}
        </div>`;
    };
    const res = marked.parse(markdown, { renderer }) as string;
    const html = `<quiz-markdown-body class="markdown-body">${res}</quiz-markdown-body>`;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    if (supportsMathML()) tempDiv.querySelectorAll(".katex-html").forEach((elem) => elem.remove());
    else tempDiv.querySelectorAll(".katex-mathml").forEach((elem) => elem.remove());
    return tempDiv.innerHTML;
}

/**
 * 增量更新元素的子节点，保留公共前缀以提高性能
 * @param parent 父元素
 * @param newParent 包含新子节点的临时父元素
 */
function incrementalUpdateChildren(parent: HTMLElement, newParent: HTMLElement)
{
    const allowedTags = ['quiz-markdown-body', 'code', 'div', 'p', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'span', 'strong', 'em', 'hr', 'br', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th'];
    const newChildren = Array.from(newParent.childNodes);
    const oldChildren = Array.from(parent.childNodes);

    const syncAttributes = (target: HTMLElement, source: HTMLElement) =>
    {
        if (target.attributes && source.attributes)
        {
            Array.from(target.attributes).forEach(({ name }) => 
            {
                if (!source.hasAttribute(name)) target.removeAttribute(name);
            });
            Array.from(source.attributes).forEach(({ name, value }) => 
            {
                if (target.getAttribute(name) !== value) target.setAttribute(name, value);
            });
        }
        for (const key in source)
        {
            if (!key.startsWith('on')) continue;
            (target as any)[key] = (source as any)[key] ?? null;
        }
    };

    const minLength = Math.min(newChildren.length, oldChildren.length);
    let commonPrefixLength = minLength;
    for (let i = 0; i < minLength; i++)
    {
        const oldChild = oldChildren[i];
        const newChild = newChildren[i];

        if (oldChild.nodeType === Node.TEXT_NODE && newChild.nodeType === Node.TEXT_NODE)
        {
            if (oldChild.textContent !== newChild.textContent) oldChild.textContent = newChild.textContent ?? '';
            syncAttributes(oldChild as HTMLElement, newChild as HTMLElement);
            continue;
        }

        if (oldChild.nodeType === Node.ELEMENT_NODE && newChild.nodeType === Node.ELEMENT_NODE)
        {
            const oldElem = oldChild as HTMLElement;
            const newElem = newChild as HTMLElement;
            if (oldElem.tagName === newElem.tagName && allowedTags.includes(oldElem.tagName.toLowerCase()))
            {
                syncAttributes(oldElem, newElem);
                incrementalUpdateChildren(oldElem, newElem);
                continue;
            }
        }

        commonPrefixLength = i;
        break;
    }

    while (parent.childNodes.length > commonPrefixLength) parent.removeChild(parent.lastChild!);
    for (let i = commonPrefixLength; i < newChildren.length; i++) parent.appendChild(newChildren[i]);
}

export interface MarkdownContent
{
    markdown?: boolean;
    section?: SectionId;
    content: string;
    parseHtml?: (ele: HTMLElement) => void;
    codeHeader?: boolean;
    renderHtml?: boolean;
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
    const { markdown, content, section, parseHtml, codeHeader, renderHtml } = binding;
    if (markdown !== false)
    {
        const tmpDiv = document.createElement('div');
        tmpDiv.className = 'quiz-markdown-tmp-div';
        if (section) tmpDiv.innerHTML = sectionMarkdownToHtml(section, content, renderHtml);
        else tmpDiv.innerHTML = markdownToHtml(content, undefined, renderHtml);
        tmpDiv.querySelectorAll('.code-copy').forEach((ele: HTMLElement) => 
        {
            const code = ele.getAttribute('code');
            if (!code) return;
            ele.onclick = () => copyToClipboard(code);
            ele.removeAttribute('code');
        });
        tmpDiv.querySelectorAll('.katex-display').forEach((ele: HTMLElement) => 
        {
            ele.style.display = 'block';
            ele.style.overflowX = 'auto';
            ele.style.overflowY = 'hidden';
            ele.classList.add('scrollbar');
        });
        tmpDiv.querySelectorAll('a').forEach((ele) => 
        {
            ele.setAttribute('target', '_blank');
            ele.setAttribute('rel', 'noopener noreferrer');
        });
        if (codeHeader === false) tmpDiv.querySelectorAll('.code-header').forEach((ele) => ele.remove());
        if (parseHtml) parseHtml(tmpDiv.firstElementChild as HTMLElement);
        // 使用增量更新，保留公共前缀以提高性能
        incrementalUpdateChildren(el, tmpDiv);
    }
    else 
    {
        const tmpDiv = document.createElement('div');
        const markdownBody = document.createElement('quiz-markdown-body');
        markdownBody.className = 'markdown-body';
        const p = document.createElement('p');
        p.innerText = content;
        markdownBody.appendChild(p);
        tmpDiv.appendChild(markdownBody);
        // 使用增量更新，保留公共前缀以提高性能
        incrementalUpdateChildren(el, tmpDiv);
    }
}

export type SectionContent = {
    id: SectionId;
    content: any;
};
export const vSectionContent: Directive<any, SectionContent> = {
    mounted(el, binding) 
    {
        updateSectionContent(el, binding.value);
    },
    updated(el, binding) 
    {
        updateSectionContent(el, binding.value);
    }
};
function updateSectionContent(el: HTMLElement, binding: SectionContent)
{
    const errorContent = () => 
    {
        useNotification().addError("出现错误，请联系管理员：Invalid section content " + binding.id);
        console.error("Invalid section content", binding.id, binding.content);
        el.innerText = "出现错误，请联系管理员：Invalid section content " + binding.id;
    };

    if (!binding.content)
    {
        el.innerText = '';
        return;
    }
    if (typeof binding.content === 'string')
    {
        el.innerText = binding.content;
        return;
    }
    if (typeof binding.content !== 'object' || typeof binding.content.type !== 'string')
    {
        errorContent();
        return;
    }

    if (binding.content.type === 'text')
        el.innerText = binding.content.content;
    else if (binding.content.type === 'html')
        el.innerHTML = binding.content.content;
    else if (binding.content.type === 'markdown')
        updateMarkdown(el, { content: binding.content.content, section: binding.id, markdown: true });
    else if (binding.content.type === 'doc') 
        el.innerHTML = richtextToString(binding.content);
    else
    {
        errorContent();
    }
}