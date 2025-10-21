<template>
  <a-modal
    :visible="visible"
    title="上传文件"
    :width="560"
    ok-text="开始上传"
    cancel-text="取消"
    :ok-button-props="{ disabled: fileList.length === 0 || uploading }"
    :cancel-button-props="{ disabled: uploading }"
    :mask-closable="!uploading"
    :esc-to-close="!uploading"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <div class="upload-modal-content">
      <a-upload
        ref="uploadRef"
        :file-list="fileList"
        :auto-upload="false"
        :show-file-list="true"
        :limit="10"
        :custom-request="customRequest"
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
      </a-upload>

      <div v-if="uploading" class="upload-status">
        <a-spin tip="正在上传文件，请稍候..." />
      </div>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
  import { ref, watch } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { IconUpload } from '@arco-design/web-vue/es/icon';
  import type { FileItem, RequestOption } from '@arco-design/web-vue';
  import { uploadFile } from '@/api/file';

  interface Props {
    visible: boolean;
    parentId?: string;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'success'): void;
  }>();

  const uploadRef = ref();
  const fileList = ref<FileItem[]>([]);
  const uploading = ref(false);

  // 跟踪上传状态
  let uploadCount = 0;
  let successCount = 0;
  let errorCount = 0;

  const handleFileChange = (files: FileItem[]) => {
    fileList.value = files;
  };

  /**
   * 检查是否所有文件上传完成
   */
  const checkUploadComplete = () => {
    const completedCount = successCount + errorCount;

    if (completedCount === uploadCount) {
      uploading.value = false;

      // 显示上传结果
      if (successCount === uploadCount) {
        Message.success(`成功上传 ${successCount} 个文件`);
      } else if (successCount > 0) {
        Message.warning(`成功上传 ${successCount} 个，失败 ${errorCount} 个`);
      } else {
        Message.error('上传失败，请重试');
      }

      // 通知父组件刷新（只要有成功的就刷新）
      if (successCount > 0) {
        emit('success');
      }

      // 延迟关闭弹窗
      setTimeout(() => {
        emit('update:visible', false);
      }, 500);
    }
  };

  /**
   * 自定义上传方法
   */
  const customRequest = (option: RequestOption) => {
    const { fileItem, onError, onSuccess } = option;
    const file = fileItem.file as File;

    uploadFile(file, props.parentId)
      .then((response) => {
        successCount += 1;
        onSuccess(response);
        checkUploadComplete();
      })
      .catch((error) => {
        errorCount += 1;
        onError(error);
        checkUploadComplete();
      });
  };

  /**
   * 点击"开始上传"按钮
   */
  const handleSubmit = () => {
    if (fileList.value.length === 0) return;

    uploading.value = true;
    uploadCount = fileList.value.length;
    successCount = 0;
    errorCount = 0;

    // 调用 Upload 组件的 submit 方法，触发批量上传
    uploadRef.value?.submit();
  };

  const handleCancel = () => {
    if (uploading.value) return;
    fileList.value = [];
    emit('update:visible', false);
  };

  // 监听 visible 变化，重置状态
  watch(
    () => props.visible,
    (newVal) => {
      if (!newVal) {
        fileList.value = [];
        uploading.value = false;
        uploadCount = 0;
        successCount = 0;
        errorCount = 0;
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

    .upload-status {
      margin-top: 20px;
      padding: 24px;
      text-align: center;
      background-color: var(--color-fill-2);
      border-radius: 8px;
    }
  }
</style>
