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
        <CardWrap :loading="loading" :item-data="item">
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

  const props = defineProps({
    type: {
      type: Number,
      default: 1,
    },
  });

  const loading = ref(true);
  const renderData = ref<StoragePlatformRecord[]>([]);

  const fetchData = async () => {
    try {
      const { data } = await getStoragePlatforms(props.type);
      renderData.value = data;
    } finally {
      loading.value = false;
    }
  };

  fetchData();
</script>

<style scoped lang="less"></style>
