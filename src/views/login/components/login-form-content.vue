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

      <!-- 第三方登录分隔线 -->
      <a-divider class="social-login-divider">
        <span class="divider-text">或使用第三方登录</span>
      </a-divider>

      <!-- 第三方登录按钮组 -->
      <div class="social-login-buttons">
        <a-tooltip content="微信登录">
          <div
            class="social-btn social-btn-wechat"
            @click="handleSocialLogin('wechat')"
          >
            <icon-wechat />
          </div>
        </a-tooltip>
        <a-tooltip content="GitHub 登录">
          <div
            class="social-btn social-btn-github"
            @click="handleSocialLogin('github')"
          >
            <icon-github />
          </div>
        </a-tooltip>
        <a-tooltip content="QQ 登录">
          <div
            class="social-btn social-btn-qq"
            @click="handleSocialLogin('qq')"
          >
            <icon-qq />
          </div>
        </a-tooltip>
      </div>
    </a-space>
  </a-form>
</template>

<script lang="ts" setup>
  import { reactive } from 'vue';
  import { useRouter } from 'vue-router';
  import { Message } from '@arco-design/web-vue';
  import {
    IconWechat,
    IconGithub,
    IconQqZone as IconQq,
  } from '@arco-design/web-vue/es/icon';
  import { ValidatedError } from '@arco-design/web-vue/es/form/interface';
  import { useUserStore } from '@/store';
  import useLoading from '@/hooks/loading';

  const router = useRouter();

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

        // 检查是否有保存的完整路由信息（包括 params）
        const savedRoute = sessionStorage.getItem('redirect_route');
        if (savedRoute) {
          try {
            const routeInfo = JSON.parse(savedRoute);
            sessionStorage.removeItem('redirect_route');
            router.push(routeInfo);
            return;
          } catch (e) {
            // 解析失败，忽略错误继续正常流程
          }
        }

        // 如果有 redirect 参数，跳转到指定页面
        if (redirect && typeof redirect === 'string') {
          router.push({
            name: redirect,
            query: othersQuery,
          });
        } else {
          // 默认跳转到首页
          router.push({ name: 'home' });
        }
      } finally {
        setLoading(false);
      }
    }
  };
  const setRememberPassword = (
    value: boolean | (string | number | boolean)[]
  ) => {
    userInfo.isRemember = value as boolean;
  };

  // 第三方登录处理（预留）
  const handleSocialLogin = (platform: 'wechat' | 'github' | 'qq') => {
    Message.info(`${platform} 登录功能开发中...`);
    // TODO: 实现第三方登录逻辑
    // console.log(`Attempting ${platform} login...`);
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

  // 第三方登录分隔线
  .social-login-divider {
    margin: 24px 0 20px 0;
    color: var(--color-text-3);
    font-size: 13px;

    .divider-text {
      padding: 0 12px;
      color: var(--color-text-3);
    }

    :deep(.arco-divider-text) {
      padding: 0;
    }
  }

  // 第三方登录按钮组
  .social-login-buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin-bottom: 16px;

    .social-btn {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 22px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      &:active {
        transform: translateY(0);
      }

      // 微信
      &-wechat {
        background: linear-gradient(135deg, #09bb07 0%, #02c05a 100%);
        color: #ffffff;

        &:hover {
          background: linear-gradient(135deg, #0acd08 0%, #03d864 100%);
        }
      }

      // GitHub
      &-github {
        background: linear-gradient(135deg, #24292e 0%, #1a1e22 100%);
        color: #ffffff;

        &:hover {
          background: linear-gradient(135deg, #2f363d 0%, #24292e 100%);
        }
      }

      // QQ
      &-qq {
        background: linear-gradient(135deg, #12b7f5 0%, #0e9fe0 100%);
        color: #ffffff;

        &:hover {
          background: linear-gradient(135deg, #1fc2ff 0%, #12b7f5 100%);
        }
      }
    }
  }
</style>
