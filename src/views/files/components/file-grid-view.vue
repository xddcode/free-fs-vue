<template>
  <div class="file-grid-view-container">
    <div class="file-grid-header">
      <div class="header-left">
        <a-checkbox
          :model-value="isAllSelected"
          :indeterminate="isIndeterminate"
          @change="handleSelectAll"
        >
          <span class="file-count-text">
            {{
              selectedKeys && selectedKeys.length > 0
                ? `已选 ${selectedKeys.length} 个文件`
                : `共 ${fileList.length} 个文件`
            }}
          </span>
        </a-checkbox>
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
        :class="{ 'is-folder': file.isDir, 'is-selected': isSelected(file.id) }"
        @click="handleItemClick(file, $event)"
        @dblclick="handleFileDoubleClick(file)"
      >
        <div class="grid-item-checkbox">
          <a-checkbox
            :model-value="isSelected(file.id)"
            @click.stop
            @change="handleCheckboxChange(file.id, $event)"
          />
        </div>
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
        <div v-if="!isSelected(file.id)" class="grid-item-actions">
          <a-dropdown trigger="click" position="bl" :popup-max-height="false">
            <a-button size="small" type="text" @click.stop>
              <icon-more :size="18" />
            </a-button>
            <template #content>
              <a-doption v-if="!file.isDir" @click="$emit('preview', file)">
                <icon-eye />
                预览
              </a-doption>
              <a-doption @click="$emit('share', file)">
                <icon-share-alt />
                分享
              </a-doption>
              <a-doption @click="$emit('favorite', file)">
                <icon-star-fill v-if="file.isFavorite" />
                <icon-star v-else />
                {{ file.isFavorite ? '取消收藏' : '收藏' }}
              </a-doption>
              <a-doption @click="$emit('download', file)">
                <icon-download />
                下载
              </a-doption>
              <a-divider style="margin: 4px 0" />
              <a-doption @click="$emit('rename', file)">
                <icon-edit />
                重命名
              </a-doption>
              <a-doption @click="$emit('move', file)">
                <icon-drag-arrow />
                移动到
              </a-doption>
              <a-divider style="margin: 4px 0" />
              <a-doption @click="$emit('delete', file)">
                <icon-delete />
                放入回收站
              </a-doption>
            </template>
          </a-dropdown>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import {
    IconDownload,
    IconDelete,
    IconMore,
    IconShareAlt,
    IconEdit,
    IconDragArrow,
    IconStar,
    IconStarFill,
    IconRefresh,
    IconApps,
    IconList,
    IconEye,
  } from '@arco-design/web-vue/es/icon';
  import type { FileItem } from '@/types/modules/file';
  import { getFileIconPath } from '@/utils/file-icon';
  import { formatFileTime, formatFileSize } from '../hooks/use-file-format';
  import FileTooltip from './file-tooltip.vue';

  interface Props {
    fileList: FileItem[];
    selectedKeys?: string[];
    viewMode?: 'list' | 'grid';
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    (e: 'fileClick', file: FileItem): void;
    (e: 'download', file: FileItem): void;
    (e: 'share', file: FileItem): void;
    (e: 'delete', file: FileItem): void;
    (e: 'rename', file: FileItem): void;
    (e: 'move', file: FileItem): void;
    (e: 'favorite', file: FileItem): void;
    (e: 'update:selectedKeys', keys: string[]): void;
    (e: 'update:viewMode', value: 'list' | 'grid'): void;
    (e: 'refresh'): void;
    (e: 'preview', file: FileItem): void;
  }>();

  const isSelected = (fileId: string) => {
    return props.selectedKeys?.includes(fileId) || false;
  };

  const handleCheckboxChange = (fileId: string, checked: boolean) => {
    const newSelectedKeys = [...(props.selectedKeys || [])];
    if (checked) {
      if (!newSelectedKeys.includes(fileId)) {
        newSelectedKeys.push(fileId);
      }
    } else {
      const index = newSelectedKeys.indexOf(fileId);
      if (index > -1) {
        newSelectedKeys.splice(index, 1);
      }
    }
    emit('update:selectedKeys', newSelectedKeys);
  };

  const handleItemClick = (file: FileItem, event: MouseEvent) => {
    // 忽略点击复选框或操作按钮
    const target = event.target as HTMLElement;
    if (
      target.closest('.grid-item-checkbox') ||
      target.closest('.grid-item-actions')
    ) {
      return;
    }
    // 单击切换选中状态
    handleCheckboxChange(file.id, !isSelected(file.id));
  };

  const handleFileDoubleClick = (file: FileItem) => {
    if (file.isDir) {
      emit('fileClick', file);
    }
  };

  // 全选相关逻辑
  const isAllSelected = computed(() => {
    if (!props.fileList.length) return false;
    return (
      props.selectedKeys?.length === props.fileList.length &&
      props.fileList.every((file) => props.selectedKeys?.includes(file.id))
    );
  });

  const isIndeterminate = computed(() => {
    const selectedCount = props.selectedKeys?.length || 0;
    return selectedCount > 0 && selectedCount < props.fileList.length;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // 全选
      const allKeys = props.fileList.map((file) => file.id);
      emit('update:selectedKeys', allKeys);
    } else {
      // 取消全选
      emit('update:selectedKeys', []);
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

      :deep(.arco-checkbox) {
        display: flex;
        align-items: center;
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
      cursor: pointer;

      &.is-folder {
        cursor: pointer;
      }

      &.is-selected {
        background-color: var(--color-primary-light-1);

        .grid-item-checkbox {
          opacity: 1;
        }
      }

      &:hover {
        background-color: var(--color-fill-2);

        .grid-item-actions {
          opacity: 1;
        }

        .grid-item-checkbox {
          opacity: 1;
        }
      }
    }

    .grid-item-checkbox {
      position: absolute;
      top: 12px;
      left: 12px;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 2;

      :deep(.arco-checkbox) {
        background: transparent;
        padding: 2px;
        border-radius: 4px;
      }

      :deep(.arco-checkbox-icon) {
        border-radius: 4px;
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
      top: 8px;
      right: 8px;
      opacity: 0;
      transition: opacity 0.2s;

      :deep(.arco-btn) {
        width: 32px;
        height: 32px;
        padding: 6px;
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
          font-size: 18px;
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
