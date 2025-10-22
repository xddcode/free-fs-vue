<template>
  <div class="file-grid-view">
    <div
      v-for="file in fileList"
      :key="file.id"
      class="grid-item"
      :class="{ 'is-folder': file.isDir }"
      @dblclick="handleFileDoubleClick(file)"
    >
      <div class="grid-item-icon">
        <img
          :src="getFileIconPath(file.isDir ? 'dir' : file.suffix || '')"
          :alt="file.displayName"
          class="file-icon-img"
        />
      </div>
      <file-tooltip position="bottom">
        <div class="grid-item-name">
          {{ file.displayName }}
        </div>
        <template #content>
          <div class="file-tooltip">
            <div class="tooltip-item">
              <span class="tooltip-label">名称：</span>
              <span class="tooltip-value">{{ file.displayName }}</span>
            </div>
            <div class="tooltip-item">
              <span class="tooltip-label">大小：</span>
              <span class="tooltip-value">{{
                formatFileSize(file.size) || '-'
              }}</span>
            </div>
            <div class="tooltip-item">
              <span class="tooltip-label">修改日期：</span>
              <span class="tooltip-value">{{
                formatFileTime(file.updateTime)
              }}</span>
            </div>
          </div>
        </template>
      </file-tooltip>
      <file-tooltip position="bottom">
        <div class="grid-item-info">
          {{ formatFileTime(file.updateTime) }}
        </div>
        <template #content>
          <div class="file-tooltip">
            <div class="tooltip-item">
              <span class="tooltip-label">名称：</span>
              <span class="tooltip-value">{{ file.displayName }}</span>
            </div>
            <div class="tooltip-item">
              <span class="tooltip-label">大小：</span>
              <span class="tooltip-value">{{
                formatFileSize(file.size) || '-'
              }}</span>
            </div>
            <div class="tooltip-item">
              <span class="tooltip-label">修改日期：</span>
              <span class="tooltip-value">{{
                formatFileTime(file.updateTime)
              }}</span>
            </div>
          </div>
        </template>
      </file-tooltip>
      <div class="grid-item-actions">
        <a-button
          v-if="!file.isDir"
          size="mini"
          type="text"
          @click.stop="$emit('download', file)"
        >
          <icon-download />
        </a-button>
        <a-button size="mini" type="text" @click.stop="$emit('share', file)">
          <icon-share-alt />
        </a-button>
        <a-dropdown trigger="hover">
          <a-button size="mini" type="text" @click.stop>
            <icon-more />
          </a-button>
          <template #content>
            <a-doption @click="$emit('rename', file)">
              <icon-edit />
              重命名
            </a-doption>
            <a-doption @click="$emit('move', file)">
              <icon-drag-arrow />
              移动到
            </a-doption>
            <a-doption @click="$emit('delete', file)">
              <icon-delete />
              删除
            </a-doption>
          </template>
        </a-dropdown>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import {
    IconDownload,
    IconDelete,
    IconMore,
    IconShareAlt,
    IconEdit,
    IconDragArrow,
  } from '@arco-design/web-vue/es/icon';
  import type { FileItem } from '@/types/modules/file';
  import { getFileIconPath } from '@/utils/file-icon';
  import { formatFileTime, formatFileSize } from '../hooks/use-file-format';
  import FileTooltip from './file-tooltip.vue';

  interface Props {
    fileList: FileItem[];
  }

  defineProps<Props>();

  const emit = defineEmits<{
    (e: 'fileClick', file: FileItem): void;
    (e: 'download', file: FileItem): void;
    (e: 'share', file: FileItem): void;
    (e: 'delete', file: FileItem): void;
    (e: 'rename', file: FileItem): void;
    (e: 'move', file: FileItem): void;
  }>();

  const handleFileDoubleClick = (file: FileItem) => {
    if (file.isDir) {
      emit('fileClick', file);
    }
  };
</script>

<style lang="less" scoped>
  .file-grid-view {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
    padding: 8px;

    .grid-item {
      background: transparent;
      border-radius: 8px;
      padding: 16px 12px;
      text-align: center;
      transition: all 0.2s;
      position: relative;
      min-height: 160px;

      &.is-folder {
        cursor: pointer;
      }

      &:hover {
        background-color: var(--color-fill-2);

        .grid-item-actions {
          opacity: 1;
        }
      }
    }

    .grid-item-icon {
      margin-bottom: 12px;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 90px;
      padding-top: 8px;

      .file-icon-img {
        width: 72px;
        height: 72px;
        object-fit: contain;
      }
    }

    .grid-item-name {
      font-size: 13px;
      font-weight: 400;
      color: var(--color-text-2);
      margin-bottom: 6px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 0 4px;
      line-height: 1.4;
    }

    .grid-item-info {
      font-size: 12px;
      color: var(--color-text-3);
    }

    .grid-item-actions {
      position: absolute;
      top: 4px;
      right: 4px;
      display: flex;
      gap: 2px;
      opacity: 0;
      transition: opacity 0.2s;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 6px;
      padding: 4px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(0, 0, 0, 0.06);
    }
  }

  // Tooltip 样式
  .file-tooltip {
    padding: 2px 0;

    .tooltip-item {
      display: flex;
      align-items: flex-start;
      padding: 5px 0;
      font-size: 13px;
      line-height: 1.5;

      .tooltip-label {
        color: #86909c;
        min-width: 70px;
        flex-shrink: 0;
        font-weight: 400;
      }

      .tooltip-value {
        color: #1d2129;
        word-break: break-all;
        font-weight: 400;
      }
    }
  }
</style>
