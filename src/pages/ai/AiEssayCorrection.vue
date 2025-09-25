<script setup lang="tsx">
import { defineComponent, ref, computed, onUnmounted } from 'vue';
import type { PropType } from 'vue';
import Button from '../../components/Button.vue';
import Card from '../../components/Card.vue';
import Input from '../../components/Input.vue';
import Split from '../../templates/Split.vue';
import ArrowRightIcon from 'vue-material-design-icons/ArrowRight.vue';
import LoadingIcon from 'vue-material-design-icons/Loading.vue';
import ChevronRightIcon from 'vue-material-design-icons/ChevronRight.vue';
import ChevronDownIcon from 'vue-material-design-icons/ChevronDown.vue';
import { useNotification } from '../../stores/notification';
import type { Part } from '../../networks/backend/ai';
import { essayCorrection } from '../../networks/backend/ai';
import { addBeforeChangeHandler, phone, removeBeforeChangeHandler } from '../../main';
import { pickImage } from '../../utils/utils';

document.title = 'AI作文批改 - SubQuiz';

// inputs
const requirement = ref('');
const essay = ref('');
const isLoading = ref(false);

// result
const overallComment = ref('');
const parts = ref<Part[]>([]);

// collapse state (default collapsed)
const expanded = ref<Set<string>>(new Set());

// 是否已有批改结果（用于手机模式显示右栏）
const hasResult = computed(() =>
{
    const hasComment = !!(overallComment.value && overallComment.value.trim().length > 0);
    const hasParts = parts.value.length > 0;
    return hasComment || hasParts;
});
const guardId = addBeforeChangeHandler(() =>
{
    if (phone.value && hasResult.value)
    {
        overallComment.value = '';
        parts.value = [];
        expanded.value = new Set();
        return true;
    }
    return false;
});
onUnmounted(() => removeBeforeChangeHandler(guardId));

// helpers for display logic
function isDataUrl(v: string): boolean
{
    return typeof v === 'string' && /^data:image\//i.test(v.trim());
}
function showResult(p: Part): boolean
{
    const a = (p.original ?? '').trim();
    const b = (p.result ?? '').trim();
    return a !== b;
}
function hasOwnContent(p: Part): boolean
{
    return showResult(p) || !!(p.comment && p.comment.trim());
}
function hasDisplay(p: Part): boolean
{
    if (hasOwnContent(p)) return true;
    if (p.children && p.children.length) return p.children.some(hasDisplay);
    return false;
}

function collectPaths(items: Part[], prefix: string = ''): string[]
{
    const paths: string[] = [];
    const base = prefix ? prefix + '.' : '';
    items.forEach((p, idx) =>
    {
        const path = base + idx;
        paths.push(path);
        if (p.children && p.children.length)
        {
            paths.push(...collectPaths(p.children, path));
        }
    });
    return paths;
}

function expandAll()
{
    const all = collectPaths(parts.value);
    expanded.value = new Set(all);
}

function collapseAll()
{
    expanded.value = new Set();
}

function togglePath(path: string)
{
    const set = new Set(expanded.value);
    if (set.has(path)) set.delete(path);
    else set.add(path);
    expanded.value = set;
}

// diff helpers: tokenize + LCS and render colored pieces
function tokenizePieces(s: string): { token: string; sep: string }[]
{
    const out: { token: string; sep: string }[] = [];
    if (!s) return out;
    // 拆分为 [非空白片段 或 空白]，并保留空白作为后置 sep
    const parts = s.split(/(\s+)/);
    const wordRegex = /([A-Za-z0-9_]+|[\u4E00-\u9FFF]+|[^\sA-Za-z0-9_\u4E00-\u9FFF])/g; // 词/中文/标点
    for (let i = 0; i < parts.length; i++)
    {
        const chunk = parts[i];
        if (chunk === '') continue;
        if (/\s+/.test(chunk)) continue; // 空白不作为 token，作为前一 token 的 sep
        const sep = (i + 1 < parts.length && /\s+/.test(parts[i + 1])) ? parts[i + 1] : '';
        if (sep) i++;

        const units: string[] = [];
        const m = chunk.matchAll(wordRegex);
        for (const it of m) units.push(it[0]);
        if (units.length === 0)
        {
            out.push({ token: chunk, sep });
        }
        else
        {
            units.forEach((u, idx) => out.push({ token: u, sep: idx === units.length - 1 ? sep : '' }));
        }
    }
    return out;
}

