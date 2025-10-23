<template>
  <div class="basic-info-form">
    <div class="form-wrapper">
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="horizontal"
        :label-col-props="{ span: 6 }"
        :wrapper-col-props="{ span: 18 }"
      >
        <!-- 昵称 -->
        <a-form-item label="昵称" field="nickname" required>
          <a-input
            v-model="formData.nickname"
            placeholder="请输入您的昵称"
            :max-length="50"
            allow-clear
          />
        </a-form-item>

        <!-- 操作按钮 -->
        <a-form-item :wrapper-col-props="{ offset: 6 }">
          <a-space>
            <a-button type="primary" :loading="loading" @click="handleSubmit">
              保存
            </a-button>
            <a-button @click="handleReset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, watch } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import type { FormInstance } from '@arco-design/web-vue';
  import { updateUserInfo } from '@/api/user';
  import useUserStore from '@/store/modules/user';
  import type { UserState } from '@/store/modules/user/types';

  interface Props {
    userInfo: UserState;
  }

  interface Emits {
    (e: 'success'): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const userStore = useUserStore();

  // 表单引用
  const formRef = ref<FormInstance>();

  // 加载状态
  const loading = ref(false);

  // 表单数据
  const formData = reactive({
    nickname: props.userInfo.nickname || '',
  });

  // 表单验证规则
  const formRules = {
    nickname: [
      { required: true, message: '请输入昵称' },
      { minLength: 2, message: '昵称至少2个字符' },
      { maxLength: 50, message: '昵称最多50个字符' },
    ],
  };

  // 监听用户信息变化，更新表单数据
  watch(
    () => props.userInfo,
    (newVal) => {
      formData.nickname = newVal.nickname || '';
    },
    { deep: true }
  );

  // 提交表单
  const handleSubmit = async () => {
    try {
      // 验证表单
      const valid = await formRef.value?.validate();
      if (!valid) return;

      loading.value = true;

      // 调用更新API
      await updateUserInfo({
        nickname: formData.nickname,
      });

      // 更新store中的用户信息
      await userStore.getUserInfo();

      Message.success('保存成功');
      emit('success');
    } catch (error: any) {
      Message.error(error.message || '保存失败');
    } finally {
      loading.value = false;
    }
  };

  // 重置表单
  const handleReset = () => {
    formData.nickname = props.userInfo.nickname || '';
    formRef.value?.clearValidate();
  };
</script>

<style scoped lang="less">
  .basic-info-form {
    padding: 24px 0;
    display: flex;
    justify-content: center;

    .form-wrapper {
      width: 100%;
      max-width: 700px;
    }

    :deep(.arco-form-item-label-col) {
      text-align: right;
      padding-right: 20px;

      .arco-form-item-label {
        color: #1d2129;
        font-weight: normal;
        font-size: 14px;
      }

      .arco-form-item-label-required-symbol {
        color: #f53f3f;
        margin-right: 4px;
      }
    }

    :deep(.arco-form-item) {
      margin-bottom: 24px;
    }

    :deep(.arco-input-wrapper) {
      border-radius: 2px;
      background-color: #f7f8fa;
      border-color: #f7f8fa;

      &:hover {
        background-color: #f7f8fa;
        border-color: #c9cdd4;
      }

      &.arco-input-focus {
        background-color: #fff;
        border-color: #165dff;
      }

      .arco-input {
        background-color: transparent;
      }
    }

    :deep(.arco-btn) {
      border-radius: 2px;
      min-width: 80px;
      font-weight: normal;
    }

    :deep(.arco-btn-primary) {
      background-color: #165dff;
      border-color: #165dff;
    }

    :deep(.arco-btn-secondary) {
      background-color: #fff;
      border-color: #e5e6eb;
      color: #4e5969;
    }
  }
</style>
