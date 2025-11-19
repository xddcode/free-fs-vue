<template>
  <a-layout class="default-layout">
    <!-- 侧边栏：包含 Logo、导航菜单、用户信息 -->
    <a-layout-sider class="main-sider" :width="100">
      <!-- Logo 区域 -->
      <div class="sider-logo" @click="$router.push('/')">
        <img :src="logoSvg" alt="Logo" />
      </div>

      <!-- 导航菜单 -->
      <div class="sider-menu">
        <div
          v-for="item in mainMenuItems"
          :key="item.key"
          :class="['menu-item', { active: activeMainMenu === item.key }]"
          @click="handleMainMenuClick(item)"
        >
          <div class="icon-wrapper">
            <component :is="item.icon" :size="26" />
          </div>
          <span class="menu-label">{{ item.label }}</span>
        </div>
      </div>

      <!-- 底部区域：存储切换 + 用户信息 -->
      <div class="sider-bottom">
        <!-- 存储平台切换 -->
        <div class="storage-switch-wrapper">
          <a-tooltip
            :content="`当前存储: ${
              storageStore.currentPlatform?.platformName || '本地存储'
            } (点击切换)`"
            position="right"
          >
            <div
              class="storage-btn"
              :class="{ active: route.name === 'storage' }"
              @click="handleGoToStorage"
            >
              <a-avatar
                v-if="storageStore.currentPlatform?.platformIcon"
                :size="36"
                class="platform-avatar"
              >
                <icon-font
                  :size="20"
                  :type="storageStore.currentPlatform.platformIcon"
                />
              </a-avatar>
              <a-avatar v-else :size="36" class="platform-avatar default">
                <ArcoIcons.IconStorage :size="20" />
              </a-avatar>
            </div>
          </a-tooltip>
        </div>

        <!-- 用户信息区域 -->
        <a-dropdown trigger="click" position="bl">
          <div class="user-avatar-wrapper">
            <a-avatar :size="44" class="user-avatar">
              <img :src="userAvatar" alt="avatar" />
            </a-avatar>
          </div>
          <template #content>
            <a-doption @click="goToProfile">
              <a-space>
                <ArcoIcons.IconUser />
                <span>个人中心</span>
              </a-space>
            </a-doption>
            <a-doption @click="goToProfile">
              <a-space>
                <ArcoIcons.IconSettings />
                <span>用户设置</span>
              </a-space>
            </a-doption>
            <a-divider style="margin: 4px 0" />
            <a-doption @click="handleToggleTheme">
              <a-space>
                <ArcoIcons.IconMoon v-if="theme === 'dark'" />
                <ArcoIcons.IconSun v-else />
                <span>{{ theme === 'dark' ? '亮色模式' : '暗黑模式' }}</span>
              </a-space>
            </a-doption>
            <a-doption @click="handleLogout">
              <a-space>
                <ArcoIcons.IconExport />
                <span>退出登录</span>
              </a-space>
            </a-doption>
          </template>
        </a-dropdown>
      </div>
    </a-layout-sider>

    <a-layout class="layout-content">
      <!-- 主内容区域 -->
      <a-layout-content class="main-content">
        <PageLayout />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script lang="ts" setup>
  import { computed, markRaw, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useDark, useToggle } from '@vueuse/core';
  import { Icon } from '@arco-design/web-vue';
  import * as ArcoIcons from '@arco-design/web-vue/es/icon';
  import { useUserStore, useAppStore, useStorageStore } from '@/store';
  import useUser from '@/hooks/user';
  import logoSvg from '@/assets/logo.png';
  import PageLayout from './page-layout.vue';

  // 注册 IconFont
  const IconFont = Icon.addFromIconFontCn({
    src: 'https://at.alicdn.com/t/c/font_4759634_ieftb3g6nn.js',
  });

  const route = useRoute();
  const router = useRouter();
  const userStore = useUserStore();
  const appStore = useAppStore();
  const storageStore = useStorageStore();
  const { logout } = useUser();

  const userAvatar = computed(() => userStore.avatar);
  const theme = computed(() => appStore.theme);

  // Theme Toggle Logic
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

  // 从 router 配置中获取主导航菜单
  const mainMenuItems = computed(() => {
    const rootRoute = router.getRoutes().find((r) => r.name === 'root');
    if (!rootRoute?.children) return [];

    return rootRoute.children
      .filter((child) => !child.meta?.hideInMenu) // 过滤掉不在菜单显示的路由
      .sort((a, b) => (a.meta?.order || 0) - (b.meta?.order || 0)) // 按 order 排序
      .map((child) => {
        const fullPath = child.path ? `/${child.path}` : '/';
        const iconName = child.meta?.icon as string;
        const IconComponent = iconName ? (ArcoIcons as any)[iconName] : null;

        return {
          key: child.name as string,
          label: child.meta?.title || '',
          icon: IconComponent ? markRaw(IconComponent) : null,
          path: fullPath,
        };
      });
  });

  // 当前激活的主菜单
  const activeMainMenu = computed(() => {
    return (route.name as string) || 'home';
  });

  // 处理主菜单点击
  const handleMainMenuClick = (item: any) => {
    router.push(item.path);
  };

  // 跳转到存储配置
  const handleGoToStorage = () => {
    router.push({ name: 'storage' });
  };

  // 跳转到个人中心
  const goToProfile = () => {
    router.push('/profile');
  };

  // 退出登录
  const handleLogout = () => {
    logout();
  };

  onMounted(async () => {
    // 恢复存储配置
    storageStore.restoreCurrentPlatform();
    await storageStore.fetchActivePlatforms();
  });
</script>

<style lang="less" scoped>
  .default-layout {
    height: 100vh;
    background-color: var(--color-bg-2);
    display: flex;
    flex-direction: row;

    // 主侧边栏
    .main-sider {
      background-color: #f7f8fa !important; /* Subtle cool grey instead of pure white */
      border-right: 1px solid var(--color-border-2);
      display: flex;
      flex-direction: column;
      z-index: 100;

      :deep(.arco-layout-sider-children) {
        height: 100%;
        display: flex;
        flex-direction: column;
      }
    }

    .sider-logo {
      height: 80px; /* Increased height */
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: opacity 0.2s;
      flex-shrink: 0;

      img {
        width: 52px; /* Increased logo size */
        height: 52px;
        object-fit: contain;
      }

      &:hover {
        opacity: 0.8;
      }
    }

    .sider-menu {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px; /* More spacing */
      overflow-y: auto;
      padding: 12px;
    }

    .menu-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 72px; /* Larger touch target */
      height: 76px;
      border-radius: 16px; /* Larger radius */
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.34, 0.69, 0.1, 1);
      color: var(--color-text-2);

      .icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 6px;
        transition: transform 0.3s;
      }

      .menu-label {
        font-size: 13px; /* Larger font */
        font-weight: 500;
        text-align: center;
        opacity: 0.8;
      }

      &:hover {
        background-color: var(--color-fill-3);

        .icon-wrapper {
          transform: translateY(-2px);
        }
      }

      &.active {
        background-color: var(--color-fill-3);
        color: var(--aurora-primary);

        .menu-label {
          opacity: 1;
        }
      }
    }

    .sider-bottom {
      padding: 12px 0 32px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    .storage-switch-wrapper {
      .storage-btn {
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 16px;
        cursor: pointer;
        transition: all 0.2s;
        background-color: transparent;
        box-shadow: none;
        border: 1px solid transparent;

        &:hover {
          transform: translateY(-2px);
          background-color: var(--color-fill-2);
          border-color: var(--color-border-2);
        }

        &.active {
          border-color: var(--aurora-primary);
          background-color: var(--color-fill-2);
        }

        .platform-avatar {
          background-color: var(--aurora-primary);

          &.default {
            background-color: var(--color-fill-3);
            color: var(--color-text-2);
          }
        }
      }
    }

    .user-avatar-wrapper {
      display: flex;
      justify-content: center;

      .user-avatar {
        cursor: pointer;
        transition: transform 0.3s;
        box-shadow: none;
        border: none;

        &:hover {
          transform: scale(1.05);
        }
      }
    }

    .layout-content {
      flex: 1;
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    // 主内容区域
    .main-content {
      flex: 1;
      background-color: transparent;
      padding: 0;
      overflow: hidden;
    }
  }
</style>

<style lang="less">
  /* Dark mode adaptation - 使用全局样式确保优先级 */
  body[arco-theme='dark'] {
    .default-layout .main-sider {
      background-color: var(--color-bg-1) !important;
    }

    .default-layout .menu-item {
      color: var(--color-text-1);

      &:hover {
        background-color: var(--color-fill-4);
      }

      &.active {
        background-color: rgba(42, 111, 232, 0.15);
        color: var(--aurora-primary);
      }
    }
  }
</style>
