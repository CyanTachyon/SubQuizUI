import katex, { type KatexOptions } from 'katex';
const inlineRuleNonStandard = /^(?:(\${1,2})(?!\$)((?:\\.|[^\\\n])*?(?:\\.|[^\\\n\$]))\1)|^(?:\\\(((?:\\.|[^\\\n])*?(?:\\.|[^\\\n\$]))\\\))/;
const blockRule = /^(?:(\${1,2})\n((?:\\[\s\S]|[^\\])+?)\n\1(?:\n|$))|(?:\\\[((?:\\[\s\S]|[^\\])+?)\\\])/;

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

function inlineKatex(options, renderer)
{
    const nonStandard = options && options.nonStandard;
    const ruleReg = inlineRuleNonStandard;
    return {
        name: 'inlineKatex',
        level: 'inline',
        start(src)
        {
            let index;
            let indexSrc = src;

            while (indexSrc)
            {
                index = indexSrc.indexOf('$');
                if (index === -1)
                {
                    return;
                }
                const f = nonStandard ? index > -1 : index === 0 || indexSrc.charAt(index - 1) === ' ';
                if (f)
                {
                    const possibleKatex = indexSrc.substring(index);

                    if (possibleKatex.match(ruleReg))
                    {
                        return index;
                    }
                }
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
                    text: match[2]?.trim() || match[3]?.trim(),
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
        tokenizer(src: string, _)
        {
            const match = src.match(blockRule);
            if (match)
            {
                return {
                    type: 'blockKatex',
                    raw: match[0],
                    text: match[2]?.trim() || match[3]?.trim(),
                    displayMode: true,
                };
            }
        },
        renderer,
    };
}