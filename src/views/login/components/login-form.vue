<template>
  <div class="login-form-wrapper">
    <div class="login-form-title">{{ formTitles[currentForm] }}</div>
    <div class="login-form-sub-title">
      <div class="sub-title-en">Free Cloud Storage</div>
      <div class="sub-title-zh">自由云存储</div>
    </div>
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

  type FormType = 'login' | 'register' | 'forgotPassword';

  const currentForm = ref<FormType>('login');
  const errorMessage = ref('');

  const formTitles: Record<FormType, string> = {
    login: '登录',
    register: '注册',
    forgotPassword: '忘记密码',
  };

  const switchForm = (formName: FormType) => {
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
      margin-top: 8px;
      margin-bottom: 4px;

      .sub-title-en {
        color: var(--color-text-2);
        font-weight: 500;
        font-size: 15px;
        line-height: 22px;
        letter-spacing: 0.5px;
      }

      .sub-title-zh {
        color: var(--color-text-3);
        font-size: 13px;
        line-height: 20px;
        margin-top: 2px;
      }
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
