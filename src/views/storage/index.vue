<template>
  <div class="container">
    <a-row :gutter="20">
      <a-col :span="24">
        <!-- 页面头部 -->
        <div class="page-header">
          <div class="page-header-left">
            <icon-storage class="page-icon" />
            <div class="page-info">
              <h2 class="page-title">存储平台管理</h2>
              <p class="page-desc"
                >配置和管理您的对象存储平台，支持 MinIO、阿里云 OSS、腾讯云 COS
                等</p
              >
            </div>
          </div>
          <a-button type="outline" @click="handleRefresh">
            <template #icon>
              <icon-refresh />
            </template>
            刷新
          </a-button>
        </div>

        <!-- 统计信息 -->
        <a-row :gutter="16" class="stats-row">
          <a-col :span="8">
            <a-card class="stat-card" :bordered="false">
              <a-statistic
                title="已配置平台"
                :value="userSettings.length"
                show-group-separator
              >
                <template #suffix>
                  <span class="stat-unit">个</span>
                </template>
              </a-statistic>
            </a-card>
          </a-col>
          <a-col :span="8">
            <a-card class="stat-card" :bordered="false">
              <a-statistic
                title="启用中"
                :value="enabledCount"
                show-group-separator
              >
                <template #suffix>
                  <span class="stat-unit">个</span>
                </template>
              </a-statistic>
            </a-card>
          </a-col>
          <a-col :span="8">
            <a-card class="stat-card" :bordered="false">
              <a-statistic
                title="支持的平台"
                :value="platformsCount"
                show-group-separator
              >
                <template #suffix>
                  <span class="stat-unit">种</span>
                </template>
              </a-statistic>
            </a-card>
          </a-col>
        </a-row>

        <!-- 主内容卡片 -->
        <a-card class="general-card storage-content-card" :bordered="false">
          <template #title>
            <div class="card-header">
              <span>我的存储配置</span>
              <a-tag
                v-if="userSettings.length === 0"
                color="orangered"
                size="small"
              >
                <template #icon>
                  <icon-exclamation-circle />
                </template>
                未配置
              </a-tag>
            </div>
          </template>

          <!-- 卡片列表 -->
          <LoadingSpinner :loading="loading" :size="120" tip="加载中...">
            <div>
              <!-- 空状态提示 -->
              <a-alert
                v-if="userSettings.length === 0"
                type="info"
                closable
                class="empty-tip"
              >
                <template #icon>
                  <icon-info-circle />
                </template>
                您还没有配置任何存储平台，点击下方卡片开始添加您的第一个存储配置
              </a-alert>

              <a-row :gutter="[16, 16]" class="list-row">
                <!-- 添加配置卡片 -->
                <a-col
                  :xs="24"
                  :sm="12"
                  :md="8"
                  :lg="6"
                  :xl="4"
                  class="list-col"
                >
                  <AddConfigCard @click="handleAddConfig" />
                </a-col>
                <!-- 用户已配置的存储平台卡片 -->
                <a-col
                  v-for="setting in userSettings"
                  :key="setting.id"
                  :xs="24"
                  :sm="12"
                  :md="8"
                  :lg="6"
                  :xl="4"
                  class="list-col"
                >
                  <StorageSettingCard :setting="setting" @refresh="fetchData" />
                </a-col>
              </a-row>
            </div>
          </LoadingSpinner>
        </a-card>

        <!-- 帮助信息 -->
        <a-card class="help-card" :bordered="false">
          <template #title>
            <icon-question-circle style="margin-right: 8px" />
            <span>使用指南</span>
          </template>
          <a-space direction="vertical" :size="12" fill>
            <div class="help-item">
              <icon-check-circle class="help-icon" />
              <span
                >支持配置多个存储平台，如 MinIO、阿里云 OSS、腾讯云 COS 等</span
              >
            </div>
            <div class="help-item">
              <icon-check-circle class="help-icon" />
              <span
                >在此页面启用某个配置即可切换到该存储平台（同时只能有一个配置启用）</span
              >
            </div>
            <div class="help-item">
              <icon-check-circle class="help-icon" />
              <span
                >右上角显示当前启用的存储平台，点击切换按钮可快速返回本页面</span
              >
            </div>
          </a-space>
        </a-card>
      </a-col>
    </a-row>

    <!-- 添加配置弹窗 -->
    <AddStorageConfigModal
      v-model:visible="addModalVisible"
      @success="handleAddSuccess"
    />
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed } from 'vue';
  import { LoadingSpinner } from '@/components';
  import {
    IconRefresh,
    IconStorage,
    IconInfoCircle,
    IconExclamationCircle,
    IconQuestionCircle,
    IconCheckCircle,
  } from '@arco-design/web-vue/es/icon';
  import { getUserStorageSettings, getStoragePlatforms } from '@/api/storage';
  import type { StorageSetting } from '@/types/modules/storage';
  import StorageSettingCard from './components/storage-setting-card.vue';
  import AddStorageConfigModal from './components/add-storage-config-modal.vue';
  import AddConfigCard from './components/add-config-card.vue';

  const loading = ref(false);
  const userSettings = ref<StorageSetting[]>([]);
  const addModalVisible = ref(false);
  const platformsCount = ref(0);

  // 计算启用的数量
  const enabledCount = computed(() => {
    return userSettings.value.filter((s) => s.enabled).length;
  });

  const fetchData = async () => {
    loading.value = true;
    try {
      const { data } = await getUserStorageSettings();
      userSettings.value = data;
    } catch (error) {
      userSettings.value = [];
    } finally {
      loading.value = false;
    }
  };

  const fetchPlatformsCount = async () => {
    try {
      const { data } = await getStoragePlatforms();
      platformsCount.value = data.length;
    } catch (error) {
      platformsCount.value = 0;
    }
  };

  fetchData();
  fetchPlatformsCount();

  const handleAddConfig = () => {
    addModalVisible.value = true;
  };

  const handleAddSuccess = () => {
    fetchData();
  };

  const handleRefresh = () => {
    fetchData();
    fetchPlatformsCount();
  };
