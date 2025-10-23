<template>
  <a-form
    ref="forgotPasswordForm"
    :model="forgotPasswordInfo"
    class="login-form"
    layout="vertical"
    @submit="handleForgotPassword"
  >
    <a-form-item
      :rules="[
        { required: true, message: '邮箱不能为空' },
        { type: 'email', message: '请输入正确的邮箱格式' },
      ]"
      :validate-trigger="['change', 'blur']"
      field="mail"
      hide-label
    >
      <a-input v-model="forgotPasswordInfo.mail" placeholder="请输入邮箱">
        <template #prefix>
          <icon-email />
        </template>
      </a-input>
    </a-form-item>

    <a-form-item
      :rules="[{ required: true, message: '验证码不能为空' }]"
      :validate-trigger="['change', 'blur']"
      field="code"
      hide-label
    >
      <a-input
        v-model="forgotPasswordInfo.code"
        :max-length="6"
        placeholder="请输入验证码"
      >
        <template #prefix>
          <icon-safe />
        </template>
        <template #suffix>
          <a-button
            :disabled="countdown > 0"
            :loading="codeLoading"
            size="small"
            type="text"
            @click="handleSendCode"
          >
            {{ countdown > 0 ? `${countdown}秒后重试` : '发送验证码' }}
          </a-button>
        </template>
      </a-input>
    </a-form-item>

    <a-form-item
      :rules="[
        { required: true, message: '新密码不能为空' },
        { minLength: 6, message: '密码长度不能少于6位' },
      ]"
      :validate-trigger="['change', 'blur']"
      field="newPassword"
      hide-label
    >
      <a-input-password
        v-model="forgotPasswordInfo.newPassword"
        allow-clear
        placeholder="请输入新密码"
      >
        <template #prefix>
          <icon-lock />
        </template>
      </a-input-password>
    </a-form-item>

    <a-form-item
      :rules="[
        { required: true, message: '确认密码不能为空' },
        {
          validator: validateConfirmPassword,
          message: '两次输入的密码不一致',
        },
      ]"
      :validate-trigger="['change', 'blur']"
      field="confirmPassword"
      hide-label
    >
      <a-input-password
        v-model="forgotPasswordInfo.confirmPassword"
        allow-clear
        placeholder="请再次输入新密码"
      >
        <template #prefix>
          <icon-lock />
        </template>
      </a-input-password>
    </a-form-item>

    <a-space :size="16" direction="vertical">
      <a-button :loading="loading" html-type="submit" long type="primary">
        重置密码
      </a-button>
      <a-button long type="text" @click="$emit('switchForm', 'login')">
        返回登录
      </a-button>
    </a-space>
  </a-form>
</template>

<script lang="ts" setup>
  import { reactive, ref, onUnmounted } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { ValidatedError } from '@arco-design/web-vue/es/form/interface';
  import { sendForgetPasswordCode, updateForgetPassword } from '@/api/user';
  import useLoading from '@/hooks/loading';

  const forgotPasswordForm = ref();
  const { loading, setLoading } = useLoading();
  const codeLoading = ref(false);
  const countdown = ref(0);
  let countdownTimer: number | null = null;

  const $emit = defineEmits(['switchForm']);

  const forgotPasswordInfo = reactive({
    mail: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 验证确认密码
  const validateConfirmPassword = (
    value: string,
    callback: (error?: string) => void
  ) => {
    if (value !== forgotPasswordInfo.newPassword) {
      callback('两次输入的密码不一致');
    } else {
      callback();
    }
  };

  // 发送验证码
  const handleSendCode = async () => {
    if (!forgotPasswordInfo.mail) {
      Message.warning('请先输入邮箱');
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordInfo.mail)) {
      Message.warning('请输入正确的邮箱格式');
      return;
    }

    codeLoading.value = true;
    try {
      await sendForgetPasswordCode(forgotPasswordInfo.mail);
      Message.success('验证码已发送，请查收');

      // 开始倒计时
      countdown.value = 60;
      countdownTimer = window.setInterval(() => {
        countdown.value -= 1;
        if (countdown.value <= 0) {
          clearInterval(countdownTimer as number);
          countdownTimer = null;
        }
      }, 1000);
    } finally {
      codeLoading.value = false;
    }
  };

  // 处理忘记密码
  const handleForgotPassword = async ({
    errors,
  }: {
    errors: Record<string, ValidatedError> | undefined;
    values: Record<string, any>;
  }) => {
    if (loading.value) return;
    if (!errors) {
      setLoading(true);
      try {
        await updateForgetPassword({
          mail: forgotPasswordInfo.mail,
          code: forgotPasswordInfo.code,
          newPassword: forgotPasswordInfo.newPassword,
          confirmPassword: forgotPasswordInfo.confirmPassword,
        });

        Message.success('密码重置成功，请重新登录');

        // 清空表单
        forgotPasswordInfo.mail = '';
        forgotPasswordInfo.code = '';
        forgotPasswordInfo.newPassword = '';
        forgotPasswordInfo.confirmPassword = '';

        // 切换回登录页面
        $emit('switchForm', 'login');
      } finally {
        setLoading(false);
      }
    }
  };

  // 组件卸载时清除定时器
  onUnmounted(() => {
    if (countdownTimer) {
      clearInterval(countdownTimer);
    }
  });
</script>

<style lang="less" scoped>
  .login-form {
    width: 100%;
  }
</style>
