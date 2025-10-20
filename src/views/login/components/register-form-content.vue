<template>
  <a-form
    ref="registerForm"
    :disabled="formDisabled"
    :model="registerInfo"
    class="login-form"
    layout="vertical"
    @submit="handleRegister"
  >
    <a-form-item
      :rules="[{ required: true, message: `账号不能为空` }]"
      :validate-trigger="['change', 'blur']"
      field="username"
      hide-label
    >
      <a-input v-model="registerInfo.username" placeholder="账号">
        <template #prefix>
          <icon-user />
        </template>
      </a-input>
    </a-form-item>
    <a-form-item
      :rules="[{ required: true, message: '密码不能为空' }]"
      :validate-trigger="['change', 'blur']"
      field="password"
      hide-label
    >
      <a-input-password v-model="registerInfo.password" placeholder="密码">
        <template #prefix>
          <icon-lock />
        </template>
      </a-input-password>
    </a-form-item>
    <a-form-item
      :rules="[
        { required: true, message: '确认密码不能为空' },
        {
          validator: (value: string, cb: (error?: string) => void) => {
            if (value !== registerInfo.password) {
              cb('两次密码不一致');
            } else {
              cb();
            }
          },
        },
      ]"
      :validate-trigger="['change', 'blur']"
      field="confirmPassword"
      hide-label
    >
      <a-input-password
        v-model="registerInfo.confirmPassword"
        placeholder="确认密码"
      >
        <template #prefix>
          <icon-lock />
        </template>
      </a-input-password>
    </a-form-item>
    <a-form-item
      :rules="[
        { required: true, message: '邮箱不能为空' },
        { type: 'email', message: '请输入有效的邮箱地址' },
      ]"
      :validate-trigger="['change', 'blur']"
      field="email"
      hide-label
    >
      <a-input v-model="registerInfo.email" placeholder="邮箱">
        <template #prefix>
          <icon-email />
        </template>
      </a-input>
    </a-form-item>
    <a-form-item field="nickname" hide-label>
      <a-input v-model="registerInfo.nickname" placeholder="昵称">
        <template #prefix>
          <icon-pen />
        </template>
      </a-input>
    </a-form-item>
    <a-space :size="16" direction="vertical">
      <a-button :loading="loading" html-type="submit" long type="primary">
        注册
      </a-button>
      <a-button long type="text" @click="$emit('switchForm', 'login')">
        返回登录
      </a-button>
    </a-space>
  </a-form>
</template>

<script lang="ts" setup>
  import { reactive, ref } from 'vue';
  import useLoading from '@/hooks/loading';
  import { register } from '@/api/user';
  import { ValidatedError } from '@arco-design/web-vue/es/form/interface';
  import { UserRegisterParams } from '@/types/modules/user';
  import { Message } from '@arco-design/web-vue';

  const { loading, setLoading } = useLoading();
  const formDisabled = ref(false);

  // 默认头像 - 使用占位符头像
  const DEFAULT_AVATAR =
    'https://api.dicebear.com/7.x/avataaars/svg?seed=default';

  const registerInfo = reactive<UserRegisterParams>({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    nickname: '',
    avatar: DEFAULT_AVATAR,
  });
  const emit = defineEmits(['switchForm']);

  const handleRegister = async ({
    errors,
    values,
  }: {
    errors: Record<string, ValidatedError> | undefined;
    values: Record<string, any>;
  }) => {
    if (loading.value) return;
    if (!errors) {
      setLoading(true);
      formDisabled.value = true;
      try {
        // 使用用户名生成个性化头像
        const registerData = {
          ...values,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${values.username}`,
        } as UserRegisterParams;

        await register(registerData);
        Message.success('注册成功,即将前往登录');
        setTimeout(() => {
          formDisabled.value = false;
          emit('switchForm', 'login');
        }, 1500);
      } catch (error) {
        formDisabled.value = false;
        Message.error((error as Error).message || '注册失败，请重试');
      } finally {
        setLoading(false);
      }
    }
  };
</script>
