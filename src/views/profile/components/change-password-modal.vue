<template>
  <a-modal
    v-model:visible="modalVisible"
    title="修改密码"
    :width="480"
    :mask-closable="false"
    :esc-to-close="false"
    @cancel="handleCancel"
    @before-ok="handleSubmit"
  >
    <div class="change-password-form">
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
        @submit="handleSubmit"
      >
        <a-form-item label="当前密码" field="currentPassword">
          <a-input-password
            v-model="formData.currentPassword"
            placeholder="请输入当前密码"
            :max-length="50"
            allow-clear
          />
        </a-form-item>

        <a-form-item label="新密码" field="newPassword">
          <a-input-password
            v-model="formData.newPassword"
            placeholder="请输入新密码"
            :max-length="50"
            allow-clear
          />
        </a-form-item>

        <a-form-item label="确认新密码" field="confirmPassword">
          <a-input-password
            v-model="formData.confirmPassword"
            placeholder="请再次输入新密码"
            :max-length="50"
            allow-clear
          />
        </a-form-item>
      </a-form>

      <!-- 密码强度提示 -->
      <div class="password-tips">
        <a-alert type="info" :show-icon="false" message="密码要求：">
          <template #content>
            <ul class="tips-list">
              <li>长度至少8位</li>
              <li>包含字母和数字</li>
              <li>建议包含特殊字符</li>
            </ul>
          </template>
        </a-alert>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <a-button @click="handleCancel">取消</a-button>
        <a-button type="primary" :loading="loading" @click="handleSubmit">
          确认修改
        </a-button>
      </div>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { changePassword } from '@/api/user';
  import type { FormInstance } from '@arco-design/web-vue';

  interface Props {
    visible: boolean;
  }

  interface Emits {
    (e: 'update:visible', visible: boolean): void;
    (e: 'success'): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  // 表单引用
  const formRef = ref<FormInstance>();

  // 加载状态
  const loading = ref(false);

  // 表单数据
  const formData = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 弹窗显示状态
  const modalVisible = computed({
    get: () => props.visible,
    set: (visible: boolean) => emit('update:visible', visible),
  });

  // 重置表单
  const resetForm = () => {
    formData.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
    formRef.value?.clearValidate();
  };

  // 表单验证规则
  const formRules = {
    currentPassword: [
      { required: true, message: '请输入当前密码' },
      { minLength: 6, message: '密码长度至少6位' },
    ],
    newPassword: [
      { required: true, message: '请输入新密码' },
      { minLength: 8, message: '密码长度至少8位' },
      {
        validator: (value: string, callback: (error?: string) => void) => {
          if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]/.test(value)) {
            callback('密码必须包含字母和数字');
          } else {
            callback();
          }
        },
      },
    ],
    confirmPassword: [
      { required: true, message: '请确认新密码' },
      {
        validator: (value: string, callback: (error?: string) => void) => {
          if (value !== formData.value.newPassword) {
            callback('两次输入的密码不一致');
          } else {
            callback();
          }
        },
      },
    ],
  };

  // 监听弹窗显示状态，重置表单
  watch(
    () => props.visible,
    (visible) => {
      if (visible) {
        resetForm();
      }
    }
  );

  // 取消操作
  const handleCancel = () => {
    modalVisible.value = false;
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      // 验证表单
      const valid = await formRef.value?.validate();
      if (!valid) return false;

      loading.value = true;

      // 调用修改密码API
      await changePassword({
        currentPassword: formData.value.currentPassword,
        newPassword: formData.value.newPassword,
      });

      Message.success('密码修改成功');
      emit('success');
      return true;
    } catch (error: any) {
      Message.error(error.message || '密码修改失败');
      return false;
    } finally {
      loading.value = false;
    }
  };
</script>

<style scoped lang="less">
  .change-password-form {
    .password-tips {
      margin-top: 16px;
    }

    .tips-list {
      margin: 8px 0 0 0;
      padding-left: 16px;
      color: #4e5969;
      font-size: 12px;
      line-height: 1.5;

      li {
        margin-bottom: 4px;
      }
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  :deep(.arco-form-item) {
    margin-bottom: 20px;
  }

  :deep(.arco-input-password) {
    border-radius: 6px;
  }

  :deep(.arco-btn) {
    border-radius: 6px;
    font-weight: 500;
  }
</style>
