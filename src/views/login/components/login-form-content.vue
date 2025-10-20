<template>
  <a-form
    ref="loginForm"
    :model="userInfo"
    class="login-form"
    layout="vertical"
    @submit="handleSubmit"
  >
    <a-form-item
      :rules="[{ required: true, message: `账号不能为空` }]"
      :validate-trigger="['change', 'blur']"
      field="username"
      hide-label
    >
      <a-input v-model="userInfo.username" placeholder="账号">
        <template #prefix>
          <icon-user />
        </template>
      </a-input>
    </a-form-item>
    <a-form-item
      :rules="[{ required: true, message: `密码不能为空` }]"
      :validate-trigger="['change', 'blur']"
      field="password"
      hide-label
    >
      <a-input-password
        v-model="userInfo.password"
        allow-clear
        placeholder="密码"
      >
        <template #prefix>
          <icon-lock />
        </template>
      </a-input-password>
    </a-form-item>
    <a-space :size="16" direction="vertical">
      <div class="login-form-password-actions">
        <a-checkbox
          :model-value="userInfo.isRemember"
          @change="setRememberPassword"
        >
          记住我？
        </a-checkbox>
        <a-link @click="$emit('switchForm', 'forgotPassword')">忘记密码</a-link>
      </div>
      <a-button :loading="loading" html-type="submit" long type="primary">
        登录
      </a-button>
      <a-button
        class="login-form-register-btn"
        long
        type="text"
        @click="$emit('switchForm', 'register')"
      >
        注册账号
      </a-button>
    </a-space>
  </a-form>
</template>

<script lang="ts" setup>
  import { reactive, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { Message } from '@arco-design/web-vue';
  import { ValidatedError } from '@arco-design/web-vue/es/form/interface';
  import { useUserStore } from '@/store';
  import useLoading from '@/hooks/loading';

  const router = useRouter();

  const errorMessage = ref('');
  const { loading, setLoading } = useLoading();
  const userStore = useUserStore();

  const userInfo = reactive({
    username: '',
    password: '',
    isRemember: true,
  });

  const handleSubmit = async ({
    errors,
  }: {
    errors: Record<string, ValidatedError> | undefined;
    values: Record<string, any>;
  }) => {
    if (loading.value) return;
    if (!errors) {
      setLoading(true);
      try {
        // 1. 登录并获取用户信息
        await userStore.login({
          username: userInfo.username,
          password: userInfo.password,
          isRemember: userInfo.isRemember,
        });

        // 2. 登录成功提示
        Message.success('登录成功');

        // 3. 跳转到目标页面
        const { redirect, ...othersQuery } = router.currentRoute.value.query;
        router.push({
          name: (redirect as string) || 'home',
          query: {
            ...othersQuery,
          },
        });
      } catch (err) {
        errorMessage.value = (err as Error).message;
        Message.error(errorMessage.value || '登录失败，请重试');
      } finally {
        setLoading(false);
      }
    }
  };
  const setRememberPassword = (value: boolean) => {
    userInfo.isRemember = value;
  };
  defineEmits(['switchForm']);
</script>

<style lang="less" scoped>
  .login-form {
    &-password-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    &-register-btn {
      color: var(--color-text-3) !important;
    }
  }
</style>
