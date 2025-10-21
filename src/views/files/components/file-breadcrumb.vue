<template>
  <div class="file-breadcrumb">
    <a-breadcrumb>
      <a-breadcrumb-item>
        <icon-folder />
        全部文件
      </a-breadcrumb-item>
      <!-- TODO: 支持多级路径导航 -->
    </a-breadcrumb>
    <div class="breadcrumb-info">
      共 {{ total }} 个文件
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { IconFolder } from '@arco-design/web-vue/es/icon';

  interface Props {
    total: number;
  }

  defineProps<Props>();
</script>

<style lang="less" scoped>
  .file-breadcrumb {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 24px;
    border-bottom: 1px solid var(--color-border-2);
    background-color: var(--color-bg-2);

    .breadcrumb-info {
      font-size: 14px;
      color: var(--color-text-3);
    }
  }
</style>

