<template>
  <div class="file-grid-view-container">
    <div class="file-grid-header">
      <div class="header-left">
        <span class="file-count-text">共 {{ fileList.length }} 个文件</span>
      </div>
      <div class="header-right">
        <a-button-group size="large">
          <a-button @click="$emit('update:viewMode', 'list')">
            <icon-list
              :style="{ color: viewMode === 'list' ? '#165dff' : '' }"
            />
          </a-button>
          <a-button @click="$emit('update:viewMode', 'grid')">
            <icon-apps
              :style="{ color: viewMode === 'grid' ? '#165dff' : '' }"
            />
          </a-button>
        </a-button-group>
        <a-button size="large" @click="$emit('refresh')">
          <icon-refresh />
        </a-button>
      </div>
    </div>
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
          <a-dropdown trigger="click" position="bl" :popup-max-height="false">
            <a-button size="small" type="text" @click.stop>
              <icon-more :size="18" />
            </a-button>
            <template #content>
              <a-doption v-if="!file.isDir" @click="$emit('preview', file)">
                <icon-eye />
                预览
              </a-doption>
            </template>
          </a-dropdown>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import {
    IconMore,
    IconRefresh,
    IconApps,
    IconList,
    IconEye,
  } from '@arco-design/web-vue/es/icon';
  import type { FileItem } from '@/types/modules/file';
  import { getFileIconPath } from '@/utils/file-icon';
  import {
    formatFileTime,
    formatFileSize,
  } from '@/views/files/hooks/use-file-format';
  import FileTooltip from '@/views/files/components/file-tooltip.vue';

  interface Props {
    fileList: FileItem[];
    viewMode?: 'list' | 'grid';
  }

  defineProps<Props>();

  const emit = defineEmits<{
    (e: 'fileClick', file: FileItem): void;
    (e: 'download', file: FileItem): void;
    (e: 'update:viewMode', value: 'list' | 'grid'): void;
    (e: 'refresh'): void;
    (e: 'preview', file: FileItem): void;
  }>();

  const handleFileDoubleClick = (file: FileItem) => {
    if (file.isDir) {
      emit('fileClick', file);
    }
  };
</script>

<style lang="less" scoped>
  .file-grid-view-container {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .file-grid-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 5px;
    background-color: var(--color-bg-1);

    .header-left {
      display: flex;
      align-items: center;

      .file-count-text {
        font-size: 14px;
        color: var(--color-text-2);
        margin-left: 8px;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  .file-grid-view {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 16px;
    padding: 16px;

    .grid-item {
      background: transparent;
      border-radius: 8px;
      padding: 12px 8px;
      text-align: center;
      transition: all 0.2s;
      position: relative;
      cursor: default;

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
      height: 64px;
      padding-top: 4px;

      .file-icon-img {
        width: 56px;
        height: 56px;
        object-fit: contain;
        transition: transform 0.2s;
      }
    }

    .grid-item:hover .file-icon-img {
      transform: scale(1.05);
    }

    .grid-item-name {
      font-size: 12px;
      font-weight: 400;
      color: var(--color-text-1);
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 0 4px;
      line-height: 1.4;
    }

    .grid-item-info {
      font-size: 12px;
      font-weight: normal;
      color: var(--color-text-4);
      transform: scale(0.9);
    }

    .grid-item-actions {
      position: absolute;
      top: 6px;
      right: 6px;
      opacity: 0;
      transition: opacity 0.2s;

      :deep(.arco-btn) {
        width: 24px;
        height: 24px;
        padding: 4px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

        &:hover {
          background: rgba(255, 255, 255, 1);
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
          transform: scale(1.05);
        }

        .arco-icon {
          font-size: 14px;
        }
      }
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
