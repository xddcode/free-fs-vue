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
        <div class="icon-wrapper">
          <img
            :src="getFileIconPath(file?.isDir ? 'dir' : file?.suffix || '')"
            :alt="file?.displayName"
            class="file-icon"
          />
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
          hide-label
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
      let finalName = form.newName;
      // 如果是文件且有后缀，拼接后缀名
      if (!props.file.isDir && props.file.suffix) {
        finalName = `${form.newName}.${props.file.suffix}`;
      }
      emit('confirm', props.file.id, finalName);
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
        // 如果是文件且有后缀，只显示文件名部分（不含后缀）
        if (!newFile.isDir && newFile.suffix) {
          const dotIndex = newFile.displayName.lastIndexOf('.');
          if (dotIndex > 0) {
            form.newName = newFile.displayName.substring(0, dotIndex);
          } else {
            form.newName = newFile.displayName;
          }
        } else {
          // 文件夹或无后缀文件，显示完整名称
          form.newName = newFile.displayName;
        }
        // 自动聚焦并选中全部内容
        setTimeout(() => {
          const input = document.querySelector(
            '.rename-content input'
          ) as HTMLInputElement;
          if (input) {
            input.focus();
            input.select();
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
    padding: 12px 0 16px;

    .file-preview {
      display: flex;
      justify-content: center;
      margin-bottom: 24px;

      .icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;

        .file-icon {
          width: 88px;
          height: 88px;
          object-fit: contain;
        }
      }
    }

    :deep(.arco-form) {
      .arco-form-item {
        margin-bottom: 0;
      }

      .arco-input-wrapper {
        border-radius: 8px;
        background-color: var(--color-fill-2);
        border: 1px solid transparent;
        transition: all 0.2s;

        &:hover {
          background-color: var(--color-fill-3);
        }

        &.arco-input-focus {
          background-color: var(--color-bg-white);
          border-color: rgb(var(--primary-6));
        }
      }

      .arco-input {
        background-color: transparent;
        font-size: 14px;
        padding: 8px 12px;
      }
    }
  }
</style>
