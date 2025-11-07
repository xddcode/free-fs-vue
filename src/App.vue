<template>
  <a-config-provider>
    <router-view />
    <global-setting />
  </a-config-provider>
</template>

<script lang="ts" setup>
  import { onMounted, onUnmounted, watch } from 'vue';
  import GlobalSetting from '@/components/global-setting/index.vue';
  import transferWebSocketService from '@/services/transfer-websocket.service';
  import { useUserStore } from '@/store';

  const userStore = useUserStore();

  // 在应用挂载时初始化WebSocket
  onMounted(() => {
    if (userStore.id) {
      // eslint-disable-next-line no-console
      console.log('[App] 应用启动，初始化WebSocket');
      transferWebSocketService.connect();
    }
  });

  // 监听用户登录状态变化
  watch(
    () => userStore.id,
    (newUserId, oldUserId) => {
      if (newUserId && !oldUserId) {
        // 用户刚登录
        // eslint-disable-next-line no-console
        console.log('[App] 用户登录，初始化WebSocket');
        transferWebSocketService.connect();
      } else if (!newUserId && oldUserId) {
        // 用户登出
        // eslint-disable-next-line no-console
        console.log('[App] 用户登出，断开WebSocket');
        transferWebSocketService.disconnect();
      }
    }
  );

  // 在应用卸载时清理WebSocket
  onUnmounted(() => {
    // eslint-disable-next-line no-console
    console.log('[App] 应用卸载，断开WebSocket');
    transferWebSocketService.disconnect();
  });
</script>
