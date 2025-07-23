<script setup lang="ts">
import { ref } from 'vue';
import Button from '../components/Button.vue';
import Card from '../components/Card.vue';
import Input from '../components/Input.vue';
import Split from '../templates/Split.vue';
import ArrowRightIcon from 'vue-material-design-icons/ArrowRight.vue';
import ContentCopyIcon from 'vue-material-design-icons/ContentCopy.vue';
import LoadingIcon from 'vue-material-design-icons/Loading.vue';
import { useNotification } from '../stores/notification';
import { translateSSE } from '../networks/backend/ai';

const input = ref('');
const output = ref('');
const isOutput = ref(false);

function copy() 
{
    if (!output.value) 
    {
        useNotification().addWarning('没有内容可复制');
        return;
    }
    navigator.clipboard.writeText(output.value);
    useNotification().addSuccess('已复制到剪贴板');
}

function translate() 
{
    if (isOutput.value) return;
    isOutput.value = true;
    output.value = '';
    translateSSE(input.value, (txt: string) => {
        const value = output.value + txt;
        output.value = value.trimStart();
    }).finally(() => isOutput.value = false)
}

</script>

<template>
    <Split>
        <template #left>
            <Card class="card" style="min-width: 300px;">
                <div style="display: flex;">
                    <Button :disabled="true">
                        语言：自动识别
                    </Button>
                    <Button @click="translate" style="right: 0; margin-left: auto; display: flex; align-items: center; text-align: center; justify-content: center;" :disabled="isOutput">
                        翻译
                        <ArrowRightIcon v-if="!isOutput"/>
                        <div class="loading-icon" v-else>
                            <LoadingIcon/>
                        </div>
                    </Button>
                </div>
                <Input :area="true" class="input" v-model="input" />
            </Card>
        </template>

        <template #right>
            <Card class="card">
                <div style="display: flex;">
                    <Button :disabled="true">
                        中英互译
                    </Button>
                    <Button @click="copy" style="height: 44px; width: 44px; right: 0; margin-left: auto; display: flex; align-items: center; text-align: center; justify-content: center;">
                        <ContentCopyIcon/>
                    </Button>
                </div>
                <Input :area="true" class="input" disabled v-model="output" />
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
</style>