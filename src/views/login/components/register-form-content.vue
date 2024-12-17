<template>
  <a-form
    ref="registerForm"
    :model="registerInfo"
    class="login-form"
    :disabled="formDisabled"
    layout="vertical"
    @submit="handleRegister"
  >
    <a-form-item
      field="username"
      :rules="[{ required: true, message: `账号不能为空` }]"
      :validate-trigger="['change', 'blur']"
      hide-label
    >
      <a-input v-model="registerInfo.username" placeholder="账号">
        <template #prefix>
          <icon-user />
        </template>
      </a-input>
    </a-form-item>
    <a-form-item
      field="password"
      :rules="[{ required: true, message: '密码不能为空' }]"
      :validate-trigger="['change', 'blur']"
      hide-label
    >
      <a-input-password v-model="registerInfo.password" placeholder="密码">
        <template #prefix>
          <icon-lock />
        </template>
      </a-input-password>
    </a-form-item>
    <a-form-item
      field="confirmPassword"
      :rules="[
        { required: true, message: '确认密码不能为空' },
        {
          validator: (value, cb) => {
            if (value !== registerInfo.password) {
              cb('两次密码不一致');
            } else {
              cb();
            }
          },
        },
      ]"
      :validate-trigger="['change', 'blur']"
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
      field="email"
      :rules="[
        { required: true, message: '邮箱不能为空' },
        { type: 'email', message: '请输入有效的邮箱地址' },
      ]"
      :validate-trigger="['change', 'blur']"
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
      <a-button type="primary" html-type="submit" long :loading="loading">
        注册
      </a-button>
      <a-button type="text" long @click="$emit('switchForm', 'login')">
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

  const registerInfo = reactive<UserRegisterParams>({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    nickname: '',
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
        await register(values as UserRegisterParams);
        Message.success('注册成功,即将前往登录');
        setTimeout(() => {
          formDisabled.value = false;
          emit('switchForm', 'login');
        }, 1500);
      } catch (error) {
        formDisabled.value = false;
      } finally {
        setLoading(false);
      }
    }
  };
</script>
