<script setup lang="ts">
import Card from "../components/Card.vue";
import StatusButton from "../components/StatusButton.vue";
import ChevronLeftIcon from "vue-material-design-icons/ChevronLeft.vue";
import {useRouter} from "vue-router";
let router = useRouter();

document.title = '关于 - SubQuiz';

function goBack()
{
    router.back();
}
const version = environment.version
</script>

<template>
    <div class="main">
        <StatusButton class="back" @click="goBack">
            <ChevronLeftIcon/>Go Back
        </StatusButton>
        <Card class="card">
            <h1>SubQuiz</h1>
            <p>Version: {{ version }}</p>
            <p>Author: <a href="https://subit.org.cn/" target="_blank" rel="noopener noreferrer">SubIT Team</a></p>
            <p>Website: <a href="https://subit.org.cn/" target="_blank"
                           rel="noopener noreferrer">https://subit.org.cn/</a></p>
            <p>Github: <a href="https://github.com/subitlab" target="_blank" rel="noopener noreferrer">https://github.com/subitlab</a>
            </p>
            <p>Email: <a href="mailto:subit@i.pkuschool.edu.cn" target="_blank" rel="noopener noreferrer">
                subit@i.pkuschool.edu.cn</a></p>
        </Card>
    </div>
</template>

<style scoped lang="scss">
.main {
    position: absolute;
    top: 45%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 450px;
}

.back {
    display: flex;
}

.card {
    height: fit-content;
    padding: 10px 30px;
}

h1 {
    font-size: 2em;
    margin-bottom: 20px;
}
</style>