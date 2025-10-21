<template>
  <div class="file-list-view">
    <a-table
      :data="fileList"
      :pagination="false"
      :bordered="false"
      row-key="id"
      :row-class="() => 'file-row'"
      @row-click="handleRowClick"
      @change="handleTableChange"
    >
      <template #columns>
        <a-table-column title="文件名" data-index="displayName" :width="400">
          <template #cell="{ record }">
            <div class="file-name-cell">
              <div class="file-icon-wrapper">
                <img
                  :src="
                    getFileIconPath(record.isDir ? 'dir' : record.suffix || '')
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
            <div class="file-actions">
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
  import { formatFileSize, formatFileTime } from '../hooks/use-file-format';

  interface Props {
    fileList: FileItem[];
  }

  defineProps<Props>();

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
  }>();

  const handleRowClick = (record: FileItem) => {
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
</script>

<style lang="less" scoped>
  .file-list-view {
    :deep(.arco-table) {
      .arco-table-th {
        background-color: var(--color-fill-2);
        color: var(--color-text-2);
        font-weight: 500;
      }

      .file-row {
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background-color: var(--color-fill-2);
        }
      }
    }

    .file-name-cell {
      display: flex;
      align-items: center;
      gap: 12px;

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
    }

    :deep(.arco-table-tr:hover .file-actions) {
      opacity: 1;
    }
  }
</style>
