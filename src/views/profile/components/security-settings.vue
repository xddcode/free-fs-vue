<template>
  <a-list :bordered="false">
    <a-list-item>
      <a-list-item-meta>
        <template #avatar>
          <a-typography-paragraph> 账户密码 </a-typography-paragraph>
        </template>
        <template #description>
          <div class="content">
            <a-typography-paragraph> 当前密码强度：强 </a-typography-paragraph>
          </div>
          <div class="operation">
            <a-link> 修改 </a-link>
          </div>
        </template>
      </a-list-item-meta>
    </a-list-item>
    <a-list-item>
      <a-list-item-meta>
        <template #avatar>
          <a-typography-paragraph> 密保问题 </a-typography-paragraph>
        </template>
        <template #description>
          <div class="content">
            <a-typography-paragraph class="tip">
              未设置密保问题，密保问题可有效保护账户安全
            </a-typography-paragraph>
          </div>
          <div class="operation">
            <a-link> 设置 </a-link>
          </div>
        </template>
      </a-list-item-meta>
    </a-list-item>
    <a-list-item>
      <a-list-item-meta>
        <template #avatar>
          <a-typography-paragraph> 设置邮箱 </a-typography-paragraph>
        </template>
        <template #description>
          <div class="content">
            <a-typography-paragraph :class="userStore.email ? '' : 'tip'">
              {{
                userStore.email
                  ? `已绑定：${userStore.email}`
                  : '未绑定邮箱，绑定后，可以作为登录名或找回密码的依据'
              }}
            </a-typography-paragraph>
          </div>
          <div class="operation">
            <a-link @click="handleEmailClick">
              {{ userStore.email ? '修改' : '设置' }}
            </a-link>
          </div>
        </template>
      </a-list-item-meta>
    </a-list-item>
  </a-list>

  <a-modal
    v-model:visible="emailModalVisible"
    title="修改邮箱"
    :footer="false"
    @cancel="handleEmailModalCancel"
  >
    <a-form
      ref="emailFormRef"
      :model="emailFormData"
      :rules="emailFormRules"
      layout="vertical"
    >
      <a-form-item field="newEmail" label="新邮箱">
        <a-input
          v-model="emailFormData.newEmail"
          placeholder="请输入新邮箱"
        />
      </a-form-item>
      <a-form-item field="code" label="验证码">
        <a-input-group>
          <a-input
            v-model="emailFormData.code"
            placeholder="请输入验证码"
          />
          <a-button
            type="primary"
            :loading="codeLoading"
            :disabled="countdown > 0"
            @click="handleSendCode"
          >
            {{ countdown > 0 ? `${countdown}秒后重试` : '发送验证码' }}
          </a-button>
        </a-input-group>
      </a-form-item>
      <a-form-item>
        <a-space>
          <a-button type="primary" :loading="loading" @click="handleSubmitEmail">
            确定
          </a-button>
          <a-button @click="handleEmailModalCancel">取消</a-button>
        </a-space>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
  import { ref, reactive, onUnmounted } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import type { FormInstance } from '@arco-design/web-vue';
  import { useUserStore } from '@/store';
  import { sendChangeEmailCode, changeEmail } from '@/api/user';

  const userStore = useUserStore();
  const emailModalVisible = ref(false);
  const emailFormRef = ref<FormInstance>();
  const loading = ref(false);
  const codeLoading = ref(false);
  const countdown = ref(0);
  let countdownTimer: number | null = null;

  const emailFormData = reactive({
    newEmail: '',
    code: '',
  });

  const emailFormRules = {
    newEmail: [
      { required: true, message: '请输入新邮箱' },
      { type: 'email' as const, message: '请输入正确的邮箱格式' },
    ],
    code: [{ required: true, message: '请输入验证码' }],
  };

  const handleEmailClick = () => {
    emailFormData.newEmail = '';
    emailFormData.code = '';
    emailModalVisible.value = true;
  };

  const handleEmailModalCancel = () => {
    emailModalVisible.value = false;
    emailFormRef.value?.resetFields();
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
      countdown.value = 0;
    }
  };

  const handleSendCode = async () => {
    if (!emailFormData.newEmail) {
      Message.warning('请先输入新邮箱');
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailFormData.newEmail)) {
      Message.warning('请输入正确的邮箱格式');
      return;
    }

    codeLoading.value = true;
    try {
      await sendChangeEmailCode(emailFormData.newEmail);
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

  const handleSubmitEmail = async () => {
    const res = await emailFormRef.value?.validate();
    if (!res) {
      loading.value = true;
      try {
        await changeEmail({
          newEmail: emailFormData.newEmail,
          code: emailFormData.code,
        });
        // 更新store中的用户信息
        userStore.setInfo({ email: emailFormData.newEmail });
        Message.success('邮箱修改成功');
        emailModalVisible.value = false;
        emailFormRef.value?.resetFields();
        if (countdownTimer) {
          clearInterval(countdownTimer);
          countdownTimer = null;
          countdown.value = 0;
        }
      } finally {
        loading.value = false;
      }
    }
  };

  onUnmounted(() => {
    if (countdownTimer) {
      clearInterval(countdownTimer);
    }
  });
</script>

<style scoped lang="less">
  :deep(.arco-list-item) {
    border-bottom: none !important;
    .arco-typography {
      margin-bottom: 20px;
    }
    .arco-list-item-meta-avatar {
      margin-bottom: 1px;
    }
    .arco-list-item-meta {
      padding: 0;
    }
  }
  :deep(.arco-list-item-meta-content) {
    flex: 1;
    border-bottom: 1px solid var(--color-neutral-3);

    .arco-list-item-meta-description {
      display: flex;
      flex-flow: row;
      justify-content: space-between;

      .tip {
        color: rgb(var(--gray-6));
      }
      .operation {
        margin-right: 6px;
      }
    }
  }
</style>
