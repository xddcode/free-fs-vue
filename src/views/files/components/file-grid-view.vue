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
        :class="{
          'is-folder': file.isDir,
          'is-selected': isSelected(file.id),
          'is-dragging': draggingItemIds.includes(file.id),
        }"
        draggable="true"
        @click="handleItemClick(file, $event)"
        @dblclick="handleFileDoubleClick(file)"
        @dragstart="handleDragStart(file, $event)"
        @dragover="handleDragOver(file, $event)"
        @dragleave="handleDragLeave($event)"
        @drop="handleDrop(file, $event)"
        @dragend="handleDragEnd($event)"
      >
        <div class="grid-item-checkbox">
          <a-checkbox
            :model-value="isSelected(file.id)"
            @click.stop
            @change="(value, ev) => handleCheckboxChange(file.id, value)"
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
              <a-doption
                v-if="!file.isDir && hasHandler('preview')"
                @click="$emit('preview', file)"
              >
                <icon-eye />
                预览
              </a-doption>
              <a-doption
                v-if="hasHandler('share')"
                @click="$emit('share', file)"
              >
                <icon-share-alt />
                分享
              </a-doption>
              <a-doption
                v-if="hasHandler('favorite')"
                @click="$emit('favorite', file)"
              >
                <icon-star-fill v-if="file.isFavorite" />
                <icon-star v-else />
                {{ file.isFavorite ? '取消收藏' : '收藏' }}
              </a-doption>
              <a-doption
                v-if="hasHandler('download')"
                @click="$emit('download', file)"
              >
                <icon-download />
                下载
              </a-doption>
              <a-divider style="margin: 4px 0" />
              <a-doption
                v-if="hasHandler('rename')"
                @click="$emit('rename', file)"
              >
                <icon-edit />
                重命名
              </a-doption>
              <a-doption v-if="hasHandler('move')" @click="$emit('move', file)">
                <icon-drag-arrow />
                移动到
              </a-doption>
              <a-divider style="margin: 4px 0" />
              <a-doption
                v-if="hasHandler('delete')"
                @click="$emit('delete', file)"
              >
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
  import { computed, getCurrentInstance, ref } from 'vue';
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

  const proxy = getCurrentInstance();

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
    // 拖拽事件
    (e: 'moveItems', itemIds: string[], targetDirId: string): void;
  }>();

  const isSelected = (fileId: string) => {
    return props.selectedKeys?.includes(fileId) || false;
  };

  const handleCheckboxChange = (
    fileId: string,
    value: boolean | (string | number | boolean)[]
  ) => {
    const checked = typeof value === 'boolean' ? value : value.length > 0;
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

  const handleSelectAll = (
    value: boolean | (string | number | boolean)[],
    ev?: Event
  ) => {
    const checked = typeof value === 'boolean' ? value : value.length > 0;
    if (checked) {
      // 全选
      const allKeys = props.fileList.map((file) => file.id);
      emit('update:selectedKeys', allKeys);
    } else {
      // 取消全选
      emit('update:selectedKeys', []);
    }
  };

  /** 拖拽部分 */
  const draggingItemIds = ref<string[]>([]);
  const handleDragStart = (file: FileItem, event: DragEvent) => {
    const isDraggingSelected = props.selectedKeys?.includes(file.id) || false;

    if (
      isDraggingSelected &&
      props.selectedKeys &&
      props.selectedKeys.length > 0
    ) {
      draggingItemIds.value = [...props.selectedKeys];
    } else {
      // 否则，只移动当前这一项
      draggingItemIds.value = [file.id];
    }

    // 设置拖拽数据
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData(
        'application/x-file-ids',
        JSON.stringify(draggingItemIds.value)
      );
    }
  };

  /**
   * 当拖拽物在一个合法的释放目标上移动时
   */
  const handleDragOver = (file: FileItem, event: DragEvent) => {
    event.preventDefault(); // 允许释放

    // 必须是文件夹
    if (!file.isDir) return;
    // 不能拖到自己身上，也不能拖到“被拖拽的文件夹”之一上
    if (draggingItemIds.value.includes(file.id)) return;

    // 添加“即将释放”的视觉提示
    (event.currentTarget as HTMLElement).classList.add('is-drop-target');
  };

  /**
   * 当拖拽物离开一个释放目标时
   */
  const handleDragLeave = (event: DragEvent) => {
    // 移除视觉提示
    (event.currentTarget as HTMLElement).classList.remove('is-drop-target');
  };

  /**
   * 当在释放目标上释放时
   */
  const handleDrop = (file: FileItem, event: DragEvent) => {
    event.preventDefault();
    const targetEl = event.currentTarget as HTMLElement;
    targetEl.classList.remove('is-drop-target');

    // 再次校验
    if (!file.isDir) return;
    if (draggingItemIds.value.includes(file.id)) return;
    if (draggingItemIds.value.length === 0) return; // 没有任何拖拽项

    // 'moveItems' 事件
    emit('moveItems', draggingItemIds.value, file.id);
    // 清理
    draggingItemIds.value = [];
  };

  /**
   * 当拖拽操作结束时
   */
  const handleDragEnd = (event: DragEvent) => {
    document.querySelectorAll('.is-drop-target').forEach((el) => {
      el.classList.remove('is-drop-target');
    });
    // 清理拖拽状态
    draggingItemIds.value = [];
  };

  /**
   * 校验是否包含处理函数
   * @param eventName
   */
  const hasHandler = (eventName: string) => {
    const prop = proxy?.vnode?.props;
    if (!prop) return false;
    const handlerKey = `on${
      eventName.charAt(0).toUpperCase() + eventName.slice(1)
    }`;
    return (
      Object.prototype.hasOwnProperty.call(prop, handlerKey) || prop[handlerKey]
    );
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

      // 正在被拖拽的元素样式
      &.is-dragging {
        opacity: 0.5;
        scale: (0.95);
      }

      // 作为释放目标的元素样式 (当拖拽物悬停时)
      &.is-drop-target {
        background-color: var(--color-primary-light-1);
        box-shadow: 0 0 0 2px var(--color-primary-light-4) inset;
      }
    }

    .grid-item-checkbox {
      position: absolute;
      top: 6px;
      left: 6px;
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
