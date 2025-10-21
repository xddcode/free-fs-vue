<template>
  <a-modal
    :visible="visible"
    title="删除确认"
    :width="420"
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
        <p class="message-title">确定要删除以下文件吗？</p>
        <div class="file-info">
          <img
            :src="getFileIconPath(file?.isDir ? 'dir' : file?.suffix || '')"
            :alt="file?.displayName"
            class="file-icon"
          />
          <div class="info-text">
            <div class="file-name">{{ file?.displayName }}</div>
            <div class="file-size">{{ formatFileSize(file?.size || 0) }}</div>
          </div>
        </div>
        <p class="message-warning">
          {{
            file?.isDir ? '删除文件夹将同时删除其中的所有文件，' : ''
          }}此操作不可恢复，请谨慎操作！
        </p>
      </div>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
  import { IconExclamationCircleFill } from '@arco-design/web-vue/es/icon';
  import type { FileItem } from '@/types/modules/file';
  import { getFileIconPath } from '@/utils/file-icon';
  import { formatFileSize } from '../hooks/use-file-format';

  interface Props {
    visible: boolean;
    file?: FileItem | null;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'confirm', fileId: string): void;
  }>();

  const handleOk = () => {
    if (!props.file) return;
    emit('confirm', props.file.id);
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
  }
</style>
