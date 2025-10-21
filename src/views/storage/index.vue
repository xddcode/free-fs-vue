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
            <a-space>
              <a-input-search
                v-model="searchKeyword"
                allow-clear
                placeholder="搜索存储平台..."
                style="width: 260px"
                @search="handleSearch"
                @clear="handleClear"
              />
              <a-button type="outline" @click="handleRefresh">
                <template #icon>
                  <icon-refresh />
                </template>
                刷新
              </a-button>
            </a-space>
          </template>

          <div v-if="loading && renderData.length === 0" class="loading-wrap">
            <a-spin :size="40" tip="加载中..." />
          </div>

          <div v-else-if="renderData.length > 0" class="list-wrap">
            <a-row :gutter="[16, 16]" class="list-row">
              <!-- 存储平台卡片 -->
              <a-col
                v-for="item in renderData"
                :key="item.id"
                :span="4"
                class="list-col"
              >
                <CardWrap :item-data="item" @refresh="fetchData" />
              </a-col>
            </a-row>
          </div>

          <div v-else class="empty-wrap">
            <a-empty description="暂无存储平台数据">
              <template #image>
                <icon-cloud-download
                  :style="{ fontSize: '64px', color: 'var(--color-text-4)' }"
                />
              </template>
            </a-empty>
          </div>
        </a-card>
      </a-col>
    </a-row>
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
    getStoragePlatforms,
    type StoragePlatformRecord,
  } from '@/api/storage';
  import CardWrap from './components/card-wrap.vue';

  const searchKeyword = ref('');
  const loading = ref(false);
  const renderData = ref<StoragePlatformRecord[]>([]);

  const fetchData = async (keywords?: string) => {
    loading.value = true;
    try {
      const { data } = await getStoragePlatforms(keywords);
      renderData.value = data;
    } catch (error) {
      // 拦截器已处理错误提示
      renderData.value = [];
    } finally {
      loading.value = false;
    }
  };

  fetchData();

  const handleSearch = (value: string) => {
    fetchData(value);
  };

  const handleClear = () => {
    searchKeyword.value = '';
    fetchData();
  };

  const handleRefresh = () => {
    searchKeyword.value = '';
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
