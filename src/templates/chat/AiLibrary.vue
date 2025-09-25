<script setup lang="ts">
import { onMounted, ref, computed, reactive } from 'vue';
import Button from '../../components/Button.vue';
import Split from '../Split.vue';
import FolderOutlineIcon from 'vue-material-design-icons/FolderOutline.vue';
import FileDocumentOutlineIcon from 'vue-material-design-icons/FileDocumentOutline.vue';
import { getLibFiles, getLibFile, uploadLibFile, deleteLibFile } from '../../networks/backend/ai';
import { useNotification } from '../../stores/notification';
import Card from '../../components/Card.vue';

type TreeNode = { name: string; children?: Record<string, TreeNode>; isFile?: boolean };

const notify = useNotification();
const loading = ref(false);
const treeRoot = ref<TreeNode>({ name: '', children: {} });
const currentPath = ref<string[]>([]);
const entries = ref<{ name: string; isDir: boolean }[]>([]);
const selectedFilePath = ref<string | null>(null);
const fileContent = ref('');
const loadingContent = ref(false);
const dropping = ref(false);
const uploading = ref(false);
const uploadProgress = reactive({ current: 0, total: 0 });
const fileInput = ref<HTMLInputElement | null>(null);
const folderInput = ref<HTMLInputElement | null>(null);

const cwd = computed(() => currentPath.value.join('/'));
const cwdDisplay = computed(() => (cwd.value ? '/' + cwd.value : '/'));

function toFullPath(name: string): string {
  return cwd.value ? `${cwd.value}/${name}` : name;
}

function buildTree(paths: string[]): TreeNode {
  const root: TreeNode = { name: '', children: {} };
  for (const p of paths) {
    const parts = p.split('/').filter(Boolean);
    let node = root;
    parts.forEach((part, i) => {
      node.children = node.children || {};
      node.children[part] = node.children[part] || { name: part };
      node = node.children[part];
      if (i === parts.length - 1) node.isFile = true;
    });
  }
  return root;
}

function listEntriesAt(path: string[]): { name: string; isDir: boolean }[] {
  let node = treeRoot.value;
  for (const part of path) {
    if (!node.children || !node.children[part]) return [];
    node = node.children[part];
  }
  const dirs: { name: string; isDir: boolean }[] = [];
  const files: { name: string; isDir: boolean }[] = [];
  if (node.children) {
    for (const [name, child] of Object.entries(node.children)) {
      (child.isFile ? files : dirs).push({ name, isDir: !child.isFile });
    }
  }
  dirs.sort((a, b) => a.name.localeCompare(b.name));
  files.sort((a, b) => a.name.localeCompare(b.name));
  return [...dirs, ...files];
}

async function refresh() {
  loading.value = true;
  try {
    const paths = await getLibFiles();
    treeRoot.value = buildTree(paths);
    entries.value = listEntriesAt(currentPath.value);
  } catch (e) {
    notify.addError('加载知识库文件列表失败');
  } finally {
    loading.value = false;
  }
}

function openDir(name: string) {
  currentPath.value.push(name);
  entries.value = listEntriesAt(currentPath.value);
  selectedFilePath.value = null; fileContent.value = '';
}
function goToPath(idx: number) {
  currentPath.value = currentPath.value.slice(0, idx + 1);
  entries.value = listEntriesAt(currentPath.value);
  selectedFilePath.value = null; fileContent.value = '';
}
function goRoot() {
  currentPath.value = [];
  entries.value = listEntriesAt(currentPath.value);
  selectedFilePath.value = null; fileContent.value = '';
}

async function openFile(name: string) {
  const full = toFullPath(name);
  selectedFilePath.value = full;
  loadingContent.value = true; fileContent.value = '';
  try { fileContent.value = await getLibFile(full); }
  catch { notify.addError('读取文件失败'); }
  finally { loadingContent.value = false; }
}

async function removeFile(nameOrFull: string) {
  const full = nameOrFull.includes('/') ? nameOrFull : toFullPath(nameOrFull);
  try {
    await deleteLibFile(full);
    if (selectedFilePath.value === full) { selectedFilePath.value = null; fileContent.value = ''; }
    notify.addSuccess('删除成功');
    await refresh();
  } catch {
    notify.addError('删除失败');
  }
}

function triggerChooseFiles() { fileInput.value?.click(); }
function triggerChooseFolder() { folderInput.value?.click(); }
async function onFileInputChange(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  await handleFiles(Array.from(input.files));
  input.value = '';
}
async function onFolderInputChange(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  await handleFiles(Array.from(input.files));
  input.value = '';
}

async function handleFiles(files: File[]) {
  uploading.value = true; uploadProgress.current = 0; uploadProgress.total = files.length;
  const failed: { name: string; reason: string }[] = [];
  let successCount = 0;
  for (const f of files) {
    try {
      const rel = (f as any).webkitRelativePath && (f as any).webkitRelativePath.length > 0 ? (f as any).webkitRelativePath : f.name;
      const dest = cwd.value ? `${cwd.value}/${rel}` : rel;
      const text = await f.text();
      await uploadLibFile(dest, text);
      successCount++;
    } catch (err) {
      const reason = (err as Error)?.message || '';
      failed.push({ name: (f as any).webkitRelativePath || f.name, reason });
    } finally {
      uploadProgress.current++;
    }
  }
  if (failed.length === 0) {
    notify.addSuccess(`上传完成，共 ${successCount} 个文件`);
  } else if (successCount > 0) {
    notify.addWarning(`部分文件上传失败：成功 ${successCount} 个，失败 ${failed.length} 个`);
  } else {
    notify.addError(`全部上传失败：共 ${failed.length} 个文件`);
  }
  await refresh();
  uploading.value = false;
}