function lcsFlags(a: string[], b: string[]): [boolean[], boolean[]]
{
    const n = a.length, m = b.length;
    const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--)
        for (let j = m - 1; j >= 0; j--)
            dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const keepA = Array(n).fill(false);
    const keepB = Array(m).fill(false);
    let i = 0, j = 0;
    while (i < n && j < m)
    {
        if (a[i] === b[j]) { keepA[i] = true; keepB[j] = true; i++; j++; }
        else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
        else j++;
    }
    return [keepA, keepB];
}

function renderOriginalDiff(aStr: string, bStr: string)
{
    const aPieces = tokenizePieces(aStr || '');
    const bPieces = tokenizePieces(bStr || '');
    const aTokens = aPieces.map(p => p.token);
    const bTokens = bPieces.map(p => p.token);
    const [keepA] = lcsFlags(aTokens, bTokens);

    // group consecutive deletions into a single span
    const grouped: any[] = [];
    let buf = '';
    let changed = false;
    const flush = () => {
        if (buf === '') return;
        if (changed) grouped.push(<span class="diff-del">{buf}</span>);
        else grouped.push(buf);
        buf = '';
    };
    aPieces.forEach((p, idx) => {
        const isKeep = !!keepA[idx];
        const isChanged = !isKeep;
        if (idx === 0) changed = isChanged;
        if (isChanged !== changed) { flush(); changed = isChanged; }
        buf += p.token + (p.sep || '');
    });
    flush();
    return grouped;
}

function renderResultDiff(aStr: string, bStr: string)
{
    const aPieces = tokenizePieces(aStr || '');
    const bPieces = tokenizePieces(bStr || '');
    const aTokens = aPieces.map(p => p.token);
    const bTokens = bPieces.map(p => p.token);
    const [, keepB] = lcsFlags(aTokens, bTokens);

    // group consecutive insertions/changes into a single span
    const grouped: any[] = [];
    let buf = '';
    let changed = false;
    const flush = () => {
        if (buf === '') return;
        if (changed) grouped.push(<span class="diff-ins">{buf}</span>);
        else grouped.push(buf);
        buf = '';
    };
    bPieces.forEach((p, idx) => {
        const isKeep = !!keepB[idx];
        const isChanged = !isKeep;
        if (idx === 0) changed = isChanged;
        if (isChanged !== changed) { flush(); changed = isChanged; }
        buf += p.token + (p.sep || '');
    });
    flush();
    return grouped;
}

async function onPickRequirementFile()
{
    const { data } = await pickImage(10_000_000) || {};
    if (!data) return;
    requirement.value = data;
}
async function onPickEssayFile()
{
    const { data } = await pickImage(10_000_000) || {};
    if (!data) return;
    essay.value = data;
}

function clearRequirement()
{
    requirement.value = '';
}

function clearEssay()
{
    essay.value = '';
}

async function submit()
{
    if (isLoading.value) return;
    if (!essay.value)
    {
        useNotification().addWarning('请先填写作文内容（或上传图片）');
        return;
    }
    isLoading.value = true;
    overallComment.value = '';
    parts.value = [];
    try
    {
        const res = await essayCorrection(requirement.value || 'none', essay.value);
        overallComment.value = res.comment ?? '';
        parts.value = res.p ?? [];
        // 手机模式无需显式切换，hasResult 为真时自动仅显示右栏
    } 
    catch (e)
    {
        useNotification().addError('批改失败，请稍后重试');
    } 
    finally
    {
        isLoading.value = false;
    }
}

