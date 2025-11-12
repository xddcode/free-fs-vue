<script setup lang="ts">
  import { onMounted, onUnmounted, ref, watch } from 'vue';
  import Player from 'xgplayer';
  import MusicPreset, { Analyze } from 'xgplayer-music';

  import 'xgplayer/dist/index.min.css';
  import 'xgplayer-music/dist/index.min.css';

  interface Props {
    url: string;
    name: string;
  }
  const props = defineProps<Props>();

  const playerContainer = ref<HTMLElement | null>(null);
  const canvasEl = ref<HTMLCanvasElement | null>(null);

  let playerInstance: Player | null = null;
  let analyzeInstance: any = null; // 频谱分析器实例

  const initPlayer = (): void => {
    // 4. 确保两个 DOM 元素都准备好了
    if (!playerContainer.value || !canvasEl.value || !props.url) {
      console.warn('AudioPlayer: DOM not ready or URL is empty.');
      return;
    }

    // 5. 安全销毁旧实例
    if (playerInstance) {
      try {
        playerInstance.destroy();
      } catch (e) {
        /* (ignoring error) */
      }
      playerInstance = null;
      analyzeInstance = null;
    }

    try {
      // 6. 动态设置 canvas 宽高，使其充满容器
      canvasEl.value.width = canvasEl.value.offsetWidth;
      canvasEl.value.height = canvasEl.value.offsetHeight;

      playerInstance = new Player({
        el: playerContainer.value,
        presets: ['default', MusicPreset],
        music: {
          list: [
            {
              src: props.url,
              title: props.name,
              vid: props.url, // 使用 url 作为唯一 vid
            },
          ],
        },

        crossOrigin: 'anonymous',

        // 基础配置
        mediaType: 'audio',
        height: 50,
        width: '100%',
        volume: 0.8,
        ignores: ['playbackrate'],
        controls: { initShow: true, mode: 'flex' },
        marginControls: true,
      });

      playerInstance.crossOrigin = 'anonymous';

      analyzeInstance = new Analyze(playerInstance, canvasEl.value, {
        bgColor: 'rgba(0, 0, 0, 0)', // 透明背景
        stroke: 3,
        mode: 'bars', // 'bars' (柱状) 或 'waves' (波浪)
      });
    } catch (error) {
      console.error('Failed to initialize XgPlayer with MusicPreset:', error);
      playerInstance = null;
    }
  };

  onMounted(() => {
    requestAnimationFrame(() => {
      initPlayer();
    });
  });

  onUnmounted(() => {
    if (playerInstance && typeof playerInstance.destroy === 'function') {
      playerInstance.destroy();
    }
    playerInstance = null;
    analyzeInstance = null;
  });

  watch(
    () => props.url,
    (newUrl, oldUrl) => {
      // 避免在 onMounted 之前运行
      if (oldUrl === undefined) return;
      if (newUrl) {
        console.log('AudioPlayer URL changed, re-initializing.');
        initPlayer(); // 总是重新初始化
      }
    }
  );
</script>

<template>
  <div class="audio-player-wrapper">
    <canvas ref="canvasEl" class="audio-canvas"></canvas>

    <div ref="playerContainer" class="player-container" />
  </div>
</template>

<style scoped lang="less">
  .audio-player-wrapper {
    width: 100%;
    height: 100%;

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    padding: 20px;
  }

  /* 频谱画布的样式*/
  .audio-canvas {
    width: 100%;
    height: 260px; // 给频谱一个固定的高度
    margin-bottom: 20px; // 和播放器拉开一点距离
  }

  /* 播放器控件的容器 */
  .player-container {
    width: 100%;
    // 播放器自己有 height: 50px, 我们只需要给个最小高度
    min-height: 50px;
  }
</style>
