<template>
  <div class="container">
    <a-row :gutter="20" align="stretch">
      <a-col :span="24">
        <a-card class="general-card storage-header-card">
          <template #title>
            <div class="header-title">
              <icon-storage style="margin-right: 8px" />
              <span>存储平台管理</span>
            </div>
          </template>
          <template #extra>
            <a-button type="outline" @click="handleRefresh">
              <template #icon>
                <icon-refresh />
              </template>
              刷新
            </a-button>
          </template>

          <div v-if="loading && userSettings.length === 0" class="loading-wrap">
            <a-spin :size="40" tip="加载中..." />
          </div>

          <div v-else-if="userSettings.length > 0" class="list-wrap">
            <a-row :gutter="[16, 16]" class="list-row">
              <!-- 添加配置卡片 -->
              <a-col :span="4" class="list-col">
                <AddConfigCard @click="handleAddConfig" />
              </a-col>
              <!-- 用户已配置的存储平台卡片 -->
              <a-col
                v-for="setting in userSettings"
                :key="setting.id"
                :span="4"
                class="list-col"
              >
                <StorageSettingCard :setting="setting" @refresh="fetchData" />
              </a-col>
            </a-row>
          </div>

          <div v-else class="empty-wrap">
            <a-empty description="暂无存储平台配置">
              <template #image>
                <icon-cloud-download
                  :style="{ fontSize: '64px', color: 'var(--color-text-4)' }"
                />
              </template>
              <template #extra>
                <AddConfigCard @click="handleAddConfig" />
              </template>
            </a-empty>
          </div>
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
  import { ref } from 'vue';
  import {
    IconRefresh,
    IconStorage,
    IconCloudDownload,
  } from '@arco-design/web-vue/es/icon';
  import {
    getUserStorageSettings,
    type StorageSettingUserVO,
  } from '@/api/storage';
  import StorageSettingCard from './components/storage-setting-card.vue';
  import AddStorageConfigModal from './components/add-storage-config-modal.vue';
  import AddConfigCard from './components/add-config-card.vue';

  const loading = ref(false);
  const userSettings = ref<StorageSettingUserVO[]>([]);
  const addModalVisible = ref(false);

  const fetchData = async () => {
    loading.value = true;
    try {
      const { data } = await getUserStorageSettings();
      userSettings.value = data;
    } catch (error) {
      // 拦截器已处理错误提示
      userSettings.value = [];
    } finally {
      loading.value = false;
    }
  };

  fetchData();

  const handleAddConfig = () => {
    addModalVisible.value = true;
  };

  const handleAddSuccess = () => {
    fetchData();
  };

  const handleRefresh = () => {
    fetchData();
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
    min-height: calc(100vh - 120px);

    .storage-header-card {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      .header-title {
        display: flex;
        align-items: center;
        font-size: 16px;
        font-weight: 600;
        color: var(--color-text-1);
      }
    }

    .loading-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }

    .list-wrap {
      min-height: 300px;

      .list-row {
        .list-col {
          display: flex;
          height: 280px;
          margin-bottom: 0;
        }
      }
    }

    .empty-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;

      :deep(.arco-empty) {
        .arco-empty-description {
          font-size: 14px;
          color: var(--color-text-3);
          margin-top: 16px;
        }
      }
    }

    :deep(.arco-card-meta-title) {
      font-size: 14px;
    }

    :deep(.arco-space) {
      width: 100%;

      .arco-space-item {
        &:last-child {
          flex: 1;
        }
      }
    }
  }
</style>
