<template>
  <div class="navbar">
    <div class="left-side">
      <a-space :size="16">
        <img
          alt="logo"
          :src="logoSvg"
          style="width: 48px; height: 48px; cursor: pointer"
          @click="$router.push({ name: 'files' })"
        />
        <icon-menu-fold
          v-if="appStore.device === 'mobile'"
          style="font-size: 22px; cursor: pointer"
          @click="toggleDrawerMenu"
        />
      </a-space>
    </div>
    <div class="center-side"></div>
    <ul class="right-side">
      <li>
        <a-tooltip
          :content="
            theme === 'light' ? '点击切换为暗黑模式' : '点击切换为亮色模式'
          "
        >
          <a-button
            :shape="'circle'"
            class="nav-btn"
            type="outline"
            @click="handleToggleTheme"
          >
            <template #icon>
              <icon-moon-fill v-if="theme === 'dark'" />
              <icon-sun-fill v-else />
            </template>
          </a-button>
        </a-tooltip>
      </li>
      <li>
        <a-tooltip
          :content="isFullscreen ? '点击退出全屏模式' : '点击切换为全屏模式'"
        >
          <a-button
            :shape="'circle'"
            class="nav-btn"
            type="outline"
            @click="toggleFullScreen"
          >
            <template #icon>
              <icon-fullscreen-exit v-if="isFullscreen" />
              <icon-fullscreen v-else />
            </template>
          </a-button>
        </a-tooltip>
      </li>
      <li>
        <a-tooltip :content="colorWeak ? '关闭色弱模式' : '开启色弱模式'">
          <a-button
            :shape="'circle'"
            class="nav-btn"
            type="outline"
            @click="handleToggleColorWeak"
          >
            <template #icon>
              <icon-eye v-if="colorWeak" />
              <icon-eye-invisible v-else />
            </template>
          </a-button>
        </a-tooltip>
      </li>
      <li>
        <a-dropdown
          trigger="hover"
          position="br"
          @select="handleSelectPlatform"
        >
          <div class="storage-platform-selector">
            <a-avatar
              v-if="storageStore.currentPlatform?.platformIcon"
              :size="28"
              :style="{
                backgroundColor: 'rgb(var(--primary-6))',
              }"
            >
              <icon-font
                :size="16"
                :type="storageStore.currentPlatform.platformIcon"
              />
            </a-avatar>
            <icon-storage v-else class="storage-icon" />
            <div class="storage-info">
              <div class="storage-label">当前存储</div>
              <div class="storage-name">
                <a-spin
                  v-if="platformSwitching"
                  :size="12"
                  style="margin-right: 4px"
                />
                {{ storageStore.currentPlatform?.platformName || '未选择' }}
              </div>
            </div>
            <icon-down class="dropdown-icon" />
          </div>
          <template #content>
            <a-doption v-if="!storageStore.hasActivePlatform" disabled value="">
              <div class="platform-option-empty">
                <icon-exclamation-circle />
                <span>暂无可用存储平台</span>
              </div>
            </a-doption>
            <a-doption
              v-for="platform in storageStore.activePlatforms"
              :key="platform.settingId"
              :value="platform.settingId"
              :disabled="
                platform.settingId === storageStore.currentSettingId
              "
              :class="{
                'platform-option-active':
                  platform.settingId ===
                  storageStore.currentSettingId,
              }"
            >
              <div class="platform-option">
                <a-avatar
                  v-if="platform.platformIcon"
                  :size="32"
                  :style="{
                    backgroundColor:
                      platform.settingId ===
                      storageStore.currentSettingId
                        ? 'rgb(var(--primary-6))'
                        : 'var(--color-fill-3)',
                  }"
                >
                  <icon-font :size="18" :type="platform.platformIcon" />
                </a-avatar>
                <span
                  class="platform-name"
                  :class="{
                    'platform-name-active':
                      platform.settingId ===
                      storageStore.currentSettingId,
                  }"
                  >{{ platform.platformName }}</span
                >
              </div>
            </a-doption>
          </template>
        </a-dropdown>
      </li>
      <li>
        <a-dropdown trigger="click">
          <a-avatar
            :size="32"
            :style="{ marginRight: '8px', cursor: 'pointer' }"
          >
            <img :src="avatar" alt="avatar" />
          </a-avatar>
          <template #content>
            <a-doption>
              <a-space @click="$router.push({ name: 'profile' })">
                <icon-user />
                <span> 用户中心 </span>
              </a-space>
            </a-doption>
            <a-doption>
              <a-space @click="openGitee">
                <icon-gitlab />
                <span> Gitee </span>
              </a-space>
            </a-doption>
            <a-doption>
              <a-space @click="openGithub">
                <icon-github />
                <span> Github </span>
              </a-space>
            </a-doption>
            <a-doption>
              <a-space @click="openIss">
                <icon-bulb />
                <span> 问题 & 帮助 </span>
              </a-space>
            </a-doption>
            <a-doption>
              <a-space @click="handleLogout">
                <icon-export />
                <span> 退出 </span>
              </a-space>
            </a-doption>
          </template>
        </a-dropdown>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
  import { computed, inject, onMounted, ref } from 'vue';
  import { useDark, useFullscreen, useToggle } from '@vueuse/core';
  import { useAppStore, useUserStore, useStorageStore } from '@/store';
  import { Icon, Message } from '@arco-design/web-vue';
  import {
    IconStorage,
    IconDown,
    IconExclamationCircle,
  } from '@arco-design/web-vue/es/icon';
  import useUser from '@/hooks/user';
  import logoSvg from '@/assets/logo.svg?url';

  const IconFont = Icon.addFromIconFontCn({
    src: 'https://at.alicdn.com/t/c/font_4759634_ieftb3g6nn.js',
  });

  const appStore = useAppStore();
  const userStore = useUserStore();
  const storageStore = useStorageStore();
  const { logout } = useUser();
  const { isFullscreen, toggle: toggleFullScreen } = useFullscreen();
  const platformSwitching = ref(false);
  const avatar = computed(() => {
    return userStore.avatar;
  });
  const theme = computed(() => {
    return appStore.theme;
  });
  const colorWeak = computed(() => {
    return appStore.colorWeak;
  });
  const isDark = useDark({
    selector: 'body',
    attribute: 'arco-theme',
    valueDark: 'dark',
    valueLight: 'light',
    storageKey: 'arco-theme',
    onChanged(dark: boolean) {
      // overridden default behavior
      appStore.toggleTheme(dark);
    },
  });
  const toggleTheme = useToggle(isDark);
  const handleToggleTheme = () => {
    toggleTheme();
  };

  const handleToggleColorWeak = () => {
    const newValue = !appStore.colorWeak;
    document.body.style.filter = newValue ? 'invert(80%)' : 'none';
    appStore.updateSettings({ colorWeak: newValue });
  };

  const handleLogout = () => {
    logout();
  };

  const openGithub = () => {
    window.open('https://github.com/xddcode/free-fs', '_blank');
  };

  const openGitee = () => {
    window.open('https://gitee.com/xddcode/free-fs', '_blank');
  };

  const openIss = () => {
    window.open('https://gitee.com/xddcode/free-fs/issues', '_blank');
  };

  const handleSelectPlatform = async (settingId: string | number | Record<string, any> | undefined) => {
    // 确保settingId是字符串类型
    if (typeof settingId !== 'string') return;
    const platform = storageStore.activePlatforms.find(
      (p) => p.settingId === settingId
    );
    if (!platform) return;

    // 防止重复点击
    if (platformSwitching.value) return;

    // 如果已经是当前平台，直接返回
    if (storageStore.currentPlatform?.settingId === settingId) {
      return;
    }

    // 立即显示 loading 状态
    platformSwitching.value = true;

    // 显示加载提示
    const loadingMsg = Message.loading({
      content: `正在切换到 ${platform.platformName}...`,
      duration: 0, // 持续显示直到手动关闭
    });

    try {
      // 前端切换存储平台，添加短暂延迟以提供更好的用户体验
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 300);
      });

      // 切换成功：保存新平台
      storageStore.setCurrentPlatform(platform);

      // 关闭 loading，显示成功提示
      loadingMsg.close();
      Message.success({
        content: `已切换到 ${platform.platformName}`,
        duration: 1500,
      });

      // 延迟后刷新页面，让用户看到成功提示
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      // 切换失败：恢复原状态
      platformSwitching.value = false;
      loadingMsg.close();
      Message.error({
        content: `切换到 ${platform.platformName} 失败，请重试`,
        duration: 3000,
      });
    }
  };

  const toggleDrawerMenu = inject('toggleDrawerMenu', () => {
    // 默认实现：在没有提供 inject 时的空函数
  }) as () => void;

  // 初始化加载存储平台列表
  onMounted(async () => {
    // 先恢复之前选择的平台
    storageStore.restoreCurrentPlatform();
    // 然后获取最新的平台列表
    await storageStore.fetchActivePlatforms();
  });
