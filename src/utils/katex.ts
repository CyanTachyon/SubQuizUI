import katex, { type KatexOptions } from 'katex';
const inlineRuleNonStandard = /^(?:(\${1,2})(?!\$)((?:\\.|[^\\\n])*?(?:\\.|[^\\\n\$]))\1)|^(?:\\\(((?:\\.|[^\\\n])*?(?:\\.|[^\\\n\$]))\\\))/;
const blockRule = /^(?:(\${1,2})\n((?:\\[\s\S]|[^\\])+?)\n\1(?:\n|$))|^(?:\\\[((?:\\[\s\S]|[^\\])+?)\\\])/;

// Define the options interface for KaTeX rendering
export interface MarkedKatexOptions extends KatexOptions
{
    nonStandard?: boolean;
    [key: string]: unknown;
}

export default function markedKatex(options = {})
{
    return {
        extensions: [
            inlineKatex(options, createRenderer(options, false)),
            blockKatex(options, createRenderer(options, true)),
        ],
    };
}

function createRenderer(options, newlineAfter)
{
    return (token) => katex.renderToString(token.text, { ...options, displayMode: token.displayMode }) + (newlineAfter ? '\n' : '');
}

function inlineKatex(_, renderer)
{
    const ruleReg = inlineRuleNonStandard;
    return {
        name: 'inlineKatex',
        level: 'inline',
        start(src)
        {
            let indexSrc = src;

            while (indexSrc)
            {
                let index0 = indexSrc.indexOf('$');
                let index1 = indexSrc.indexOf('\\(');
                const index = index0 === -1 ? index1 : index1 === -1 ? index0 : Math.min(index0, index1);
                if (index === -1) return;
                const possibleKatex = indexSrc.substring(index);
                if (possibleKatex.match(ruleReg)) return index;
                indexSrc = indexSrc.substring(index + 1).replace(/^\$+/, '');
            }
        },
        tokenizer(src, _)
        {
            const match = src.match(ruleReg);
            if (match)
            {
                return {
                    type: 'inlineKatex',
                    raw: match[0],
                    text: match[2]?.trim() || match[3]?.trim() || ' ',
                    displayMode: false,
                };
            }
        },
        renderer,
    };
}

function blockKatex(_, renderer)
{
    return {
        name: 'blockKatex',
        level: 'block',
        start(src)
        {
            let indexSrc = src;

            while (indexSrc)
            {
                let index0 = indexSrc.indexOf('$');
                let index1 = indexSrc.indexOf('\\[');
                const index = index0 === -1 ? index1 : index1 === -1 ? index0 : Math.min(index0, index1);
                if (index === -1) return;
                const possibleKatex = indexSrc.substring(index);
                if (possibleKatex.match(blockRule)) return index;
                indexSrc = indexSrc.substring(index + 1).replace(/^\$+/, '');
            }
        },
        tokenizer(src: string, _)
        {
            const match = src.match(blockRule);
            if (match)
            {
                return {
                    type: 'blockKatex',
                    raw: match[0],
                    text: match[2]?.trim() || match[3]?.trim() || ' ',
                    displayMode: true,
                };
            }
        },
        renderer,
    };
}