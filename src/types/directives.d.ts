import type { Directive } from 'vue';
import type { MarkdownContent } from '../utils/markdown';

declare module 'vue' {
    interface ComponentCustomProperties
    {
        'v-markdown': Directive<any, MarkdownContent, string, string>;
    }
}