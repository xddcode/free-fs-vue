<template>
  <a-modal
    :visible="visible"
    title="放入回收站"
    :width="420"
    ok-text="确认放入"
    cancel-text="取消"
    status="warning"
    :ok-button-props="{ status: 'danger' }"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <div class="delete-content">
      <div class="warning-icon">
        <icon-exclamation-circle-fill :size="64" style="color: #ff7d00" />
      </div>

      <div class="delete-message">
        <p class="message-warning">文件将被移到回收站，可在回收站中恢复。</p>
      </div>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
  import { IconExclamationCircleFill } from '@arco-design/web-vue/es/icon';
  import type { FileItem } from '@/types/modules/file';

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

  const handleOk = () => {
    if (props.files && props.files.length > 0) {
      // 批量删除
      const fileIds = props.files.map((f) => f.id);
      emit('confirm', fileIds);
    } else if (props.file) {
      // 单个删除
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
      .message-warning {
        font-size: 14px;
        color: var(--color-text-2);
        line-height: 1.6;
      }
    }
  }
</style>
