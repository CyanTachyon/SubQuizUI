<script setup lang="ts">
import { ref } from 'vue';
import Button from '../../components/Button.vue';
import Card from '../../components/Card.vue';
import Input from '../../components/Input.vue';
import Split from '../../templates/Split.vue';
import ArrowRightIcon from 'vue-material-design-icons/ArrowRight.vue';
import ContentCopyIcon from 'vue-material-design-icons/ContentCopy.vue';
import LoadingIcon from 'vue-material-design-icons/Loading.vue';
import { useNotification } from '../../stores/notification';
import { translateSSE } from '../../networks/backend/ai';
import SelectMenu from '../../components/SelectMenu.vue';
import SwapHorizontalIcon from 'vue-material-design-icons/SwapHorizontal.vue';
import { copyToClipboard } from '../../utils/utils';

const input = ref('');
const output = ref('');
const isOutput = ref(false);

const langs = [
    "简体中文",
    "繁體中文",
    "英文",
    "日文",
    "韩文",
    "法文",
    "德文",
    "俄文",
];

const lang0 = ref(langs[0]);
const lang1 = ref(langs[2]);

function copy() 
{
    if (!output.value) 
    {
        useNotification().addWarning('没有内容可复制');
        return;
    }
    copyToClipboard(output.value);
}

function translate() 
{
    if (isOutput.value) return;
    isOutput.value = true;
    output.value = '';
    translateSSE(input.value, lang0.value, lang1.value, true, (txt: string) => {
        const value = output.value + txt;
        output.value = value.trimStart();
    }).finally(() => isOutput.value = false)
}

</script>

<template>
    <Split min-left-width="460px" min-right-width="112px">
        <template #left>
            <Card class="card" style="min-width: 300px;">
                <div style="display: flex;">
                    <SelectMenu v-model="lang0" :options="langs.map((x) => ({ label: x, value: x }))" style="min-width: 120px; max-width: 120px;"/>
                    <div style="display: flex; align-items: center; text-align: center; justify-content: center;">
                        <SwapHorizontalIcon/>
                    </div>
                    <SelectMenu v-model="lang1" :options="langs.map((x) => ({ label: x, value: x }))" style="min-width: 120px; max-width: 120px;"/>
                    <Button @click="translate" style="right: 0; margin-left: auto; display: flex; align-items: center; text-align: center; justify-content: center;" :disabled="isOutput">
                        翻译
                        <ArrowRightIcon v-if="!isOutput" />
                        <div class="loading-icon" v-else>
                            <LoadingIcon />
                        </div>
                    </Button>
                </div>
                <Input :area="true" class="input" v-model="input" />
            </Card>
        </template>

        <template #right>
            <Card class="card">
                <div style="display: flex;">
                    <Button @click="copy" style="height: 44px; width: 44px; right: 0; margin-left: auto; display: flex; align-items: center; text-align: center; justify-content: center;">
                        <ContentCopyIcon />
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