</script>

<script lang="ts">
  export default {
    name: 'Storage',
  };
</script>

<style lang="less" scoped>
  .container {
    padding: 20px;
    background: transparent;
    min-height: 100%;

    // 页面头部
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding: 16px 0;

      .page-header-left {
        display: flex;
        align-items: center;
        gap: 16px;

        .page-icon {
          font-size: 32px;
          color: rgb(var(--primary-6));
        }

        .page-info {
          .page-title {
            margin: 0 0 4px 0;
            font-size: 20px;
            font-weight: 600;
            color: var(--color-text-1);
          }

          .page-desc {
            margin: 0;
            font-size: 14px;
            color: var(--color-text-3);
          }
        }
      }
    }

    // 统计卡片
    .stats-row {
      margin-bottom: 20px;

      .stat-card {
        background: linear-gradient(
          135deg,
          rgb(var(--primary-1)) 0%,
          rgb(var(--primary-2)) 100%
        );
        border-radius: 8px;

        :deep(.arco-statistic-title) {
          font-size: 14px;
          color: var(--color-text-2);
        }

        :deep(.arco-statistic-value) {
          font-size: 28px;
          font-weight: 600;
          color: rgb(var(--primary-6));
        }

        .stat-unit {
          font-size: 14px;
          color: var(--color-text-3);
          margin-left: 4px;
        }
      }
    }

    // 主内容卡片
    .storage-content-card {
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
      }

      .empty-tip {
        margin-bottom: 20px;
      }

      .loading-wrap {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 300px;
      }

      .list-row {
        .list-col {
          display: flex;
          height: 280px;
        }
      }
    }

    // 帮助卡片
    .help-card {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      background: linear-gradient(
        135deg,
        rgba(var(--primary-1), 0.3) 0%,
        rgba(var(--primary-2), 0.3) 100%
      );

      .help-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: var(--color-text-2);

        .help-icon {
          color: rgb(var(--success-6));
          font-size: 16px;
        }
      }
    }
  }
</style>
