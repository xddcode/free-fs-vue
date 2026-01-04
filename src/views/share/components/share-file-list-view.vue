<template>
  <div class="file-list-view-container">
    <div class="file-list-header">
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
    <div class="file-list-view">
      <a-table
        :data="fileList"
        :pagination="false"
        :bordered="false"
        row-key="id"
        :row-class="() => 'file-row'"
      >
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

          <a-table-column title="修改时间" data-index="updateTime" :width="180">
            <template #cell="{ record }">
              <span class="file-time">{{
                formatFileTime(record.updateTime)
              }}</span>
            </template>
          </a-table-column>

          <a-table-column title="操作" :width="150" align="center">
            <template #cell="{ record }">
              <div class="file-actions">
                <a-tooltip
                  v-if="!record.isDir && hasPreviewPermission()"
                  content="预览"
                >
                  <a-button
                    size="small"
                    type="text"
                    @click.stop="$emit('preview', record)"
                  >
                    <icon-eye />
                  </a-button>
                </a-tooltip>
                <a-tooltip
                  v-if="!record.isDir && hasDownloadPermission()"
                  content="下载"
                >
                  <a-button
                    size="small"
                    type="text"
                    @click.stop="$emit('download', record)"
                  >
                    <icon-download />
                  </a-button>
                </a-tooltip>
              </div>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import {
    IconRefresh,
    IconApps,
    IconList,
    IconEye,
    IconDownload,
  } from '@arco-design/web-vue/es/icon';
  import type { FileItem } from '@/types/modules/file';
  import { getFileIconPath } from '@/utils/file-icon';
  import {
    formatFileSize,
    formatFileTime,
  } from '@/views/files/hooks/use-file-format';

  interface Props {
    fileList: FileItem[];
    viewMode?: 'list' | 'grid';
    scope?: string;
  }

  const props = defineProps<Props>();

  // 检查是否有预览权限
  const hasPreviewPermission = () => {
    return props.scope?.includes('preview') ?? true;
  };

  // 检查是否有下载权限
  const hasDownloadPermission = () => {
    return props.scope?.includes('download') ?? true;
  };

  const emit = defineEmits<{
    (e: 'rowClick', record: FileItem): void;
    (e: 'download', record: FileItem): void;
    (e: 'update:viewMode', value: 'list' | 'grid'): void;
    (e: 'refresh'): void;
    (e: 'preview', file: FileItem): void;
  }>();

  const handleDoubleClick = (record: FileItem) => {
    if (record.isDir) {
      emit('rowClick', record);
    }
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
    }

    :deep(.arco-table-tr:hover .file-actions) {
      opacity: 1;
    }
  }
</style>
