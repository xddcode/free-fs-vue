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
            <a-link @click="handlePasswordClick"> 修改 </a-link>
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
                  ? `已绑定：${maskEmail(userStore.email)}`
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
    ok-text="确定"
    cancel-text="取消"
    :ok-button-props="{ loading }"
    @before-ok="handleSubmitEmail"
    @cancel="handleEmailModalCancel"
  >
    <a-form
      ref="emailFormRef"
      :model="emailFormData"
      :rules="emailFormRules"
      layout="vertical"
    >
      <a-form-item field="newEmail" label="新邮箱">
        <a-input v-model="emailFormData.newEmail" placeholder="请输入新邮箱" />
      </a-form-item>
      <a-form-item field="code" label="验证码">
        <a-input-group>
          <a-input v-model="emailFormData.code" placeholder="请输入验证码" />
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
    </a-form>
  </a-modal>

  <a-modal
    v-model:visible="passwordModalVisible"
    title="修改密码"
    ok-text="确定"
    cancel-text="取消"
    :ok-button-props="{ loading: passwordLoading }"
    @before-ok="handleSubmitPassword"
    @cancel="handlePasswordModalCancel"
  >
    <a-form
      ref="passwordFormRef"
      :model="passwordFormData"
      :rules="passwordFormRules"
      layout="vertical"
    >
      <a-form-item field="oldPassword" label="当前密码">
        <a-input-password
          v-model="passwordFormData.oldPassword"
          placeholder="请输入当前密码"
          allow-clear
        />
      </a-form-item>
      <a-form-item field="newPassword" label="新密码">
        <a-input-password
          v-model="passwordFormData.newPassword"
          placeholder="请输入新密码"
          allow-clear
        />
      </a-form-item>
      <a-form-item field="confirmPassword" label="确认新密码">
        <a-input-password
          v-model="passwordFormData.confirmPassword"
          placeholder="请再次输入新密码"
          allow-clear
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
  import { ref, reactive, onUnmounted } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import type { FormInstance } from '@arco-design/web-vue';
  import { useUserStore } from '@/store';
  import { sendChangeEmailCode, changeEmail, changePassword } from '@/api/user';
  import useUser from '@/hooks/user';
  import { maskEmail } from '@/utils/format';

  const userStore = useUserStore();
  const { logout } = useUser();
  const emailModalVisible = ref(false);
  const emailFormRef = ref<FormInstance>();
  const loading = ref(false);
  const codeLoading = ref(false);
  const countdown = ref(0);
  let countdownTimer: number | null = null;

  // 修改密码相关
  const passwordModalVisible = ref(false);
  const passwordFormRef = ref<FormInstance>();
  const passwordLoading = ref(false);

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

  const passwordFormData = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 验证确认密码
  const validateConfirmPassword = (
    value: string,
    callback: (error?: string) => void
  ) => {
    if (value !== passwordFormData.newPassword) {
      callback('两次输入的密码不一致');
    } else {
      callback();
    }
  };

  const passwordFormRules = {
    oldPassword: [{ required: true, message: '请输入当前密码' }],
    newPassword: [
      { required: true, message: '请输入新密码' },
      { minLength: 6, message: '密码长度不能少于6位' },
    ],
    confirmPassword: [
      { required: true, message: '请再次输入新密码' },
      {
        validator: validateConfirmPassword,
        message: '两次输入的密码不一致',
      },
    ],
  };

  const handleEmailClick = () => {
    emailFormData.newEmail = '';
    emailFormData.code = '';
    emailModalVisible.value = true;
  };

  const handlePasswordClick = () => {
    passwordFormData.oldPassword = '';
    passwordFormData.newPassword = '';
    passwordFormData.confirmPassword = '';
    passwordModalVisible.value = true;
  };

  const handlePasswordModalCancel = () => {
    passwordModalVisible.value = false;
    passwordFormRef.value?.resetFields();
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

  const handleSubmitEmail = async (done: (closed: boolean) => void) => {
    try {
      const res = await emailFormRef.value?.validate();
      if (res) {
        done(false); // 验证失败，阻止弹窗关闭
        return;
      }
      loading.value = true;
      await changeEmail({
        newEmail: emailFormData.newEmail,
        code: emailFormData.code,
      });
      // 更新store中的用户信息
      userStore.setInfo({ email: emailFormData.newEmail });
      Message.success('邮箱修改成功');
      emailFormRef.value?.resetFields();
      if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        countdown.value = 0;
      }
      done(true); // 验证成功，允许弹窗关闭
    } catch (error) {
      done(false); // 发生错误，阻止弹窗关闭
    } finally {
      loading.value = false;
    }
  };

  const handleSubmitPassword = async (done: (closed: boolean) => void) => {
    try {
      const res = await passwordFormRef.value?.validate();
      if (res) {
        done(false); // 验证失败，阻止弹窗关闭
        return;
      }
      passwordLoading.value = true;
      await changePassword({
        oldPassword: passwordFormData.oldPassword,
        newPassword: passwordFormData.newPassword,
        confirmPassword: passwordFormData.confirmPassword,
      });
      Message.success('密码修改成功，请重新登录');
      passwordFormRef.value?.resetFields();
      done(true); // 验证成功，允许弹窗关闭
      // 延迟一下再退出登录，让用户看到成功提示
      setTimeout(async () => {
        await logout();
      }, 1000);
    } catch (error) {
      done(false); // 发生错误，阻止弹窗关闭
    } finally {
      passwordLoading.value = false;
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
    border-bottom: 1px solid var(--color-neutral-3) !important;
    padding: 16px 0;

    &:last-child {
      border-bottom: none !important;
    }

    .arco-list-item-meta-avatar {
      margin-bottom: 1px;
      margin-right: 16px;
      width: 120px; // 给标题固定宽度，使其左侧对齐
    }

    .arco-list-item-meta {
      padding: 0;
      align-items: center;
    }
  }

  :deep(.arco-list-item-meta-content) {
    flex: 1;
    border-bottom: none;

    .arco-list-item-meta-description {
      display: flex;
      flex-flow: row;
      justify-content: space-between;
      align-items: center;

      .tip {
        color: rgb(var(--gray-6));
      }
      .operation {
        margin-right: 6px;
      }
    }
  }

  /* 调整标题样式，使其看起来不像普通段落 */
  :deep(.arco-list-item-meta-avatar .arco-typography) {
    margin-bottom: 0;
    font-weight: 500;
    color: var(--color-text-1);
  }
</style>
