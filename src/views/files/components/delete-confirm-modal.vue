<template>
  <a-modal
    :visible="visible"
    :title="isBatchDelete ? '批量删除确认' : '删除确认'"
    :width="isBatchDelete ? 520 : 420"
    ok-text="确认删除"
    cancel-text="取消"
    status="warning"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <div class="delete-content">
      <div class="warning-icon">
        <icon-exclamation-circle-fill :size="64" style="color: #ff7d00" />
      </div>

      <div class="delete-message">
        <p class="message-title">
          {{
            isBatchDelete
              ? `确定要删除选中的 ${files?.length || 0} 个文件吗？`
              : '确定要删除以下文件吗？'
          }}
        </p>

        <!-- 单个文件详情 -->
        <div v-if="!isBatchDelete && file" class="file-info">
          <img
            :src="getFileIconPath(file.isDir ? 'dir' : file.suffix || '')"
            :alt="file.displayName"
            class="file-icon"
          />
          <div class="info-text">
            <div class="file-name">{{ file.displayName }}</div>
            <div class="file-size">{{ formatFileSize(file.size || 0) }}</div>
          </div>
        </div>

        <!-- 批量文件列表 -->
        <div v-else-if="isBatchDelete" class="batch-file-list">
          <div
            v-for="fileItem in displayFiles"
            :key="fileItem.id"
            class="batch-file-item"
          >
            <img
              :src="
                getFileIconPath(fileItem.isDir ? 'dir' : fileItem.suffix || '')
              "
              :alt="fileItem.displayName"
              class="file-icon-small"
            />
            <div class="file-name-small">{{ fileItem.displayName }}</div>
          </div>
          <div v-if="(files?.length || 0) > maxDisplayFiles" class="more-files">
            还有 {{ (files?.length || 0) - maxDisplayFiles }} 个文件...
          </div>
        </div>

        <p class="message-warning">
          {{
            hasFolder ? '文件夹将同时删除其中的所有文件，' : ''
          }}文件将被移到回收站，可在回收站中恢复。
        </p>
      </div>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import { IconExclamationCircleFill } from '@arco-design/web-vue/es/icon';
  import type { FileItem } from '@/types/modules/file';
  import { getFileIconPath } from '@/utils/file-icon';
  import { formatFileSize } from '../hooks/use-file-format';

  interface Props {
    visible: boolean;
    file?: FileItem | null;
    files?: FileItem[];
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'confirm', fileIds: string | string[]): void;
  }>();

  // 是否是批量删除
  const isBatchDelete = computed(() => {
    return (props.files?.length || 0) > 1;
  });

  // 最多显示的文件数量
  const maxDisplayFiles = 5;

  // 用于显示的文件列表
  const displayFiles = computed(() => {
    return (props.files || []).slice(0, maxDisplayFiles);
  });

  // 是否包含文件夹
  const hasFolder = computed(() => {
    if (isBatchDelete.value) {
      return props.files?.some((f) => f.isDir) || false;
    }
    return props.file?.isDir || false;
  });

  const handleOk = () => {
    if (isBatchDelete.value) {
      const fileIds = props.files?.map((f) => f.id) || [];
      if (fileIds.length > 0) {
        emit('confirm', fileIds);
      }
    } else if (props.file) {
      emit('confirm', props.file.id);
    }
  };

  const handleCancel = () => {
    emit('update:visible', false);
  };
</script>

<style lang="less" scoped>
  .delete-content {
    padding: 20px 0;
    text-align: center;

    .warning-icon {
      margin-bottom: 24px;
    }

    .delete-message {
      .message-title {
        font-size: 16px;
        font-weight: 500;
        color: var(--color-text-1);
        margin-bottom: 20px;
      }

      .file-info {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        margin-bottom: 20px;
        background-color: var(--color-fill-2);
        border-radius: 8px;
        text-align: left;

        .file-icon {
          width: 48px;
          height: 48px;
          object-fit: contain;
        }

        .info-text {
          flex: 1;
          overflow: hidden;

          .file-name {
            font-size: 14px;
            color: var(--color-text-1);
            font-weight: 500;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            margin-bottom: 4px;
          }

          .file-size {
            font-size: 12px;
            color: var(--color-text-3);
          }
        }
      }

      .message-warning {
        font-size: 13px;
        color: var(--color-text-3);
        line-height: 1.6;
      }
    }

    .batch-file-list {
      max-height: 200px;
      overflow-y: auto;
      padding: 12px;
      margin-bottom: 20px;
      background-color: var(--color-fill-2);
      border-radius: 8px;

      .batch-file-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px;
        margin-bottom: 4px;
        background-color: var(--color-bg-2);
        border-radius: 6px;

        &:last-child {
          margin-bottom: 0;
        }

        .file-icon-small {
          width: 32px;
          height: 32px;
          object-fit: contain;
          flex-shrink: 0;
        }

        .file-name-small {
          flex: 1;
          font-size: 13px;
          color: var(--color-text-2);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .more-files {
        text-align: center;
        font-size: 12px;
        color: var(--color-text-3);
        padding: 8px;
        margin-top: 8px;
      }
    }
  }
</style>