function onDragOver(e: DragEvent) { e.preventDefault(); dropping.value = true; }
function onDragLeave(e: DragEvent) { e.preventDefault(); dropping.value = false; }
async function onDrop(e: DragEvent) {
  e.preventDefault(); dropping.value = false; if (!e.dataTransfer) return;
  const items = e.dataTransfer.items as any;
  if (items && items[0]?.webkitGetAsEntry) {
    const roots: any[] = [];
    for (let i = 0; i < items.length; i++) { const it = items[i].webkitGetAsEntry(); if (it) roots.push(it); }
    const files: File[] = [];
    const walk = async (entry: any, base: string) => {
      if (entry.isFile) {
        await new Promise<void>((resolve, reject) => {
          entry.file((file: File) => { Object.defineProperty(file, 'webkitRelativePath', { value: base ? base + '/' + file.name : file.name }); files.push(file); resolve(); }, reject);
        });
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        await new Promise<void>((resolve, reject) => {
          const readEntries = () => reader.readEntries(async (ents: any[]) => {
            if (ents.length === 0) return resolve();
            for (const e of ents) await walk(e, base ? base + '/' + entry.name : entry.name);
            readEntries();
          }, reject);
          readEntries();
        });
      }
    };
    for (const r of roots) await walk(r, '');
    await handleFiles(files);
  } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    await handleFiles(Array.from(e.dataTransfer.files));
  }
}

onMounted(refresh);
</script>

<template>
  <Card class="ai-lib" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop">
    <div class="toolbar">
      <div class="breadcrumbs">
        <span class="crumb clickable" @click="goRoot">根目录</span>
        <template v-for="(p, i) in currentPath" :key="i">
          <span class="sep">/</span>
          <span class="crumb clickable" @click="goToPath(i)">{{ p }}</span>
        </template>
      </div>
      <div class="actions">
        <Button :onClick="triggerChooseFiles">上传文件</Button>
        <input ref="fileInput" type="file" multiple hidden @change="onFileInputChange" />
        <Button :onClick="triggerChooseFolder">上传文件夹</Button>
        <input ref="folderInput" type="file" multiple webkitdirectory directory hidden @change="onFolderInputChange" />
      </div>
    </div>

    <Split initialLeftWidth="60%" class="panel">
      <template #left>
        <div class="left">
          <div v-if="loading" class="hint">正在加载...</div>
          <template v-else>
            <div class="entry" v-for="e in entries" :key="e.name" @dblclick="e.isDir ? openDir(e.name) : openFile(e.name)">
              <div class="meta" @click="e.isDir ? openDir(e.name) : openFile(e.name)">
                <FolderOutlineIcon v-if="e.isDir" class="mdi dir" :size="18" />
                <FileDocumentOutlineIcon v-else class="mdi file" :size="18" />
                <span class="name">{{ e.name }}</span>
              </div>
              <div class="ops" v-if="!e.isDir">
                <Button :onClick="() => openFile(e.name)">打开</Button>
                <Button :onClick="() => removeFile(e.name)">删除</Button>
              </div>
            </div>
            <div v-if="entries.length === 0" class="hint">此目录为空</div>
          </template>
        </div>
      </template>
      <template #right>
        <div v-if="dropping" class="drop-mask">释放以上传到：{{ cwdDisplay }}</div>
        <div v-if="uploading" class="hint">正在上传 {{ uploadProgress.current }}/{{ uploadProgress.total }} ...</div>
        <template v-if="selectedFilePath">
        <div class="preview-header">
            <div class="title">预览：{{ selectedFilePath }}</div>
            <Button :onClick="() => removeFile(selectedFilePath!)">删除此文件</Button>
        </div>
        <div v-if="!loadingContent" class="preview"><pre>{{ fileContent }}</pre></div>
        <div v-else class="hint">正在读取...</div>
        </template>
        <div v-else class="hint">请选择左侧文件以预览，或拖拽文件/文件夹到此处上传</div>
      </template>
    </Split>
  </Card>
</template>

<style scoped lang="scss">
.ai-lib { 
    display: flex; 
    flex-direction: column; 
    height: calc(100% - 20px); 
    width: 100%;
    margin-bottom: 7px;
    overflow: hidden;
}
.toolbar { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--border-color, #3333); }
.breadcrumbs { font-size: .95rem; }
.crumb { color: var(--color); }
.clickable { cursor: pointer; }
.sep { margin: 0 6px; opacity: .6; }
.actions { display: flex; align-items: center; }
.panel { flex: 1; max-height: calc(100% - 85px);}
.left { border-right: 1px solid var(--border-color, #3333); overflow: auto; }
.entry { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px dashed var(--border-color, #3333); max-width: 100%; overflow: hidden; }
.meta { display: flex; align-items: center; gap: 8px; overflow: hidden; }
.icon { width: 12px; height: 12px; display: inline-block; border-radius: 2px; }
.icon.dir { background: var(--button-hover-border); }
.icon.file { background: var(--button-border); }
.ops { display: flex; gap: 6px; min-width: fit-content; }
.hint { padding: 12px; opacity: .8; }
.preview-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--border-color, #3333); }
.title { font-weight: bold; }
.preview { padding: 12px; white-space: pre-wrap;overflow: auto;scrollbar-width: none; max-height: 100%; }
.drop-mask { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: #0006; color: #fff; z-index: 2; }
.name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
