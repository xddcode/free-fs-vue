<template>
  <a-modal
    v-model:visible="modalVisible"
    title="修改邮箱"
    :width="480"
    :mask-closable="false"
    :esc-to-close="false"
    @cancel="handleCancel"
    @before-ok="handleSubmit"
  >
    <div class="change-email-form">
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
        @submit="handleSubmit"
      >
        <a-form-item label="新邮箱" field="newEmail">
          <a-input
            v-model="formData.newEmail"
            placeholder="请输入新邮箱地址"
            :max-length="100"
            allow-clear
          >
            <template #prefix>
              <icon-email />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item label="验证码" field="code">
          <div class="code-input-wrapper">
            <a-input
              v-model="formData.code"
              placeholder="请输入验证码"
              :max-length="6"
              allow-clear
            >
              <template #prefix>
                <icon-safe />
              </template>
            </a-input>
            <a-button
              type="outline"
              :disabled="countdown > 0"
              :loading="sendingCode"
              @click="handleSendCode"
            >
              {{ countdown > 0 ? `${countdown}秒后重新发送` : '发送验证码' }}
            </a-button>
          </div>
        </a-form-item>
      </a-form>

      <!-- 提示信息 -->
      <div class="email-tips">
        <a-alert type="info" :show-icon="false">
          <template #content>
            <p>验证码将发送到新邮箱地址，请注意查收</p>
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
  import { IconEmail, IconSafe } from '@arco-design/web-vue/es/icon';
  import { sendChangeEmailCode, changeEmail } from '@/api/user';
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

  // 发送验证码加载状态
  const sendingCode = ref(false);

  // 倒计时
  const countdown = ref(0);

  // 定时器
  let timer: number | null = null;

  // 表单数据
  const formData = ref({
    newEmail: '',
    code: '',
  });

  // 弹窗显示状态
  const modalVisible = computed({
    get: () => props.visible,
    set: (visible: boolean) => emit('update:visible', visible),
  });

  // 重置表单
  const resetForm = () => {
    formData.value = {
      newEmail: '',
      code: '',
    };
    formRef.value?.clearValidate();
    // 清除倒计时
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    countdown.value = 0;
  };

  // 表单验证规则
  const formRules = {
    newEmail: [
      { required: true, message: '请输入新邮箱' },
      { type: 'email', message: '邮箱格式不正确' },
    ],
    code: [
      { required: true, message: '请输入验证码' },
      { minLength: 6, maxLength: 6, message: '验证码为6位数字' },
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

  // 发送验证码
  const handleSendCode = async () => {
    try {
      // 验证邮箱
      const emailError = await formRef.value?.validateField('newEmail');
      if (emailError) return;

      sendingCode.value = true;

      // 发送验证码
      await sendChangeEmailCode(formData.value.newEmail);

      Message.success('验证码已发送，请查收邮件');

      // 开始倒计时
      countdown.value = 60;
      timer = setInterval(() => {
        countdown.value -= 1;
        if (countdown.value <= 0) {
          if (timer) {
            clearInterval(timer);
            timer = null;
          }
        }
      }, 1000) as unknown as number;
    } catch (error: any) {
      Message.error(error.message || '验证码发送失败');
    } finally {
      sendingCode.value = false;
    }
  };

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

      // 调用修改邮箱API
      await changeEmail({
        newEmail: formData.value.newEmail,
        code: formData.value.code,
      });

      Message.success('邮箱修改成功');
      emit('success');
      return true;
    } catch (error: any) {
      Message.error(error.message || '邮箱修改失败');
      return false;
    } finally {
      loading.value = false;
    }
  };
</script>

<style scoped lang="less">
  .change-email-form {
    .code-input-wrapper {
      display: flex;
      gap: 12px;

      :deep(.arco-input-wrapper) {
        flex: 1;
      }

      :deep(.arco-btn) {
        min-width: 120px;
        white-space: nowrap;
      }
    }

    .email-tips {
      margin-top: 16px;

      :deep(.arco-alert) {
        font-size: 12px;
        line-height: 1.5;

        p {
          margin: 0;
          color: #4e5969;
        }
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

  :deep(.arco-input-wrapper),
  :deep(.arco-btn) {
    border-radius: 6px;
  }

  :deep(.arco-btn) {
    font-weight: 500;
  }
</style>
