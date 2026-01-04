<template>
  <a-layout class="default-layout">
    <!-- 侧边栏：包含 Logo、新建、主菜单、快速访问、快捷方式、存储、用户信息 -->
    <a-layout-sider class="main-sider" :width="260">
      <!-- Logo 区域 -->
      <div class="sider-logo" @click="$router.push('/')">
        <div class="logo-icon">
          <img :src="logoSvg" alt="Logo" />
        </div>
        <span class="logo-text">Free Fs</span>
      </div>

      <!-- 导航菜单区域 -->
      <div class="sider-menu-wrapper">
        <!-- 1. 系统主菜单 (首页、文件管理、存储管理等) -->
        <div class="menu-group">
          <div
            v-for="item in mainMenuItems"
            :key="item.key"
            :class="['menu-item', { active: activeMainMenu === item.key }]"
            @click="handleMainMenuClick(item)"
          >
            <div class="icon-wrapper">
              <component :is="item.icon" :size="20" />
            </div>
            <span class="menu-label">{{ item.label }}</span>
          </div>
        </div>

        <!-- 常用区块 (收藏、分享、回收站等) -->
        <div class="menu-group-title">
          <span>常用</span>
        </div>
        <div class="menu-group">
          <div
            v-for="item in quickAccessItems"
            :key="item.key"
            :class="['menu-item', { active: activeQuickKey === item.key }]"
            @click="handleQuickAccessClick(item)"
          >
            <div class="icon-wrapper">
              <component :is="item.icon" :size="20" />
            </div>
            <span class="menu-label">{{ item.label }}</span>
          </div>
        </div>

        <!-- 快捷方式区块 (图片、文档、视频等分类) -->
        <div class="menu-group-title">
          <span>快捷方式</span>
        </div>
        <div class="menu-group">
          <div
            v-for="cat in categoryItems"
            :key="cat.key"
            :class="['menu-item', { active: activeCategoryKey === cat.key }]"
            @click="handleCategoryClick(cat)"
          >
            <div class="icon-wrapper category" :style="{ color: cat.color }">
              <component :is="cat.icon" :size="20" />
            </div>
            <span class="menu-label">{{ cat.label }}</span>
          </div>
        </div>
      </div>

      <!-- 底部区域：存储 + 用户信息 -->
      <div class="sider-footer">
        <!-- 存储空间展示 -->
        <div class="storage-card">
          <div class="storage-header">
            <span class="storage-title">存储空间</span>
            <span class="storage-usage">
              {{ formatFileSize(usedStorage) }} /
              {{ formatFileSize(MAX_STORAGE) }}
            </span>
          </div>
          <a-progress
            :percent="storagePercent"
            :stroke-width="8"
            :show-text="false"
            color="#2a6fe8"
            class="storage-progress"
          />
          <div class="storage-legend">
            <div class="legend-item">
              <span class="dot" style="background: #722ed1"></span>图片
            </div>
            <div class="legend-item">
              <span class="dot" style="background: #f53f3f"></span>视频
            </div>
            <div class="legend-item">
              <span class="dot" style="background: #ff7d00"></span>文档
            </div>
          </div>
        </div>

        <!-- 用户信息 -->
        <div class="user-section">
          <a-dropdown trigger="click" position="tr">
            <div class="user-profile">
              <a-avatar :size="40" class="user-avatar">
                <img :src="userAvatar" alt="avatar" />
              </a-avatar>
              <div class="user-info">
                <span class="user-name">
                  {{ userStore.username || 'Leonel Ngoya' }}
                </span>
                <span class="user-email">
                  {{ userStore.email || 'leonel@gmail.com' }}
                </span>
              </div>
              <icon-expand class="expand-icon" />
            </div>
            <template #content>
              <a-doption @click="goToProfile">
                <template #icon><icon-user /></template>
                个人中心
              </a-doption>
              <a-doption @click="handleGoToStorage">
                <template #icon><icon-storage /></template>
                存储设置
              </a-doption>
              <a-divider style="margin: 4px 0" />
              <a-doption @click="handleToggleTheme">
                <template #icon>
                  <icon-moon v-if="theme === 'dark'" />
                  <icon-sun v-else />
                </template>
                {{ theme === 'dark' ? '亮色模式' : '暗黑模式' }}
              </a-doption>
              <a-doption class="logout-option" @click="handleLogout">
                <template #icon><icon-export /></template>
                退出登录
              </a-doption>
            </template>
          </a-dropdown>
        </div>
      </div>
    </a-layout-sider>

    <a-layout class="layout-content">
      <a-layout-content class="main-content">
        <PageLayout />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script lang="ts" setup>
  import { computed, markRaw, onMounted, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useDark, useToggle } from '@vueuse/core';
  import * as ArcoIcons from '@arco-design/web-vue/es/icon';
  import {
    IconStar,
    IconHistory,
    IconShareAlt,
    IconDelete,
    IconExpand,
    IconUser,
    IconMoon,
    IconSun,
    IconExport,
    IconStorage,
    IconFolder,
    IconImage,
    IconFile,
    IconFileVideo,
    IconMusic,
    IconMore,
  } from '@arco-design/web-vue/es/icon';
  import { useUserStore, useAppStore, useStorageStore } from '@/store';
  import useUser from '@/hooks/user';
  import logoSvg from '@/assets/logo.png';
  import { getHomeInfo } from '@/api/home';
  import { formatFileSize } from '@/utils/format';
  import PageLayout from './page-layout.vue';

  const route = useRoute();
  const router = useRouter();
  const userStore = useUserStore();
  const appStore = useAppStore();
  const storageStore = useStorageStore();
  const { logout } = useUser();

  const userAvatar = computed(
    () =>
      userStore.avatar ||
      'https://p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/3ee5f13ee0e24427ad1783099061d4b7.png~tplv-uwbnlip3yd-webp.webp'
  );
  const theme = computed(() => appStore.theme);

  // 存储信息
  const MAX_STORAGE = 107374182400; // 100GB
  const homeData = ref<any>(null);
  const usedStorage = computed(() => homeData.value?.usedStorage || 0);
  const storagePercent = computed(() =>
    Math.min(100, (usedStorage.value / MAX_STORAGE) * 100)
  );

  const mainMenuItems = computed(() => {
    const rootRoute = router.getRoutes().find((r) => r.name === 'root');
    if (!rootRoute?.children) return [];

    return rootRoute.children
      .filter((child) => !child.meta?.hideInMenu)
      .sort((a, b) => (a.meta?.order || 0) - (b.meta?.order || 0))
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

  const activeMainMenu = computed(() => (route.name as string) || 'home');

  const quickAccessItems = computed(() => [
    {
      key: 'starred',
      label: '我的收藏',
      icon: markRaw(IconStar),
      path: '/files?view=favorites',
    },
    {
      key: 'recent',
      label: '最近使用',
      icon: markRaw(IconHistory),
      path: '/files?view=recents',
    },
    {
      key: 'shared',
      label: '我的分享',
      icon: markRaw(IconShareAlt),
      path: '/files?view=shares',
    },
    {
      key: 'trash',
      label: '回收站',
      icon: markRaw(IconDelete),
      path: '/files?view=recycle',
    },
  ]);

  const activeQuickKey = computed(() => {
    if (route.query.view === 'recycle') return 'trash';
    if (route.query.view === 'favorites') return 'starred';
    if (route.query.view === 'recents') return 'recent';
    if (route.query.view === 'shares') return 'shared';
    return null;
  });

  const categoryItems = computed(() => [
    {
      key: 'folder',
      label: '文件夹',
      color: '#165dff',
      type: 'folder',
      icon: markRaw(IconFolder),
    },
    {
      key: 'image',
      label: '图片',
      color: '#722ed1',
      type: 'image',
      icon: markRaw(IconImage),
    },
    {
      key: 'document',
      label: '文档',
      color: '#33d1ff',
      type: 'document',
      icon: markRaw(IconFile),
    },
    {
      key: 'video',
      label: '视频',
      color: '#ffb400',
      type: 'video',
      icon: markRaw(IconFileVideo),
    },
    {
      key: 'audio',
      label: '音频',
      color: '#f53f3f',
      type: 'audio',
      icon: markRaw(IconMusic),
    },
    {
      key: 'other',
      label: '其它',
      color: '#00b42a',
      type: 'other',
      icon: markRaw(IconMore),
    },
  ]);

  const activeCategoryKey = computed(() => {
    if (route.query.isDir === 'true') return 'folder';
    if (route.query.type) return route.query.type as string;
    return null;
  });

  // 主题逻辑
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
  const handleToggleTheme = () => toggleTheme();

  // 导航处理
  const handleMainMenuClick = (item: any) => router.push(item.path);
  const handleQuickAccessClick = (item: any) => router.push(item.path);
  const handleCategoryClick = (cat: any) => {
    if (cat.key === 'folder') {
      router.push('/files?isDir=true');
    } else {
      router.push(`/files?type=${cat.type}`);
    }
  };
  const handleGoToStorage = () => router.push({ name: 'storage' });
  const goToProfile = () => router.push('/profile');
  const handleLogout = () => logout();

  onMounted(async () => {
    storageStore.restoreCurrentPlatform();
    await storageStore.fetchActivePlatforms();
    const { data } = await getHomeInfo();
    homeData.value = data;
  });
</script>

<style lang="less" scoped>
  .default-layout {
    height: 100vh;
    background-color: var(--color-fill-1);
    display: flex;

    .main-sider {
      background-color: transparent !important;
      border-right: none !important;
      box-shadow: none !important;
      display: flex;
      flex-direction: column;
      z-index: 100;

      :deep(.arco-layout-sider-children) {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
    }

    .layout-content {
      background-color: transparent;
      padding: 16px 16px 16px 0;
    }

    .sider-logo {
      height: 80px;
      padding: 0 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      flex-shrink: 0;

      .logo-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;

        img {
          width: 36px;
          height: 36px;
          object-fit: contain;
        }
      }

      .logo-text {
        font-size: 18px;
        font-weight: 600;
        color: var(--color-text-1);
        letter-spacing: -0.5px;
      }
    }

    .sider-menu-wrapper {
      flex: 1;
      overflow-y: auto;
      padding: 0 16px;

      &::-webkit-scrollbar {
        width: 4px;
      }
      &::-webkit-scrollbar-thumb {
        background: var(--color-fill-3);
        border-radius: 10px;
      }

      .menu-group {
        margin-bottom: 20px;
      }

      .menu-group-title {
        padding: 0 12px 10px;
        font-size: 12px;
        font-weight: 500;
        color: var(--color-text-3);
        letter-spacing: 0.5px;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .add-folder-icon {
          cursor: pointer;
          &:hover {
            color: var(--color-text-1);
          }
        }
      }

      .menu-item {
        height: 44px;
        padding: 0 12px;
        margin-bottom: 2px;
        display: flex;
        align-items: center;
        gap: 12px;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s;
        color: var(--color-text-2);

        .icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          opacity: 0.7;

          &.category {
            opacity: 1;
          }
        }

        .menu-label {
          flex: 1;
          font-size: 14px;
          font-weight: 400;
        }

        .menu-count {
          font-size: 12px;
          opacity: 0.5;
        }

        &:hover {
          background-color: var(--color-fill-2);
          color: var(--color-text-1);
        }

        &.active {
          background-color: var(--color-fill-3);
          color: var(--color-text-1);

          .icon-wrapper {
            opacity: 1;
            color: var(--aurora-primary);
          }

          .menu-label {
            font-weight: 500; /* 仅在激活时稍微加强一点点 */
          }
        }
      }
    }

    .sider-footer {
      padding: 0 20px 20px;
      flex-shrink: 0;
      border-top: none; /* 去掉分割黑线 */

      .storage-card {
        background-color: var(--color-bg-1); /* 存储卡片也改用白色，减重 */
        border: 1px solid var(--color-border-1); /* 增加细微边框代替实色填充 */
        border-radius: 14px;
        padding: 14px;
        margin-bottom: 20px;

        .storage-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 10px;

          .storage-title {
            font-size: 13px;
            font-weight: 500;
            color: var(--color-text-1);
          }

          .storage-usage {
            font-size: 11px;
            color: var(--color-text-3);
          }
        }

        .storage-progress {
          margin-bottom: 10px;
          :deep(.arco-progress-line-bar) {
            border-radius: 4px;
          }
        }

        .storage-legend {
          display: flex;
          gap: 10px;

          .legend-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 10px;
            color: var(--color-text-3);

            .dot {
              width: 6px;
              height: 6px;
              border-radius: 50%;
            }
          }
        }
      }

      .user-profile {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px;
        border-radius: 10px;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
          background-color: var(--color-fill-2);
        }

        .user-avatar {
          border: 1px solid var(--color-border-1);
        }

        .user-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;

          .user-name {
            font-size: 13px;
            font-weight: 500;
            color: var(--color-text-1);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .user-email {
            font-size: 11px;
            color: var(--color-text-3);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        .expand-icon {
          color: var(--color-text-4);
        }
      }
    }

    .main-content {
      background-color: var(--color-bg-1); /* 改为纯白背景，增加对比的通透感 */
      border-radius: 24px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.02); /* 减弱阴影，让卡片更轻 */
      border: 1px solid var(--color-border-1);
    }
  }

  /* Dark Mode Styles */
  body[arco-theme='dark'] {
    .default-layout {
      background-color: #000000 !important; /* 极简全黑背景 */
    }

    .main-sider {
      background-color: transparent !important;
    }

    .main-content {
      background-color: #17171a !important; /* 深灰卡片 */
      border: 1px solid rgba(255, 255, 255, 0.08) !important; /* 极细流光边框 */
      box-shadow: none !important;
    }

    .storage-card {
      background-color: #17171a !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
    }

    .sider-menu-wrapper .menu-item {
      &:hover {
        background-color: rgba(255, 255, 255, 0.04);
      }
      &.active {
        background-color: rgba(255, 255, 255, 0.08);
      }
    }
  }
</style>