</script>

<style lang="less" scoped>
  .navbar {
    display: flex;
    justify-content: space-between;
    height: 100%;
    background-color: var(--color-bg-2);
    border-bottom: 1px solid var(--color-border);
  }

  .left-side {
    display: flex;
    align-items: center;
    padding-left: 20px;
  }

  .center-side {
    flex: 1;
  }

  .right-side {
    display: flex;
    padding-right: 20px;
    list-style: none;

    :deep(.locale-select) {
      border-radius: 20px;
    }

    li {
      display: flex;
      align-items: center;
      padding: 0 10px;
    }

    a {
      color: var(--color-text-1);
      text-decoration: none;
    }

    .nav-btn {
      border-color: rgb(var(--gray-2));
      color: rgb(var(--gray-8));
      font-size: 16px;
    }

    .storage-platform-selector {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      height: 100%;
      cursor: pointer;
      transition: all 0.3s;
      border-radius: 4px;

      &:hover {
        background-color: var(--color-fill-2);
      }

      .storage-icon {
        font-size: 20px;
        color: rgb(var(--primary-6));
      }

      .storage-info {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        min-width: 100px;

        .storage-label {
          font-size: 12px;
          color: var(--color-text-3);
          line-height: 1.2;
        }

        .storage-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-1);
          line-height: 1.4;
          display: flex;
          align-items: center;
        }
      }

      .dropdown-icon {
        font-size: 12px;
        color: var(--color-text-3);
        transition: transform 0.3s;
      }
    }

    .platform-option {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 16px 20px;
      min-width: 280px;

      .platform-name {
        flex: 1;
        font-size: 15px;
        font-weight: 500;
        line-height: 1.5;
        transition: all 0.3s;

        &.platform-name-active {
          color: rgb(var(--primary-6));
          font-weight: 600;
        }
      }

      :deep(.arco-avatar) {
        flex-shrink: 0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        transition: all 0.3s;
      }
    }

    // 当前选中平台的样式
    :deep(.platform-option-active) {
      background: linear-gradient(
        90deg,
        rgba(var(--primary-6), 0.08) 0%,
        rgba(var(--primary-6), 0.02) 100%
      );
      border-left: 4px solid rgb(var(--primary-6));

      .platform-option {
        // 补偿左边框宽度，保持对齐
        padding-left: 16px;
        padding-right: 20px;
        padding-top: 16px;
        padding-bottom: 16px;
      }
    }

    .platform-option-empty {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      color: var(--color-text-3);
      min-width: 280px;

      svg {
        font-size: 20px;
      }

      span {
        font-size: 14px;
      }
    }

    // 优化下拉菜单样式
    :deep(.arco-dropdown) {
      .arco-dropdown-list {
        padding: 8px 0;
        min-width: 280px;
      }
    }

    :deep(.arco-dropdown-option) {
      transition: all 0.2s;
      margin: 4px 0;

      &:hover:not(.arco-dropdown-option-disabled) {
        background-color: var(--color-fill-2);
      }

      &.arco-dropdown-option-disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }
    }

    .trigger-btn,
    .ref-btn {
      position: absolute;
      bottom: 14px;
    }

    .trigger-btn {
      margin-left: 14px;
    }
  }
</style>

<style lang="less">
  .message-popover {
    .arco-popover-content {
      margin-top: 0;
    }
  }
</style>
