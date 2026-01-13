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

  // 在应用挂载时初始化SSE和移除loading
  onMounted(() => {
    // 移除初始 loading
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

  // 监听用户登录状态变化
  watch(
    () => userStore.id,
    (newUserId, oldUserId) => {
      if (newUserId && !oldUserId) {
        // 用户刚登录
        transferStore.initSSE(newUserId);
      } else if (!newUserId && oldUserId) {
        // 用户登出
        transferStore.disconnectSSE();
      }
    }
  );

  // 在应用卸载时清理SSE
  onUnmounted(() => {
    sseService.disconnect();
  });
</script>
