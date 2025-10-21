<template>
  <div class="file-toolbar">
    <div class="toolbar-left">
      <a-button type="primary" size="large" @click="$emit('upload')">
        <template #icon>
          <icon-upload />
        </template>
        上传
      </a-button>
      <a-button size="large" @click="$emit('createFolder')">
        <template #icon>
          <icon-folder-add />
        </template>
        新建文件夹
      </a-button>
    </div>

    <div class="toolbar-right">
      <a-input-search
        :model-value="searchKeyword"
        placeholder="搜索文件"
        size="large"
        style="width: 320px"
        allow-clear
        @update:model-value="$emit('update:searchKeyword', $event)"
        @search="$emit('search')"
      />
      <a-button-group size="large">
        <a-button @click="$emit('update:viewMode', 'list')">
          <icon-list :style="{ color: viewMode === 'list' ? '#165dff' : '' }" />
        </a-button>
        <a-button @click="$emit('update:viewMode', 'grid')">
          <icon-apps :style="{ color: viewMode === 'grid' ? '#165dff' : '' }" />
        </a-button>
      </a-button-group>
      <a-button size="large" @click="$emit('refresh')">
        <icon-refresh />
      </a-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import {
    IconUpload,
    IconFolderAdd,
    IconRefresh,
    IconApps,
    IconList,
  } from '@arco-design/web-vue/es/icon';

  interface Props {
    searchKeyword: string;
    viewMode: 'list' | 'grid';
  }

  defineProps<Props>();

  defineEmits<{
    (e: 'upload'): void;
    (e: 'createFolder'): void;
    (e: 'search'): void;
    (e: 'refresh'): void;
    (e: 'update:searchKeyword', value: string): void;
    (e: 'update:viewMode', value: 'list' | 'grid'): void;
  }>();
</script>

<style lang="less" scoped>
  .file-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid var(--color-border-2);
    background-color: var(--color-bg-2);
  }

  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
</style>
