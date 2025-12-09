<template>
  <Transition name="fade">
    <div v-if="appStore.loading" class="global-loading-container">
      <div class="loading-content">
        <Vue3Lottie
          :animation-data="animationData"
          :height="200"
          :width="200"
          :loop="true"
          :auto-play="true"
        />
      </div>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
  import { Vue3Lottie } from 'vue3-lottie';
  import { useAppStore } from '@/store';
  import loadingJson from '@/assets/loading/loading.json';

  const appStore = useAppStore();
  const animationData = loadingJson as unknown as Record<string, unknown>;
</script>

<style scoped lang="less">
  .global-loading-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.9);
    z-index: 9999;
    backdrop-filter: blur(8px);

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
  }

  [arco-theme='dark'] .global-loading-container {
    background: rgba(23, 23, 26, 0.9);
  }

  .fade-enter-active {
    transition: opacity 0.15s ease-out;
  }

  .fade-leave-active {
    transition: opacity 0.2s ease-in;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .fade-enter-to,
  .fade-leave-from {
    opacity: 1;
  }
</style>
