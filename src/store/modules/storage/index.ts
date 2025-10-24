import { defineStore } from 'pinia';
import { Message } from '@arco-design/web-vue';
import { getActiveStoragePlatforms } from '@/api/storage';
import type { ActiveStoragePlatform } from '@/api/storage';

interface StorageState {
  currentPlatform: ActiveStoragePlatform | null;
  activePlatforms: ActiveStoragePlatform[];
  switching: boolean; // 是否正在切换中
}

const useStorageStore = defineStore('storage', {
  state: (): StorageState => ({
    currentPlatform: null,
    activePlatforms: [],
    switching: false,
  }),

  getters: {
    // 当前平台标识符
    currentIdentifier(state): string | null {
      return state.currentPlatform?.platformIdentifier || null;
    },

    // 当前配置ID
    currentSettingId(state): string | null {
      return state.currentPlatform?.settingId || null;
    },

    // 是否有可用的存储平台
    hasActivePlatform(state): boolean {
      return state.activePlatforms.length > 0;
    },
  },

  actions: {
    // 获取已激活的存储平台列表
    async fetchActivePlatforms() {
      try {
        const { data } = await getActiveStoragePlatforms();
        const oldPlatform = this.currentPlatform;
        this.activePlatforms = data;

        // 如果没有设置当前平台，自动选择第一个
        if (!this.currentPlatform && data.length > 0) {
          this.setCurrentPlatform(data[0]);
        }

        // 如果当前平台不在列表中（被禁用了），需要带过渡效果地切换
        if (
          this.currentPlatform &&
          !data.find(
            (p) =>
              p.settingId === this.currentPlatform?.settingId
          )
        ) {
          const newPlatform = data[0] || null;
          // 使用带过渡效果的切换
          await this.switchPlatformWithTransition(
            newPlatform,
            `${oldPlatform?.platformName} 已禁用`
          );
        }
      } catch (error) {
        this.activePlatforms = [];
        this.currentPlatform = null;
      }
    },

    // 设置当前使用的存储平台（无过渡效果）
    setCurrentPlatform(platform: ActiveStoragePlatform | null) {
      this.currentPlatform = platform;
      // 保存到 localStorage
      if (platform) {
        localStorage.setItem(
          'current-storage-platform',
          JSON.stringify(platform)
        );
      } else {
        localStorage.removeItem('current-storage-platform');
      }
    },

    // 带过渡效果的切换平台
    async switchPlatformWithTransition(
      platform: ActiveStoragePlatform | null,
      reason?: string
    ) {
      if (!platform) {
        this.currentPlatform = null;
        return;
      }

      // 设置切换中状态
      this.switching = true;

      // 显示加载提示
      const loadingMsg = Message.loading({
        content: reason
          ? `${reason}，正在切换到 ${platform.platformName}...`
          : `正在切换到 ${platform.platformName}...`,
        duration: 0,
      });

      try {
        // 前端切换延迟，提供更好的用户体验
        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 300);
        });

        // 切换成功：保存新平台
        this.setCurrentPlatform(platform);

        // 关闭 loading，显示成功提示
        loadingMsg.close();
        Message.success({
          content: `已切换到 ${platform.platformName}`,
          duration: 1500,
        });

        // 延迟后刷新页面
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } catch (error) {
        // 切换失败
        this.switching = false;
        loadingMsg.close();
        Message.error({
          content: `切换到 ${platform.platformName} 失败`,
          duration: 3000,
        });
      }
    },

    // 从 localStorage 恢复当前平台
    restoreCurrentPlatform() {
      const saved = localStorage.getItem('current-storage-platform');
      if (saved) {
        try {
          this.currentPlatform = JSON.parse(saved);
        } catch (error) {
          localStorage.removeItem('current-storage-platform');
        }
      }
    },

    // 清除当前平台
    clearCurrentPlatform() {
      this.currentPlatform = null;
      this.activePlatforms = [];
      localStorage.removeItem('current-storage-platform');
    },
  },
});

export default useStorageStore;
