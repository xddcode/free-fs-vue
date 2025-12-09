<template>
  <div v-if="loading" class="loading-spinner-container" :class="containerClass">
    <div class="loading-content">
      <Vue3Lottie
        :animation-data="animationData"
        :height="size"
        :width="size"
        :loop="true"
        :auto-play="true"
      />
      <div v-if="tip" class="loading-tip">{{ tip }}</div>
    </div>
  </div>
  <slot v-else></slot>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import { Vue3Lottie } from 'vue3-lottie';
  import loadingJson from '@/assets/loading/data_loading.json';

  interface Props {
    loading: boolean;
    size?: number;
    tip?: string;
    inline?: boolean;
    fullHeight?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
    size: 120,
    tip: '',
    inline: false,
    fullHeight: false,
  });

  const animationData = loadingJson as unknown as Record<string, unknown>;

  const containerClass = computed(() => ({
    'inline-mode': props.inline,
    'full-height': props.fullHeight,
  }));
</script>

<style scoped lang="less">
  .loading-spinner-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 200px;
    padding: 40px 20px;

    &.full-height {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      min-height: 100%;
      padding: 0;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(4px);
      z-index: 10;
    }

    &.inline-mode {
      display: inline-flex;
      width: auto;
      min-height: auto;
      padding: 0;
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;

      .loading-tip {
        font-size: 14px;
        color: var(--color-text-3);
        margin-top: 8px;
      }
    }
  }

  [arco-theme='dark'] .loading-spinner-container.full-height {
    background: rgba(23, 23, 26, 0.7);
  }
</style>
