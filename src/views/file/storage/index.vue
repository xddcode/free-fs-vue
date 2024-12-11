<template>
  <div class="container">
    <Breadcrumb :items="['文件中心', '存储平台']" />
    <a-row :gutter="20" align="stretch">
      <a-col :span="24">
        <a-card class="general-card" title="存储平台">
          <template #extra>
            <a-input-search allow-clear placeholder="搜索" @search="search" />
          </template>
          <a-row justify="space-between">
            <a-col :span="24">
              <div v-if="renderData.length > 0" class="list-wrap">
                <a-row class="list-row" :gutter="24">
                  <a-col
                    v-for="item in renderData"
                    :key="item.id"
                    :xs="12"
                    :sm="12"
                    :md="12"
                    :lg="6"
                    :xl="6"
                    :xxl="6"
                    class="list-col"
                    style="min-height: 162px"
                  >
                    <CardWrap
                      :loading="loading"
                      :item-data="item"
                      @refresh="fetchData"
                    >
                      <template #skeleton>
                        <a-skeleton :animation="true">
                          <a-skeleton-line
                            :widths="['100%', '40%', '100%']"
                            :rows="3"
                          />
                          <a-skeleton-line :widths="['40%']" :rows="1" />
                        </a-skeleton>
                      </template>
                    </CardWrap>
                  </a-col>
                </a-row>
              </div>
              <a-empty v-else />
            </a-col>
          </a-row>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { getStoragePlatforms } from '@/api/storage';
  import { StoragePlatformRecord } from '@/types/modules/storage';
  import CardWrap from './components/card-wrap.vue';

  const type = ref(1);

  const loading = ref(true);
  const renderData = ref<StoragePlatformRecord[]>([]);

  const fetchData = async (keywords?: string) => {
    try {
      const { data } = await getStoragePlatforms(type.value, keywords);
      renderData.value = data;
    } finally {
      loading.value = false;
    }
  };

  fetchData();

  const search = (value: string) => {
    fetchData(value);
  };
</script>

<script lang="ts">
  export default {
    name: 'Storage',
  };
</script>

<style scoped lang="less">
  .container {
    padding: 0 20px 20px 20px;

    :deep(.arco-list-content) {
      overflow-x: hidden;
    }

    :deep(.arco-card-meta-title) {
      font-size: 14px;
    }
  }

  :deep(.arco-list-col) {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  :deep(.arco-list-item) {
    width: 33%;
  }

  :deep(.block-title) {
    margin: 0 0 12px 0;
    font-size: 14px;
  }

  :deep(.list-wrap) {
    // min-height: 140px;
    .list-row {
      align-items: stretch;

      .list-col {
        margin-bottom: 16px;
      }
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
