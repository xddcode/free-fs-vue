<template>
  <a-modal
    :visible="visible"
    title="新建文件夹"
    :width="420"
    ok-text="确认"
    cancel-text="取消"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <div class="create-folder-content">
      <div class="folder-icon">
        <img src="/src/assets/images/fti/dir.png" alt="文件夹" />
      </div>
      <a-form ref="formRef" :model="form" @submit="handleOk">
        <a-form-item
          field="folderName"
          hide-label
          :rules="[
            { required: true, message: '请输入文件夹名称' },
            { maxLength: 50, message: '文件夹名称不能超过50个字符' },
          ]"
          :validate-trigger="['blur', 'input']"
        >
          <a-input
            v-model="form.folderName"
            placeholder="新建文件夹"
            :max-length="50"
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

  interface Props {
    visible: boolean;
    parentId?: string;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'confirm', folderName: string, parentId?: string): void;
  }>();

  const formRef = ref<FormInstance>();
  const form = reactive({
    folderName: '',
  });

  const handleOk = async () => {
    const valid = await formRef.value?.validate();
    if (!valid) {
      emit('confirm', form.folderName, props.parentId);
      form.folderName = '';
    }
  };

  const handleCancel = () => {
    formRef.value?.clearValidate();
    form.folderName = '';
    emit('update:visible', false);
  };

  // 监听 visible 变化，重置表单
  watch(
    () => props.visible,
    (newVal) => {
      if (!newVal) {
        formRef.value?.clearValidate();
        form.folderName = '';
      }
    }
  );
</script>

<style lang="less" scoped>
  .create-folder-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 20px 12px;
    gap: 24px;

    .folder-icon {
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        width: 80px;
        height: 80px;
        object-fit: contain;
      }
    }

    :deep(.arco-form) {
      width: 100%;

      .arco-form-item {
        margin-bottom: 0;
      }

      .arco-input-wrapper {
        border-radius: 6px;

        .arco-input {
          text-align: center;
          font-size: 14px;
        }
      }
    }
  }
</style>

