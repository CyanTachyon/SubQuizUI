<script setup lang="ts">

</script>

<template>
  <quiz-frosted-glass>
    <slot></slot>
  </quiz-frosted-glass>
</template>

<style scoped lang="scss">
quiz-frosted-glass {
  width: 400px;
  padding: 20px;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px) saturate(180%);
  -webkit-backdrop-filter: blur(10px) saturate(180%);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  color: white;
  text-align: center;
  position: relative;
  isolation: isolate;
}

quiz-frosted-glass::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: inherit;
  border-radius: inherit;
  z-index: -1;
  filter: blur(20px);
}
</style>