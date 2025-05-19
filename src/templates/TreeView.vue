<script setup lang="ts">
import { computed, type Component } from "vue";

export type TreeNode<T> = {
    id: string | number;
    icon?: Component;
    label: string;
    children: TreeNode<T>[];
    click?: () => void;
    clickIcon?: () => void;
    expand?: boolean;
    folder?: boolean;
} & T & ThisType<TreeNode<T> & { father: TreeNode<T> | null }>;

type TreeNode_ = TreeNode<unknown> & { father: TreeNode<unknown> | null };

const nodes_ = defineModel<TreeNode<unknown>[] | TreeNode<unknown>>();
const nodes = computed(() => {
    if (Array.isArray(nodes_.value)) return nodes_.value.map((node) => {
        (node as TreeNode_).father = null;
        return node as TreeNode_;
    });
    else return nodes_.value.children.map((node) => {
        (node as TreeNode_).father = nodes_.value as TreeNode<unknown>;
        return node as TreeNode_;
    });
}); 

</script>

<template>
    <quiz-tree-wrapper>
        <quiz-tree-node v-for="node in nodes" :key="node.id">
            <quiz-tree-node-title>
                <quiz-tree-node-icon @click="node.clickIcon()" :class="node.clickIcon ? 'clickable' : ''">
                    <component :is="node.icon" />
                </quiz-tree-node-icon>

                <quiz-tree-node-label @click="node.click()" :class="node.click ? 'clickable' : ''">
                    {{ node.label }} 
                </quiz-tree-node-label>
            </quiz-tree-node-title>

            <TreeView v-if="node.expand && node.children.length > 0" :model-value="node" :key="node.id" style="margin-left: 20px;"/>
        </quiz-tree-node>
    </quiz-tree-wrapper>
</template>

<style lang="scss" scoped>
quiz-tree-node {
    display: flex;
    flex-direction: column;
}

quiz-tree-node-title {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-top: 3px;
}

quiz-tree-wrapper {
    display: flex;
    flex-direction: column;
}

.clickable {
    cursor: pointer;
}

.input-dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: fit-content;
    z-index: 1000;
    background-color: var(--bgcolor);
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.dialog-title {
    font-size: 18px;
    font-weight: 500;
    margin-bottom: 15px;
    text-align: center;
}

.dialog-buttons {
    display: flex;
    justify-content: center;
    margin-top: 10px;
    gap: 20px;
}

.dialog-button {
    width: 40px;
    min-width: 40px;
    max-width: 40px;
    height: 40px;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>