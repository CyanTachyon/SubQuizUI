import type { Directive } from 'vue';
import type { MarkdownContent, SectionContent } from '../utils/markdown';

// 为全局自定义指令提供类型：在 .vue 模板里获得 v- 指令的类型检查与补全
declare module 'vue' {
    interface GlobalDirectives {
        // 使用时写法为 v-markdown
        markdown: Directive<any, MarkdownContent>;
        // 使用时写法为 v-section-content
        'section-content': Directive<any, SectionContent>;
    }
}