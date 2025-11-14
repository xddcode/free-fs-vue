<template>
  <div class="file-list-view-container">
    <div class="file-list-header">
      <div class="header-left">
        <span class="file-count-text">
          {{
            selectedKeys && selectedKeys.length > 0
              ? `已选 ${selectedKeys.length} 个文件`
              : `共 ${fileList.length} 个文件`
          }}
        </span>
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
    <div class="file-list-view">
      <a-table
        v-model:selected-keys="selectedKeysModel"
        :data="fileList"
        :pagination="false"
        :bordered="false"
        row-key="id"
        :row-class="() => 'file-row'"
        :row-selection="{
          type: 'checkbox',
          showCheckedAll: true,
        }"
        @change="handleTableChange"
      >
        <template #tr="slotProps">
          <tr
            v-bind="slotProps.props"
            :class="[
              'file-row',
              {
                'is-dragging-row': draggingItemIds.includes(
                  slotProps.record.id
                ),
              },
            ]"
            draggable="true"
            @dragstart="handleDragStart(slotProps.record, $event)"
            @dragover="handleDragOver(slotProps.record, $event)"
            @dragleave="handleDragLeave($event)"
            @drop="handleDrop(slotProps.record, $event)"
            @dragend="handleDragEnd($event)"
          >
            <component
              :is="s"
              v-for="(s, index) in slotProps.slots"
              :key="index"
            />
          </tr>
        </template>
        <template #columns>
          <a-table-column title="文件名" data-index="displayName" :width="400">
            <template #cell="{ record }">
              <div
                class="file-name-cell"
                :class="{ 'is-folder': record.isDir }"
                @dblclick="handleDoubleClick(record)"
              >
                <div class="file-icon-wrapper">
                  <img
                    :src="
                      getFileIconPath(
                        record.isDir ? 'dir' : record.suffix || ''
                      )
                    "
                    :alt="record.displayName"
                    class="file-icon-img"
                  />
                </div>
                <span class="file-name">{{ record.displayName }}</span>
              </div>
            </template>
          </a-table-column>

          <a-table-column title="大小" data-index="size" :width="120">
            <template #cell="{ record }">
              <span class="file-size">{{ formatFileSize(record.size) }}</span>
            </template>
          </a-table-column>

          <a-table-column
            title="修改时间"
            data-index="updateTime"
            :width="180"
            :sortable="{
              sortDirections: ['ascend', 'descend'],
            }"
          >
            <template #cell="{ record }">
              <span class="file-time">{{
                formatFileTime(record.updateTime)
              }}</span>
            </template>
          </a-table-column>

          <a-table-column title="操作" :width="200" align="center">
            <template #cell="{ record }">
              <div v-if="!isRowSelected(record.id)" class="file-actions">
                <a-button
                  v-if="!record.isDir"
                  size="small"
                  type="text"
                  @click.stop="$emit('preview', record)"
                >
                  <icon-eye />
                </a-button>
                <a-button
                  v-if="!record.isDir"
                  size="small"
                  type="text"
                  @click.stop="$emit('download', record)"
                >
                  <icon-download />
                </a-button>
                <a-button
                  size="small"
                  type="text"
                  @click.stop="$emit('share', record)"
                >
                  <icon-share-alt />
                </a-button>
                <a-button
                  size="small"
                  type="text"
                  :class="{ 'is-favorite': record.isFavorite }"
                  @click.stop="$emit('favorite', record)"
                >
                  <icon-star-fill v-if="record.isFavorite" />
                  <icon-star v-else />
                </a-button>
                <a-button
                  size="small"
                  type="text"
                  status="danger"
                  @click.stop="$emit('delete', record)"
                >
                  <icon-delete />
                </a-button>
                <a-dropdown trigger="hover">
                  <a-button size="small" type="text" @click.stop>
                    <icon-more />
                  </a-button>
                  <template #content>
                    <a-doption @click="$emit('rename', record)">
                      <icon-edit />
                      重命名
                    </a-doption>
                    <a-doption @click="$emit('move', record)">
                      <icon-drag-arrow />
                      移动到
                    </a-doption>
                  </template>
                </a-dropdown>
              </div>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue';
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
  } from '@arco-design/web-vue/es/icon';
  import type { FileItem } from '@/types/modules/file';
  import { getFileIconPath } from '@/utils/file-icon';
  import { formatFileSize, formatFileTime } from '../hooks/use-file-format';

  interface Props {
    fileList: FileItem[];
    selectedKeys?: string[];
    viewMode?: 'list' | 'grid';
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    (e: 'rowClick', record: FileItem): void;
    (
      e: 'sortChange',
      field: string,
      direction: 'ascend' | 'descend' | ''
    ): void;
    (e: 'download', record: FileItem): void;
    (e: 'share', record: FileItem): void;
    (e: 'delete', record: FileItem): void;
    (e: 'rename', record: FileItem): void;
    (e: 'move', record: FileItem): void;
    (e: 'favorite', record: FileItem): void;
    (e: 'update:selectedKeys', keys: string[]): void;
    (e: 'update:viewMode', value: 'list' | 'grid'): void;
    (e: 'refresh'): void;
    (e: 'preview', file: FileItem): void;
    // 拖拽事件
    (e: 'moveItems', itemIds: string[], targetDirId: string): void;
  }>();

  // 双向绑定选中的 keys
  const selectedKeysModel = computed({
    get: () => props.selectedKeys || [],
    set: (value) => emit('update:selectedKeys', value),
  });

  // 检查行是否被选中
  const isRowSelected = (rowId: string) => {
    return selectedKeysModel.value.includes(rowId);
  };

  const handleDoubleClick = (record: FileItem) => {
    if (record.isDir) {
      emit('rowClick', record);
    }
  };

  const handleTableChange = (_data: any, extra: any) => {
    if (extra.type === 'sorter' && extra.sorter) {
      const { field, direction } = extra.sorter;
      emit('sortChange', field, direction);
    }
  };

  // 拖拽相关
  const draggingItemIds = ref<string[]>([]);
  /**
   * 拖拽开始
   */
  const handleDragStart = (file: FileItem, event: DragEvent) => {
    const isDraggingSelected = props.selectedKeys?.includes(file.id) || false;

    if (
      isDraggingSelected &&
      props.selectedKeys &&
      props.selectedKeys.length > 0
    ) {
      draggingItemIds.value = [...props.selectedKeys];
    } else {
      draggingItemIds.value = [file.id];
    }

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData(
        'application/x-file-ids',
        JSON.stringify(draggingItemIds.value)
      );
    }
  };

  /**
   * 拖拽物在目标上
   */
  const handleDragOver = (file: FileItem, event: DragEvent) => {
    event.preventDefault(); // 允许释放

    if (!file.isDir) return;
    if (draggingItemIds.value.includes(file.id)) return;

    // 添加“即将释放”的视觉提示
    (event.currentTarget as HTMLElement).classList.add('is-drop-target-row');
  };

  /**
   * 拖拽物离开目标
   */
  const handleDragLeave = (event: DragEvent) => {
    (event.currentTarget as HTMLElement).classList.remove('is-drop-target-row');
  };

  /**
   * 释放
   */
  const handleDrop = (file: FileItem, event: DragEvent) => {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.remove('is-drop-target-row');

    if (!file.isDir) return;
    if (draggingItemIds.value.includes(file.id)) return;
    if (draggingItemIds.value.length === 0) return;

    emit('moveItems', draggingItemIds.value, file.id);
    draggingItemIds.value = [];
  };

  /**
   * 拖拽结束
   */
  const handleDragEnd = (event: DragEvent) => {
    document.querySelectorAll('.is-drop-target-row').forEach((el) => {
      el.classList.remove('is-drop-target-row');
    });
    draggingItemIds.value = [];
  };
