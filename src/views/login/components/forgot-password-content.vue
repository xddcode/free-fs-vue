<template>
  <a-form
    ref="forgotPasswordForm"
    :model="forgotPasswordInfo"
    class="login-form"
    layout="vertical"
    @submit="handleForgotPassword"
  >
    <!-- ... -->
    <a-space :size="16" direction="vertical">
      <a-button type="primary" html-type="submit" long :loading="loading">
        重置密码
      </a-button>
      <a-button type="text" long @click="$emit('switchForm', 'login')">
        返回登录
      </a-button>
    </a-space>
  </a-form>
</template>

<script lang="ts" setup>
  // ... 其他导入和逻辑保持不变

  defineEmits(['switchForm']);
</script>
