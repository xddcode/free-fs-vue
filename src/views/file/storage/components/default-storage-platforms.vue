<template>
  <div class="list-wrap">
    <a-typography-title class="block-title" :heading="6">
      系统默认存储平台
    </a-typography-title>
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
          :title="item.name"
          :description="item.desc"
          :default-value="item.isEnabled"
          :action-type="item.actionType"
          :expires="item.expires"
          open-txt="开通服务"
          close-txt="取消服务"
          expires-text="续约"
          tag-text="已开通"
          expires-tag-text="已过期"
          :icon="item.icon"
        >
          <template #skeleton>
            <a-skeleton :animation="true">
              <a-skeleton-line :widths="['100%', '40%', '100%']" :rows="3" />
              <a-skeleton-line :widths="['40%']" :rows="1" />
            </a-skeleton>
          </template>
        </CardWrap>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { getStoragePlatforms } from '@/api/storage';
  import { StoragePlatformRecord } from '@/types/modules/storage';
  import CardWrap from './card-wrap.vue';

  const loading = ref(true);
  const renderData = ref<StoragePlatformRecord[]>([]);

  const fetchData = async () => {
    try {
      const { data } = await getStoragePlatforms(1);
      renderData.value = data;
    } finally {
      loading.value = false;
    }
  };

  fetchData();
</script>

<style scoped lang="less"></style>
