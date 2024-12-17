<template>
  <div class="login-form-wrapper">
    <div class="login-form-title">{{ formTitles[currentForm] }}</div>
    <div class="login-form-sub-title">Free Fs</div>
    <div class="login-form-error-msg">{{ errorMessage }}</div>

    <LoginFormContent
      v-if="currentForm === 'login'"
      @switch-form="switchForm"
    />
    <RegisterFormContent
      v-if="currentForm === 'register'"
      @switch-form="switchForm"
    />
    <ForgotPasswordFormContent
      v-if="currentForm === 'forgotPassword'"
      @switch-form="switchForm"
    />
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import LoginFormContent from './login-form-content.vue';
  import RegisterFormContent from './register-form-content.vue';
  import ForgotPasswordFormContent from './forgot-password-content.vue';

  const currentForm = ref('login');
  const errorMessage = ref('');

  const formTitles = {
    login: '登录',
    register: '注册',
    forgotPassword: '忘记密码',
  };

  const switchForm = (formName: 'login' | 'register' | 'forgotPassword') => {
    currentForm.value = formName;
    errorMessage.value = '';
  };
</script>

<style lang="less" scoped>
  .login-form {
    &-wrapper {
      width: 320px;
    }

    &-title {
      color: var(--color-text-1);
      font-weight: 500;
      font-size: 24px;
      line-height: 32px;
    }

    &-sub-title {
      color: var(--color-text-3);
      font-size: 16px;
      line-height: 24px;
    }

    &-error-msg {
      height: 32px;
      color: rgb(var(--red-6));
      line-height: 32px;
    }

    &-password-actions {
      display: flex;
      justify-content: space-between;
    }

    &-register-btn {
      color: var(--color-text-3) !important;
    }
  }
</style>
