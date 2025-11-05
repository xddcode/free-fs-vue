<template>
  <a-modal
    :visible="visible"
    title="上传文件"
    :width="560"
    ok-text="添加到上传列表"
    cancel-text="取消"
    :ok-button-props="{ disabled: fileList.length === 0 }"
    :mask-closable="true"
    :esc-to-close="true"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <div class="upload-modal-content">
      <a-upload
        :file-list="fileList"
        :auto-upload="false"
        :show-file-list="true"
        :limit="10"
        multiple
        draggable
        @change="handleFileChange"
      >
        <template #upload-button>
          <div class="upload-area">
            <icon-upload :size="48" style="color: #165dff" />
            <div class="upload-text">点击或拖拽文件到此处上传</div>
            <div class="upload-tip">支持同时上传多个文件，单次最多 10 个</div>
          </div>
        </template>
        <template #upload-item="{ fileItem }">
          <div class="file-item-area">
            <div class="file-info">
              <icon-file />
              <span class="file-name">{{ fileItem.file?.name }}</span>
            </div>

            <icon-delete
              class="file-action-icon"
              @click="handleRemoveFile(fileItem)"
            />
          </div>
        </template>
      </a-upload>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
  import { ref, watch } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import {
    IconUpload,
    IconFile,
    IconDelete,
  } from '@arco-design/web-vue/es/icon';
  import type { FileItem } from '@arco-design/web-vue';
  import { useUploadTaskStore } from '@/store';

  interface Props {
    visible: boolean;
    parentId?: string;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
  }>();

  const uploadStore = useUploadTaskStore();
  const fileList = ref<FileItem[]>([]);

  const handleFileChange = (files: FileItem[]) => {
    fileList.value = files;
  };

  const handleRemoveFile = (fileToRemove: FileItem) => {
    fileList.value = fileList.value.filter(
      (item) => item.uid !== fileToRemove.uid
    );
  };

  /**
   * 点击"开始上传"按钮
   */
  const handleSubmit = () => {
    if (fileList.value.length === 0) {
      Message.warning('请选择要上传的文件');
      return;
    }

    const filesToUpload = fileList.value
      .map((item) => item.file)
      .filter(Boolean) as File[];

    if (filesToUpload.length === 0) return;

    uploadStore.addUploadTasks(filesToUpload, props.parentId ?? '');
  };

  const handleCancel = () => {
    emit('update:visible', false);
  };

  // 监听 visible 变化，重置状态
  watch(
    () => props.visible,
    (newVal) => {
      if (!newVal) {
        fileList.value = [];
      }
    }
  );
</script>

<style lang="less" scoped>
  .upload-modal-content {
    padding: 20px 0;

    :deep(.arco-upload) {
      width: 100%;
    }

    .upload-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      border: 2px dashed var(--color-border-2);
      border-radius: 8px;
      background-color: var(--color-fill-1);
      transition: all 0.3s;

      &:hover {
        border-color: rgb(var(--primary-6));
        background-color: var(--color-fill-2);
      }

      .upload-text {
        margin-top: 16px;
        font-size: 16px;
        font-weight: 500;
        color: var(--color-text-1);
      }

      .upload-tip {
        margin-top: 8px;
        font-size: 13px;
        color: var(--color-text-3);
      }
    }

    .file-item-area {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      margin-top: 8px;
      border-radius: 6px;
      background-color: var(--color-fill-2);
      animation: fadeIn 0.3s; // 加个小动画

      .file-info {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--color-text-1);
        .file-name {
          font-size: 14px;
        }
      }

      .file-action-icon {
        font-size: 14px;
        color: var(--color-text-3);
        cursor: pointer;
        transition: color 0.2s;
        &:hover {
          color: rgb(var(--danger-6));
        }
      }
    }
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
