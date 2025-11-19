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
        <div class="storage-platform-display">
          <a-avatar
            v-if="storageStore.currentPlatform?.platformIcon"
            :size="32"
            :style="{ backgroundColor: 'rgb(var(--primary-6))' }"
          >
            <icon-font
              :size="18"
              :type="storageStore.currentPlatform.platformIcon"
            />
          </a-avatar>
          <icon-storage v-else :size="32" class="storage-icon" />
          <div class="storage-info">
            <div class="storage-label">当前存储</div>
            <div class="storage-name">
              <span class="platform-main-name">{{
                truncateText(
                  storageStore.currentPlatform?.platformName || '未启用',
                  12
                )
              }}</span>
              <span
                v-if="storageStore.currentPlatform?.remark"
                class="platform-remark"
                :title="storageStore.currentPlatform.remark"
              >
                ({{ truncateText(storageStore.currentPlatform.remark, 8) }})
              </span>
            </div>
          </div>
          <a-tooltip content="切换存储平台">
            <a-button class="switch-btn" type="text" @click="handleGoToStorage">
              <template #icon>
                <icon-swap />
              </template>
            </a-button>
          </a-tooltip>
        </div>
      </li>
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
        <a-dropdown trigger="hover" position="bl">
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
  import { computed, inject, onMounted } from 'vue';
  import { useDark, useFullscreen, useToggle } from '@vueuse/core';
  import { useAppStore, useUserStore, useStorageStore } from '@/store';
  import { Icon } from '@arco-design/web-vue';
  import { IconStorage, IconSwap } from '@arco-design/web-vue/es/icon';
  import { useRouter } from 'vue-router';
  import useUser from '@/hooks/user';
  import logoSvg from '@/assets/logo.png';

  const IconFont = Icon.addFromIconFontCn({
    src: 'https://at.alicdn.com/t/c/font_4759634_ieftb3g6nn.js',
  });

  const appStore = useAppStore();
  const userStore = useUserStore();
  const storageStore = useStorageStore();
  const router = useRouter();
  const { logout } = useUser();
  const { isFullscreen, toggle: toggleFullScreen } = useFullscreen();

  const avatar = computed(() => userStore.avatar);
  const theme = computed(() => appStore.theme);
  const colorWeak = computed(() => appStore.colorWeak);

  const isDark = useDark({
    selector: 'body',
    attribute: 'arco-theme',
    valueDark: 'dark',
    valueLight: 'light',
    storageKey: 'arco-theme',
    onChanged(dark: boolean) {
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

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const handleGoToStorage = () => {
    router.push({ name: 'storage' });
  };

  const toggleDrawerMenu = inject('toggleDrawerMenu', () => {}) as () => void;

  onMounted(async () => {
    // 先从 localStorage 恢复，避免闪烁
    storageStore.restoreCurrentPlatform();
    // 然后从服务器获取最新数据
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

    .storage-platform-display {
      display: flex;
      align-items: center;
      gap: 12px;

      .storage-icon {
        color: rgb(var(--primary-6));
      }

      .storage-info {
        display: flex;
        flex-direction: column;
        max-width: 180px;

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
          gap: 4px;
          overflow: hidden;

          .platform-main-name {
            font-weight: 600;
            flex-shrink: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .platform-remark {
            font-size: 12px;
            font-weight: 400;
            color: var(--color-text-3);
            flex-shrink: 0;
          }
        }
      }

      .switch-btn {
        color: rgb(var(--primary-6));
        font-size: 18px;

        &:hover {
          color: rgb(var(--primary-5));
        }
      }
    }
  }
</style>
