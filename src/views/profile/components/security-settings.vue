<template>
  <div class="security-settings">
    <!-- 密码修改 -->
    <div class="setting-item">
      <div class="setting-info">
        <div class="setting-title">密码修改</div>
        <div class="setting-desc">
          已设置，验证您6个的字符，支持数字，大小写和特殊字符，月至少修改6次密码，每次修改密码需间隔24小时
        </div>
      </div>
      <div class="setting-action">
        <a-button type="text" @click="showPasswordModal = true">修改</a-button>
      </div>
    </div>

    <a-divider />

    <!-- 邮箱修改 -->
    <div class="setting-item">
      <div class="setting-info">
        <div class="setting-title">邮箱修改</div>
        <div class="setting-desc">
          <template v-if="userInfo.email">
            已绑定：<span class="highlight">{{
              maskEmail(userInfo.email)
            }}</span>
          </template>
          <template v-else>
            您暂未设置邮箱，绑定邮箱可以用来找回密码、接收通知等。
          </template>
        </div>
      </div>
      <div class="setting-action">
        <a-button type="text" @click="showEmailModal = true">
          {{ userInfo.email ? '修改' : '设置' }}
        </a-button>
      </div>
    </div>

    <a-divider />

    <!-- 安全手机 -->
    <div class="setting-item">
      <div class="setting-info">
        <div class="setting-title">安全手机</div>
        <div class="setting-desc">
          您开启虚拟手机号双因子认证，绑定成功后可用于登录使用，代替短信验证码。提高账号安全性。
        </div>
      </div>
      <div class="setting-action">
        <a-button type="text" disabled>修改</a-button>
      </div>
    </div>

    <a-divider />

    <!-- 安全令牌 -->
    <div class="setting-item">
      <div class="setting-info">
        <div class="setting-title">安全令牌</div>
        <div class="setting-desc">
          您开启虚拟令牌双因子认证用，绑定成功后可用于登录使用，代替短信验证码。提高账号安全性。
        </div>
      </div>
      <div class="setting-action">
        <a-button type="text" disabled>修改</a-button>
      </div>
    </div>

    <!-- 修改密码弹窗 -->
    <change-password-modal
      v-model:visible="showPasswordModal"
      @success="handlePasswordSuccess"
    />

    <!-- 修改邮箱弹窗 -->
    <change-email-modal
      v-model:visible="showEmailModal"
      @success="handleEmailSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import useUserStore from '@/store/modules/user';
  import ChangePasswordModal from './change-password-modal.vue';
  import ChangeEmailModal from './change-email-modal.vue';

  const userStore = useUserStore();

  // 用户信息
  const userInfo = computed(() => userStore.userInfo);

  // 邮箱隐私处理
  const maskEmail = (email: string) => {
    if (!email) return '';
    const [username, domain] = email.split('@');
    if (username.length <= 2) {
      return `${username[0]}***@${domain}`;
    }
    return `${username[0]}***${username[username.length - 1]}@${domain}`;
  };

  // 修改密码弹窗
  const showPasswordModal = ref(false);

  // 修改邮箱弹窗
  const showEmailModal = ref(false);

  // 密码修改成功
  const handlePasswordSuccess = () => {
    Message.success('密码修改成功');
    showPasswordModal.value = false;
  };

  // 邮箱修改成功
  const handleEmailSuccess = () => {
    Message.success('邮箱修改成功');
    showEmailModal.value = false;
    // 刷新用户信息
    userStore.getUserInfo();
  };
</script>

<style scoped lang="less">
  .security-settings {
    padding: 24px 0;

    .setting-item {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 20px 24px;

      .setting-info {
        flex: 1;
        padding-right: 20px;

        .setting-title {
          font-size: 14px;
          font-weight: 600;
          color: #1d2129;
          margin-bottom: 8px;
        }

        .setting-desc {
          font-size: 13px;
          color: #86909c;
          line-height: 1.6;

          .highlight {
            color: #1d2129;
            font-weight: 500;
          }
        }
      }

      .setting-action {
        flex-shrink: 0;

        :deep(.arco-btn-text) {
          color: #165dff;
          font-size: 14px;

          &:hover {
            background-color: transparent;
            color: #4080ff;
          }

          &:disabled {
            color: #c9cdd4;
          }
        }
      }
    }

    :deep(.arco-divider) {
      margin: 0;
      border-color: #f2f3f5;
    }
  }
</style>