</script>

<style lang="less" scoped>
  .file-list-view-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .file-list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-border-2);
    background-color: var(--color-bg-1);

    .header-left {
      display: flex;
      align-items: center;

      .file-count-text {
        font-size: 14px;
        color: var(--color-text-2);
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  .file-list-view {
    flex: 1;
    overflow: auto;

    :deep(.arco-table) {
      .arco-table-th {
        background-color: var(--color-fill-2);
        color: var(--color-text-2);
        font-weight: 500;
      }

      .file-row {
        transition: all 0.2s;

        &:hover {
          background-color: var(--color-fill-2);
        }
      }

      // 正在被拖拽的行
      .is-dragging-row {
        opacity: 0.5;
      }
      .is-drop-target-row {
        box-shadow: 0 0 0 2px var(--color-primary-light-4);
        position: relative;
        z-index: 1;
        td {
          background-color: var(--color-primary-light-1) !important;
        }
      }
    }

    .file-name-cell {
      display: flex;
      align-items: center;
      gap: 12px;

      &.is-folder {
        cursor: pointer;
      }

      .file-icon-wrapper {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
      }

      .file-icon-img {
        width: 28px;
        height: 28px;
        object-fit: contain;
      }

      .file-name {
        flex: 1;
        font-size: 14px;
        font-weight: 400;
        color: var(--color-text-2);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .file-size,
    .file-time {
      font-size: 14px;
      color: var(--color-text-3);
    }

    .file-actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s;

      .is-favorite {
        color: rgb(var(--warning-6));
      }
    }

    :deep(.arco-table-tr:hover .file-actions) {
      opacity: 1;
    }
  }
</style>
