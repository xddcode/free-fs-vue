<script lang="ts" setup>
  import { useAppStore } from '@/store';
  import { computed, ref, watch } from 'vue';

  const appStore = useAppStore();

  interface Props {
    url: string; // 文件 URL
  }
  const props = defineProps<Props>();

  const isLoading = ref(true);

  /** 避免皮肤命名不一致 */
  const theme = computed(() => {
    return appStore.theme === 'dark' ? 'dark' : 'light';
  });

  const handleLoad = () => {
    isLoading.value = false;
  };

  watch(
    () => props.url,
    (newUrl) => {
      if (newUrl) {
        isLoading.value = true;
      }
    },
    {
      immediate: true, // 立即执行一次, 保证组件初始加载时 isLoading = true
    }
  );
</script>

<template>
  <div class="pdf-viewer-container">
    <div v-if="isLoading" class="loading-overlay">
      <a-spin :size="32" tip="PDF 正在加载中..." />
    </div>

    <iframe
      v-show="!isLoading"
      :src="props.url"
      width="100%"
      height="100%"
      @load="handleLoad"
    ></iframe>
  </div>
</template>

<style scoped lang="less">
  .pdf-viewer-container {
    width: 100%;
    height: 100%;

    position: relative;
    overflow: hidden;
  }

  .loading-overlay {
    // 遮罩层样式
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    // 使用 Arco 的背景色, 确保和你的明/暗主题一致
    background-color: var(--color-bg-2);
    z-index: 10;
  }

  iframe {
    border: none; // 移除默认的边框
  }
</style>