// Recursive renderer for Part[] with collapsible nodes
const PartTree = defineComponent({
    name: 'PartTree',
    props: {
        items: { type: Array as PropType<Part[]>, required: true },
        depth: { type: Number, default: 0 },
        pathPrefix: { type: String, default: '' },
        expandedSet: { type: Object as PropType<Set<string>>, required: true },
        onToggle: { type: Function as PropType<(path: string) => void>, required: true },
    },
    setup(props)
    {
        return () => (
            <div class="essay-correction-part-tree">
                {props.items.map((p, idx) =>
                {
                    if (!hasDisplay(p)) return null;
                    const path = (props.pathPrefix ? props.pathPrefix + '.' : '') + idx;
                    const isOpen = props.expandedSet.has(path);
                    return (
                        <div class={`part-node depth-${props.depth}`}>
                            <div class="node-header" onClick={() => props.onToggle(path)}>
                                <div class="chevron">{isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}</div>
                                <div class="title">
                                    <span class="title-label">原文</span>
                                    {!isOpen && <span class="title-text">{p.original}</span>}
                                </div>
                                <div class="badges">
                                    {p.comment ? <span class="badge badge-info">点评</span> : null}
                                    {p.children && p.children.length ? <span class="badge">{p.children.length} 子项</span> : null}
                                </div>
                            </div>
                            {isOpen && (
                                <div class="node-body">
                                    <div class="part-row">
                                        <div class="part-col">
                                            <div class="label">原文</div>
                                            <pre class="mono">{renderOriginalDiff(p.original, p.result)}</pre>
                                        </div>
                                        {showResult(p) && (
                                            <div class="part-col">
                                                <div class="label">修正</div>
                                                <pre class="mono result">{renderResultDiff(p.original, p.result)}</pre>
                                            </div>
                                        )}
                                    </div>
                                    {p.comment && (
                                        <div class="comment">
                                            <div class="label">点评</div>
                                            <div class="comment-body">{p.comment}</div>
                                        </div>
                                    )}
                                    {p.children && p.children.length > 0 && (
                                        <PartTree items={p.children} depth={(props.depth ?? 0) + 1} pathPrefix={path} expandedSet={props.expandedSet} onToggle={props.onToggle} />
                                    )}
                                </div>
                            )}
                            {idx < props.items.length - 1 && <div class="divider" />}
                        </div>
                    );
                })}
            </div>
        );
    },
});

</script>

<template>
    <Split :min-left-width="'500px'" :min-right-width="'460px'" :direction="phone ? (hasResult ? 'right-only' : 'left-only') : 'row'">
        <template #left>
            <Card class="card" style="min-width: 300px;">
                <div style="display: flex; gap: 8px; align-items: center;">
                    <div style="font-weight: bold; opacity: 0.8; margin-left: 6px;">题目要求</div>
                    <Button @click="onPickRequirementFile" style="margin-left: auto;">上传图片</Button>
                    <Button @click="clearRequirement">清空</Button>
                </div>
                <template v-if="!isDataUrl(requirement)">
                    <Input :area="true" class="input" v-model="requirement" placeholder="输入题目要求，或点击上方按钮上传图片" />
                </template>
                <template v-else>
                    <img class="image-preview" :src="requirement" alt="题目要求图片预览" />
                </template>

                <div style="display: flex; gap: 8px; align-items: center;">
                    <div style="font-weight: bold; opacity: 0.8; margin-left: 6px;">作文内容</div>
                    <Button @click="onPickEssayFile" style="margin-left: auto;">上传图片</Button>
                    <Button @click="clearEssay">清空</Button>
                    <Button @click="submit" :disabled="isLoading"
                        style="display: flex; align-items: center; text-align: center; justify-content: center;">
                        {{ isLoading ? '正在批改' : '开始批改' }}
                        <ArrowRightIcon v-if="!isLoading" />
                        <div class="loading-icon" v-else>
                            <LoadingIcon />
                        </div>
                    </Button>
                </div>
                <template v-if="!isDataUrl(essay)">
                    <Input :area="true" class="input" v-model="essay" placeholder="输入作文正文，或点击上方按钮上传图片" />
                </template>
                <template v-else>
                    <img class="image-preview" :src="essay" alt="作文图片预览" />
                </template>
            </Card>
        </template>

        <template #right>
            <Card class="card">
                <div class="result-header">总体点评</div>
                <div class="overall-comment" v-if="overallComment">{{ overallComment }}</div>
                <div class="overall-comment empty" v-else>等待结果…</div>

                <div class="result-header" style="margin-top: 8px; display: flex; align-items: center; gap: 8px;">
                    <span>逐段批改</span>
                    <div style="margin-left: auto; display: flex; gap: 6px;">
                        <Button @click="expandAll">全部展开</Button>
                        <Button @click="collapseAll">全部折叠</Button>
                    </div>
                </div>
                <div class="parts-wrapper" v-if="parts.length > 0">
                    <PartTree :items="parts" :expanded-set="expanded" :on-toggle="togglePath" />
                </div>
                <div class="overall-comment empty" v-else>暂无分段结果</div>
            </Card>
        </template>
    </Split>
