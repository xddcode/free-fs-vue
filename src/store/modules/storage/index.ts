import { defineStore } from 'pinia';
import { getActiveStoragePlatforms } from '@/api/storage';
import type { ActiveStoragePlatform } from '@/types/modules/storage';

interface StorageState {
  currentPlatform: ActiveStoragePlatform | null;
  activePlatforms: ActiveStoragePlatform[];
}

const useStorageStore = defineStore('storage', {
  state: (): StorageState => ({
    currentPlatform: null,
    activePlatforms: [],
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

    // 是否有已启用的存储平台
    hasActivePlatform(state): boolean {
      return state.activePlatforms.some(
        (p: ActiveStoragePlatform) => p.isEnabled
      );
    },
  },

  actions: {
    // 获取已激活的存储平台列表
    async fetchActivePlatforms() {
      try {
        const { data } = await getActiveStoragePlatforms();
        this.activePlatforms = data;

        // 查找启用的平台（isEnabled: true）
        const enabledPlatform = data.find(
          (p: ActiveStoragePlatform) => p.isEnabled
        );

        // 设置当前平台
        if (enabledPlatform) {
          this.setCurrentPlatform(enabledPlatform);
        } else {
          // 没有启用的平台，清空当前平台
          this.setCurrentPlatform(null);
        }
      } catch (error) {
        this.activePlatforms = [];
        // 使用 setCurrentPlatform 确保 localStorage 也被清除
        this.setCurrentPlatform(null);
      }
    },

    // 设置当前使用的存储平台
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

    // 从 localStorage 恢复当前平台（应用启动时使用）
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
