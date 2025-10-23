<template>
  <div class="profile-container">
    <a-card class="profile-card" :bordered="false">
      <!-- 用户信息头部 -->
      <div class="profile-header">
        <div class="user-avatar">
          <a-avatar :size="80" class="avatar">
            <img v-if="userInfo.avatar" :src="userInfo.avatar" alt="头像" />
            <icon-user v-else />
          </a-avatar>
        </div>

        <div class="user-info">
          <h2 class="username">{{ userInfo.nickname || userInfo.username }}</h2>
          <div class="user-meta">
            <span class="account-id">账号ID：{{ userInfo.username }}</span>
            <a-divider direction="vertical" />
            <span class="email-info"
              >邮箱：{{ maskEmail(userInfo.email) }}</span
            >
            <a-divider direction="vertical" />
            <span class="register-time">
              注册时间：{{ formatDate(userInfo.createdAt) }}
            </span>
          </div>
        </div>

        <div class="user-status">
          <a-tag
            :color="(userInfo.status || 0) === 1 ? 'green' : 'red'"
            size="large"
          >
            {{ getUserStatusText(userInfo.status || 0) }}
          </a-tag>
        </div>
      </div>

      <!-- Tab标签页 -->
      <a-tabs
        v-model:active-key="activeTab"
        type="line"
        class="profile-tabs"
        :lazy-load="true"
      >
        <!-- 基础信息 -->
        <a-tab-pane key="basic" title="基础信息">
          <template #title>
            <span class="tab-title">
              <icon-user />
              基础信息
            </span>
          </template>
          <basic-info-form :user-info="userInfo" @success="handleInfoUpdate" />
        </a-tab-pane>

        <!-- 安全设置 -->
        <a-tab-pane key="security" title="安全设置">
          <template #title>
            <span class="tab-title">
              <icon-safe />
              安全设置
            </span>
          </template>
          <security-settings />
        </a-tab-pane>

        <!-- 安全日志 -->
        <a-tab-pane key="logs" title="安全日志">
          <template #title>
            <span class="tab-title">
              <icon-file />
              安全日志
            </span>
          </template>
          <security-logs />
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { IconUser, IconSafe, IconFile } from '@arco-design/web-vue/es/icon';
  import useUserStore from '@/store/modules/user';
  import BasicInfoForm from './components/basic-info-form.vue';
  import SecuritySettings from './components/security-settings.vue';
  import SecurityLogs from './components/security-logs.vue';

  const userStore = useUserStore();

  // 用户信息
  const userInfo = computed(() => userStore.userInfo);

  // 当前激活的标签页
  const activeTab = ref('basic');

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '2013-05-10 12:10:00';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // 获取用户状态文本
  const getUserStatusText = (status: number) => {
    return status === 1 ? '已认证' : '未认证';
  };

  // 邮箱隐私处理
  const maskEmail = (email?: string) => {
    if (!email) return '-';
    const [username, domain] = email.split('@');
    if (username.length <= 2) {
      return `${username[0]}***@${domain}`;
    }
    return `${username[0]}***${username[username.length - 1]}@${domain}`;
  };

  // 信息更新成功回调
  const handleInfoUpdate = () => {
    Message.success('信息更新成功');
  };
</script>

<style scoped lang="less">
  .profile-container {
    padding: 20px;
    min-height: 100vh;
    background-color: #f7f8fa;
  }

  .profile-card {
    max-width: 1200px;
    margin: 0 auto;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    overflow: hidden;
  }

  .profile-header {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 32px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    .user-avatar {
      flex-shrink: 0;

      .avatar {
        border: 4px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        background-color: rgba(255, 255, 255, 0.2);

        :deep(.arco-icon) {
          font-size: 40px;
          color: white;
        }
      }
    }

    .user-info {
      flex: 1;

      .username {
        margin: 0 0 12px 0;
        font-size: 28px;
        font-weight: 600;
        color: white;
      }

      .user-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: rgba(255, 255, 255, 0.9);

        .account-id,
        .phone-number,
        .register-time {
          display: flex;
          align-items: center;
        }

        :deep(.arco-divider) {
          border-color: rgba(255, 255, 255, 0.3);
          margin: 0 8px;
        }
      }
    }

    .user-status {
      flex-shrink: 0;

      :deep(.arco-tag) {
        padding: 8px 16px;
        font-size: 14px;
        font-weight: 600;
        border-radius: 20px;
      }
    }
  }

  .profile-tabs {
    :deep(.arco-tabs-nav) {
      padding: 0 32px;
      background-color: #fff;
    }

    :deep(.arco-tabs-nav-tab) {
      padding: 16px 0;
      font-size: 15px;
      font-weight: 500;
      color: #4e5969;

      &:hover {
        color: #165dff;
      }
    }

    :deep(.arco-tabs-nav-tab-active) {
      color: #165dff;
    }

    :deep(.arco-tabs-nav-ink) {
      height: 3px;
      border-radius: 2px;
    }

    :deep(.arco-tabs-content) {
      padding: 0;
    }

    .tab-title {
      display: flex;
      align-items: center;
      gap: 6px;

      :deep(.arco-icon) {
        font-size: 16px;
      }
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    .profile-container {
      padding: 12px;
    }

    .profile-header {
      flex-direction: column;
      align-items: flex-start;
      padding: 24px;

      .user-info {
        .username {
          font-size: 24px;
        }

        .user-meta {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;

          :deep(.arco-divider) {
            display: none;
          }
        }
      }

      .user-status {
        align-self: flex-start;
      }
    }

    .profile-tabs {
      :deep(.arco-tabs-nav) {
        padding: 0 16px;
      }
    }
  }
</style>
