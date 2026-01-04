<template>
  <div class="file-toolbar">
    <div class="toolbar-left">
      <a-input-search
        :model-value="searchKeyword"
        :placeholder="placeholder || '搜索文件'"
        size="large"
        style="width: 320px"
        allow-clear
        @update:model-value="$emit('update:searchKeyword', $event)"
        @search="$emit('search')"
      />
      <a-button
        v-if="!hideActions"
        type="primary"
        size="large"
        @click="$emit('upload')"
      >
        <template #icon>
          <icon-upload />
        </template>
        上传
      </a-button>
      <a-button v-if="!hideActions" size="large" @click="$emit('createFolder')">
        <template #icon>
          <icon-folder-add />
        </template>
        新建文件夹
      </a-button>
    </div>
    <div class="toolbar-right">
      <slot name="extra"></slot>
      <a-tooltip content="刷新">
        <a-button size="large" @click="$emit('refresh')">
          <template #icon>
            <icon-refresh />
          </template>
        </a-button>
      </a-tooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import {
    IconUpload,
    IconFolderAdd,
    IconRefresh,
  } from '@arco-design/web-vue/es/icon';

  import type { FileItem } from '@/types/modules/file';

  interface Props {
    searchKeyword: string;
    placeholder?: string;
    hideActions?: boolean;
    selectedCount?: number;
    selectedFiles?: FileItem[];
  }

  defineProps<Props>();

  defineEmits<{
    (e: 'upload'): void;
    (e: 'createFolder'): void;
    (e: 'search'): void;
    (e: 'refresh'): void;
    (e: 'update:searchKeyword', value: string): void;
  }>();
</script>

<style lang="less" scoped>
  .file-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid var(--color-border-2);
    background-color: transparent; // 改为透明，适配悬浮卡片
  }

  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
</style>
