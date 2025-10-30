<template>
  <div class="file-toolbar">
    <!-- 批量操作工具栏 -->
    <div v-if="(selectedCount ?? 0) > 0" class="batch-toolbar">
      <div class="batch-info">
        <a-button size="large" @click="$emit('batchDownload')">
          <template #icon>
            <icon-download />
          </template>
          下载
        </a-button>
        <a-button size="large" @click="$emit('batchShare')">
          <template #icon>
            <icon-share-alt />
          </template>
          分享
        </a-button>
        <a-button size="large" @click="$emit('batchFavorite')">
          <template #icon>
            <icon-star :fill="hasUnfavorited ? undefined : 'currentColor'" />
          </template>
          {{ favoriteButtonText }}
        </a-button>
        <a-button size="large" @click="$emit('batchMove')">
          <template #icon>
            <icon-drag-arrow />
          </template>
          移动
        </a-button>
        <a-button size="large" status="danger" @click="$emit('batchDelete')">
          <template #icon>
            <icon-delete />
          </template>
          放入回收站
        </a-button>
      </div>
    </div>

    <!-- 普通工具栏 -->
    <template v-else>
      <div class="toolbar-left">
        <a-input-search
          :model-value="searchKeyword"
          placeholder="搜索文件"
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
        <a-button
          v-if="!hideActions"
          size="large"
          @click="$emit('createFolder')"
        >
          <template #icon>
            <icon-folder-add />
          </template>
          新建文件夹
        </a-button>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
  import {
    IconUpload,
    IconFolderAdd,
    IconDelete,
    IconDownload,
    IconShareAlt,
    IconStar,
    IconDragArrow,
  } from '@arco-design/web-vue/es/icon';

  import type { FileItem } from '@/types/modules/file';
  import { computed } from 'vue';

  interface Props {
    searchKeyword: string;
    hideActions?: boolean;
    selectedCount?: number;
    selectedFiles?: FileItem[];
  }

  const props = defineProps<Props>();

  defineEmits<{
    (e: 'upload'): void;
    (e: 'createFolder'): void;
    (e: 'search'): void;
    (e: 'update:searchKeyword', value: string): void;
    (e: 'batchDelete'): void;
    (e: 'batchDownload'): void;
    (e: 'batchShare'): void;
    (e: 'batchFavorite'): void;
    (e: 'batchMove'): void;
  }>();

  // 计算是否有未收藏的文件
  const hasUnfavorited = computed(() => {
    if (!props.selectedFiles || props.selectedFiles.length === 0) {
      return true; // 默认显示收藏
    }
    return props.selectedFiles.some((file) => !file.isFavorite);
  });

  // 收藏按钮文本
  const favoriteButtonText = computed(() => {
    return hasUnfavorited.value ? '收藏' : '取消收藏';
  });
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

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .batch-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;

    .batch-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }
</style>
