<script setup lang="ts">
  import { onMounted, onUnmounted, ref, watch } from 'vue';
  import Player from 'xgplayer';
  import 'xgplayer/dist/index.min.css';

  interface Props {
    url: '';
  }
  const props = defineProps<Props>();

  const playerContainer = ref<HTMLElement | null>(null);

  let playerInstance: Player | null = null;
  const initPlayer = (): void => {
    if (playerContainer.value) {
      // 确保 URL 存在
      if (!props.url) {
        console.warn('XgPlayer: URL is empty');
        return;
      }

      // 销毁旧实例 (如果存在的话)
      if (playerInstance) {
        playerInstance.destroy();
      }

      // 创建新实例
      playerInstance = new Player({
        el: playerContainer.value,
        url: props.url,
        width: '100%',
        height: '100%',
        playbackRate: [0.5, 0.75, 1, 1.5, 2],
      });
    }
  };

  onMounted(() => {
    initPlayer();
  });

  onUnmounted(() => {
    if (playerInstance) {
      playerInstance.destroy();
      playerInstance = null;
    }
  });

  watch(
    () => props.url,
    (newUrl) => {
      if (playerInstance && newUrl) {
        playerInstance.src = newUrl;
      } else if (!playerInstance && newUrl) {
        initPlayer();
      }
    }
  );
</script>

<template>
  <div ref="playerContainer" class="player-container" />
</template>

<style scoped lang="less">
  .player-container {
    width: 100%;
    height: 100%;
    min-height: 300px; /* 你可以根据需要调整这个最小高度 */
  }
</style>
