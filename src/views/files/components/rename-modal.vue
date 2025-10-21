<template>
  <a-modal
    :visible="visible"
    title="重命名"
    :width="420"
    ok-text="确认"
    cancel-text="取消"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <div class="rename-content">
      <div class="file-preview">
        <img
          :src="getFileIconPath(file?.isDir ? 'dir' : file?.suffix || '')"
          :alt="file?.displayName"
          class="file-icon"
        />
        <div class="file-info">
          <div class="original-name">{{ file?.displayName }}</div>
        </div>
      </div>
      <a-form ref="formRef" :model="form" @submit="handleOk">
        <a-form-item
          field="newName"
          :rules="[
            { required: true, message: '请输入新名称' },
            { maxLength: 100, message: '名称不能超过100个字符' },
          ]"
          :validate-trigger="['blur', 'input']"
        >
          <a-input
            v-model="form.newName"
            placeholder="请输入新名称"
            :max-length="100"
            allow-clear
            @press-enter="handleOk"
          />
        </a-form-item>
      </a-form>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
  import { ref, reactive, watch } from 'vue';
  import type { FormInstance } from '@arco-design/web-vue';
  import type { FileItem } from '@/types/modules/file';
  import { getFileIconPath } from '@/utils/file-icon';

  interface Props {
    visible: boolean;
    file?: FileItem | null;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'confirm', fileId: string, newName: string): void;
  }>();

  const formRef = ref<FormInstance>();
  const form = reactive({
    newName: '',
  });

  const handleOk = async () => {
    const valid = await formRef.value?.validate();
    if (!valid && props.file) {
      emit('confirm', props.file.id, form.newName);
      form.newName = '';
    }
  };

  const handleCancel = () => {
    formRef.value?.clearValidate();
    form.newName = '';
    emit('update:visible', false);
  };

  // 监听 visible 和 file 变化，初始化表单
  watch(
    () => [props.visible, props.file] as const,
    ([newVisible, newFile]) => {
      if (newVisible && newFile) {
        form.newName = newFile.displayName;
        // 如果是文件，选中文件名但不包含后缀
        setTimeout(() => {
          const input = document.querySelector('.rename-content input') as HTMLInputElement;
          if (input && !newFile.isDir && newFile.suffix) {
            const dotIndex = newFile.displayName.lastIndexOf('.');
            if (dotIndex > 0) {
              input.setSelectionRange(0, dotIndex);
            }
          }
        }, 100);
      } else if (!newVisible) {
        formRef.value?.clearValidate();
        form.newName = '';
      }
    }
  );
</script>

<style lang="less" scoped>
  .rename-content {
    padding: 20px 0;

    .file-preview {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      margin-bottom: 20px;
      background-color: var(--color-fill-2);
      border-radius: 8px;

      .file-icon {
        width: 48px;
        height: 48px;
        object-fit: contain;
      }

      .file-info {
        flex: 1;
        overflow: hidden;

        .original-name {
          font-size: 14px;
          color: var(--color-text-1);
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }

    :deep(.arco-form) {
      .arco-form-item {
        margin-bottom: 0;
      }

      .arco-input-wrapper {
        border-radius: 6px;
      }
    }
  }
</style>

