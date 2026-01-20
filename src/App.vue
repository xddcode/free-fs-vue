<template>
  <a-config-provider>
    <router-view v-slot="{ Component, route }">
      <keep-alive>
        <component :is="Component" :key="route.path" />
      </keep-alive>
    </router-view>
    <global-setting />
    <global-loading />
  </a-config-provider>
</template>

<script lang="ts" setup>
  import { onMounted, onUnmounted, watch } from 'vue';
  import GlobalSetting from '@/components/global-setting/index.vue';
  import GlobalLoading from '@/components/global-loading/index.vue';
  import { sseService } from '@/services/sse.service';
  import { useUserStore, useTransferStore } from '@/store';

  const userStore = useUserStore();
  const transferStore = useTransferStore();

  onMounted(() => {
    const initialLoading = document.getElementById('initial-loading');
    if (initialLoading) {
      initialLoading.style.opacity = '0';
      initialLoading.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        initialLoading.remove();
      }, 300);
    }

    if (userStore.id) {
      transferStore.initSSE(userStore.id);
    }
  });

  watch(
    () => userStore.id,
    (newUserId, oldUserId) => {
      if (newUserId && !oldUserId) {
        transferStore.initSSE(newUserId);
      } else if (!newUserId && oldUserId) {
        transferStore.disconnectSSE();
      }
    }
  );

  onUnmounted(() => {
    sseService.disconnect();
  });
</script>
