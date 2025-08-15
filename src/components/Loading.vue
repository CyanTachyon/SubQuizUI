<script setup lang="ts">
import Text from './Text.vue';

const type = Math.random() * Math.random() <= 0.5;

const tips = [
    '稍等片刻',
    '加载好无聊啊',
    '易控好烦人',
    '你知道吗？\nSubQuiz不由SubIT维护',
    '你知道吗？\nSubQuiz完全由一位北大附中学生开发',
    '你知道吗？\n“关于项目”中可以找到作者的联系方式',
    '你知道吗？\nSubQuiz的代码托管在GitHub上',
    '你知道吗？\nSubQuiz使用了Vue3+Kotlin',
    '你知道吗？\nSubQuiz的开发者非常喜欢Kotlin',
    '你知道吗？\n这道题看着很难，其实一点也不简单',
    '你知道吗？\n反正我不知道',
    '你知道吗？\nSubIT是北大附中最大的科技社团',
    '你知道吗？\nAI答疑可以帮你制作PPT',
    '你知道吗？\nAI答疑可以帮你制作思维导图',
    '你知道吗？\n你可以去建议作者加功能哦\n虽然作者可能不会采纳^v^'
]

const tip = tips[Math.floor(Math.random() * tips.length)];

</script>

<template>
    <Text class="loading">
        <div v-if="type" class="loader0">
            <div class="loader l1"></div>
            <div class="loader l2"></div>
        </div>
        <div v-else class="loader1">
            <div class="loader-square"></div>
            <div class="loader-square"></div>
            <div class="loader-square"></div>
            <div class="loader-square"></div>
            <div class="loader-square"></div>
            <div class="loader-square"></div>
            <div class="loader-square"></div>
        </div>
        <div class="tip">
            {{ tip }}
        </div>
    </Text>
</template>

<style scoped lang="css">
.loading {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    height: 100%;
    width: 100%;
    .tip {
        min-width: fit-content;
        max-width: fit-content;
        width: fit-content;
        margin-top: 40px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: -10px;
        white-space: pre-wrap;
    }
}
.loader0 {
    border: 0 solid transparent;
    border-radius: 50%;
    width: 80px;
    height: 80px;

    .loader {
        width: inherit;
        height: inherit;
        position: absolute;
    }

    .loader::before,
    .loader::after {
        content: '';
        border: 5px solid var(--color);
        border-radius: 50%;
        width: inherit;
        height: inherit;
        position: absolute;
        opacity: 1;
    }

    .l1::before,
    .l1::after {
        animation: clockwiseZ 2.5s infinite;
    }

    .l2::after,
    .l2::before {
        animation: anticlockwiseZ 2.5s infinite;
    }
}

@keyframes clockwiseZ {

    0%,
    100% {
        transform: rotateY(0);
    }

    50% {
        transform: rotateY(180deg) skew(-10deg, -5deg);
    }
}

@keyframes anticlockwiseZ {

    0%,
    100% {
        transform: rotateX(0);
    }

    50% {
        transform: rotateX(-180deg) skew(10deg, 5deg);
    }
}

.loader1 {
    position: relative;
    width: 96px;
    height: 96px;
    transform: rotate(45deg);

    .loader-square {
        position: absolute;
        top: 0;
        left: 0;
        width: 28px;
        height: 28px;
        margin: 2px;
        border-radius: 0px;
        background: white;
        background-size: cover;
        background-position: center;
        background-attachment: fixed;
        animation: square-animation 10s ease-in-out infinite both;
    }

    .loader-square:nth-of-type(0) {
        animation-delay: 0s;
    }

    .loader-square:nth-of-type(1) {
        animation-delay: -1.4285714286s;
    }

    .loader-square:nth-of-type(2) {
        animation-delay: -2.8571428571s;
    }

    .loader-square:nth-of-type(3) {
        animation-delay: -4.2857142857s;
    }

    .loader-square:nth-of-type(4) {
        animation-delay: -5.7142857143s;
    }

    .loader-square:nth-of-type(5) {
        animation-delay: -7.1428571429s;
    }

    .loader-square:nth-of-type(6) {
        animation-delay: -8.5714285714s;
    }

    .loader-square:nth-of-type(7) {
        animation-delay: -10s;
    }
}

@keyframes square-animation {
    0% {
        left: 0;
        top: 0;
    }

    10.5% {
        left: 0;
        top: 0;
    }

    12.5% {
        left: 32px;
        top: 0;
    }

    23% {
        left: 32px;
        top: 0;
    }

    25% {
        left: 64px;
        top: 0;
    }

    35.5% {
        left: 64px;
        top: 0;
    }

    37.5% {
        left: 64px;
        top: 32px;
    }

    48% {
        left: 64px;
        top: 32px;
    }

    50% {
        left: 32px;
        top: 32px;
    }

    60.5% {
        left: 32px;
        top: 32px;
    }

    62.5% {
        left: 32px;
        top: 64px;
    }

    73% {
        left: 32px;
        top: 64px;
    }

    75% {
        left: 0;
        top: 64px;
    }

    85.5% {
        left: 0;
        top: 64px;
    }

    87.5% {
        left: 0;
        top: 32px;
    }

    98% {
        left: 0;
        top: 32px;
    }

    100% {
        left: 0;
        top: 0;
    }
}
</style>