</template>

<style lang="scss" scoped>
.input {
    resize: none;
    flex-grow: 1;
}

.card {
    height: calc(100% - 20px);
    display: flex;
    flex-direction: column;
}

@keyframes loading {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.loading-icon {
    width: 1.5rem;
    height: 1.5rem;
    animation: loading 1s linear infinite;
}

.image-preview {
    width: calc(100% - 12px);
    border-radius: 8px;
    margin: 6px 6px 12px 6px;
    overflow-y: auto;
    scrollbar-width: none;
}

.result-header {
    font-weight: bold;
    opacity: 0.8;
    margin: 10px;
}

.overall-comment {
    margin: 8px 12px 2px 12px;
    line-height: 1.7;
    background: color-mix(in oklab, var(--button-background) 85%, transparent);
    border-left: 4px solid var(--button-highlight-border);
    padding: 10px 12px;
    border-radius: 8px;
    max-height: 40%;
    overflow-y: auto;
    scrollbar-width: none;
}

.overall-comment.empty {
    opacity: 0.6;
}

.parts-wrapper {
    margin: 6px 6px 12px 6px;
    padding-right: 6px;
    overflow: auto;
    scrollbar-width: none;
}

.part-node {
    padding: 6px 2px;
    padding-left: 40px;
}

.node-header {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 8px 10px;
    border-radius: 8px;
    background: linear-gradient(180deg, color-mix(in oklab, var(--button-background) 92%, transparent), color-mix(in oklab, var(--button-background) 82%, transparent));
    border: 1px solid var(--button-border);
    transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.chevron {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
}

.title {
    display: flex;
    align-items: center;
    gap: 6px;
}

.title-label {
    font-size: 12px;
    opacity: 0.7;
    padding: 2px 6px;
    background: var(--button-background);
    border: 1px solid var(--button-border);
    border-radius: 999px;
}

.title-text {
    font-weight: 700;
}

.badges {
    margin-left: auto;
    display: flex;
    gap: 6px;
}

.badge {
    font-size: 12px;
    opacity: 0.9;
    padding: 2px 6px;
    border-radius: 999px;
    background: color-mix(in oklab, var(--button-background) 90%, transparent);
    border: 1px solid var(--button-border);
}

.badge-info {
    border-color: var(--button-highlight-border);
    background: color-mix(in oklab, var(--button-hover-background) 86%, transparent);
}

.part-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

.part-col {
    background: color-mix(in oklab, var(--button-background) 95%, transparent);
    border: 1px solid color-mix(in oklab, var(--button-border) 92%, transparent);
    border-radius: 8px;
    padding: 8px 10px;
}

.node-body {
    margin-top: 6px;
    padding: 10px;
    background: color-mix(in oklab, var(--button-background) 82%, transparent);
    border: 1px dashed color-mix(in oklab, var(--button-border) 92%, transparent);
    border-radius: 8px;
}

.label {
    font-size: 12px;
    opacity: 0.7;
    margin-bottom: 4px;
}

.mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
}

.mono.result {
    color: var(--highlight);
    text-shadow: 0 0 1px color-mix(in oklab, var(--highlight) 35%, transparent);
}

.comment {
    margin-top: 6px;
    padding: 8px 10px;
    border-left: 3px solid var(--button-hover-border);
    background: color-mix(in oklab, var(--button-background) 90%, transparent);
    border-radius: 6px;
}

.comment-body {
    white-space: pre-wrap;
    word-break: break-word;
}

.divider {
    height: 1px;
    background: color-mix(in oklab, var(--border) 70%, transparent);
    opacity: 0.6;
    margin: 10px 0;
}
</style>

<style lang="scss">
@use "sass:list";

/* Global styles for TSX-rendered tree */
.essay-correction-part-tree {
    .part-node {
        position: relative;
        padding: 8px 2px 8px 20px
    }

    .part-node.depth-0 {
        padding-left: 2px;
    }

    /* cyclic depth accents */
    $depth-accents: #6aa6ff, #8bd46e, #f6c453, #ef7da0; // blue, green, amber, rose
    $max-depth: 16;

    @for $i from 0 through $max-depth {
        $idx: (
            $i % 4) + 1;
        $accent: list.nth($depth-accents, $idx
        );

    .depth-#{$i}::before {
        background: color-mix(in oklab, #{$accent} 45%, var(--border));
        opacity: 0.6;
    }

    .depth-#{$i}>.node-header {
        border-color: color-mix(in oklab, #{$accent} 45%, var(--button-border));
        background: linear-gradient(180deg,
            color-mix(in oklab, #{$accent} 10%, var(--button-background)),
            color-mix(in oklab, #{$accent} 18%, var(--button-background)));
    }

    .depth-#{$i}>.node-body {
        border-left: 3px solid color-mix(in oklab, #{$accent} 60%, var(--button-border));
    }
}

.node-header {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 8px 10px;
    border-radius: 8px;
    background: linear-gradient(180deg, color-mix(in oklab, var(--button-background) 92%, transparent), color-mix(in oklab, var(--button-background) 82%, transparent));
    border: 1px solid var(--button-border);
    transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;

    &:hover {
        background: color-mix(in oklab, var(--button-hover-background) 86%, transparent);
        border-color: var(--button-hover-border);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
    }
}

.chevron {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
}

.title {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
}

.title-label {
    min-width: fit-content;
    font-size: 12px;
    opacity: 0.7;
    padding: 2px 6px;
    background: var(--button-background);
    border: 1px solid var(--button-border);
    border-radius: 999px;
}

.title-text {
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.badges {
    margin-left: auto;
    display: flex;
    gap: 6px;
}

.badge {
    font-size: 12px;
    opacity: 0.9;
    padding: 2px 6px;
    border-radius: 999px;
    background: color-mix(in oklab, var(--button-background) 90%, transparent);
    border: 1px solid var(--button-border);
}

.badge-info {
    border-color: var(--button-highlight-border);
    background: color-mix(in oklab, var(--button-hover-background) 86%, transparent);
}

.node-body {
    margin-top: 6px;
    padding: 10px;
    background: color-mix(in oklab, var(--button-background) 82%, transparent);
    border: 1px dashed color-mix(in oklab, var(--button-border) 92%, transparent);
    border-radius: 8px;
}

.part-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

.part-col {
    background: color-mix(in oklab, var(--button-background) 95%, transparent);
    border: 1px solid color-mix(in oklab, var(--button-border) 92%, transparent);
    border-radius: 8px;
    padding: 8px 10px;
}

.label {
    font-size: 12px;
    opacity: 0.7;
    margin-bottom: 4px;
}

.mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
}

.mono.result {
    color: var(--highlight);
    text-shadow: 0 0 1px color-mix(in oklab, var(--highlight) 35%, transparent);
}

.comment {
    margin-top: 6px;
    padding: 8px 10px;
    border-left: 3px solid var(--button-hover-border);
    background: color-mix(in oklab, var(--button-background) 90%, transparent);
    border-radius: 6px;
}

.comment-body {
    white-space: pre-wrap;
    word-break: break-word;
}

.divider {
    height: 1px;
    background: color-mix(in oklab, var(--border) 70%, transparent);
    opacity: 0.6;
    margin: 10px 0;
}

  /* diff highlights */
  .diff-del {
    background: color-mix(in oklab, #ef4444 44%, transparent);
    border-radius: 4px;
    padding: 0 2px;
  }
  .diff-ins {
    background: color-mix(in oklab, #10b981 44%, transparent);
    border-radius: 4px;
    padding: 0 2px;
  }
}
</style>
