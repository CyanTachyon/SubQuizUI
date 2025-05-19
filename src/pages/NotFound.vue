<script setup lang="ts">
import Card from "../components/Card.vue";
import Text from "../components/Text.vue";

document.title = '404 - SubQuiz';
</script>

<template>
    <Card>
        <Text>
            (╥﹏╥) 很抱歉，您访问的内容不存在
        </Text>
    </Card>
</template>

<style scoped lang="scss">
quiz-card {
    position: absolute;
    top: 45%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 450px;
    height: 200px;
    padding: 10px 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    font-size: 20px;
}
</style>