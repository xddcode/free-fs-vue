<template>
  <a-layout class="default-layout">
    <!-- 顶部导航栏 -->
    <a-layout-header class="layout-navbar">
      <NavBar />
    </a-layout-header>

    <a-layout class="layout-content">
      <!-- 最左侧：主导航 -->
      <a-layout-sider class="main-sider" :width="88">
        <div class="sider-menu">
          <div
            v-for="item in mainMenuItems"
            :key="item.key"
            :class="['menu-item', { active: activeMainMenu === item.key }]"
            @click="handleMainMenuClick(item)"
          >
            <component :is="item.icon" :size="24" />
            <span class="menu-label">{{ item.label }}</span>
          </div>
        </div>

        <!-- 用户信息区域 -->
        <a-dropdown trigger="click" position="bl">
          <a-avatar
            :size="44"
            style="cursor: pointer; margin: 12px auto 30px; display: block"
          >
            <img :src="userAvatar" alt="avatar" />
          </a-avatar>
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
            <a-doption @click="handleLogout">
              <a-space>
                <ArcoIcons.IconExport />
                <span>退出登录</span>
              </a-space>
            </a-doption>
          </template>
        </a-dropdown>
      </a-layout-sider>

      <!-- 主内容区域 -->
      <a-layout-content class="main-content">
        <PageLayout />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script lang="ts" setup>
  import { computed, markRaw } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import * as ArcoIcons from '@arco-design/web-vue/es/icon';
  import NavBar from '@/components/navbar/index.vue';
  import { useUserStore } from '@/store';
  import useUser from '@/hooks/user';
  import PageLayout from './page-layout.vue';

  const route = useRoute();
  const router = useRouter();
  const userStore = useUserStore();
  const { logout } = useUser();

  const userAvatar = computed(() => userStore.avatar);

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
    // 直接使用当前路由的 name
    return (route.name as string) || 'home';
  });

  // 处理主菜单点击
  const handleMainMenuClick = (item: any) => {
    router.push(item.path);
  };

  // 跳转到个人中心
  const goToProfile = () => {
    router.push('/profile');
  };

  // 退出登录
  const handleLogout = () => {
    logout();
  };
</script>

<style lang="less" scoped>
  .default-layout {
    height: 100vh;
    background-color: var(--color-fill-2);

    .layout-navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      height: 60px;
      background-color: var(--color-bg-2);
      border-bottom: 1px solid var(--color-border-2);
      padding: 0;
      line-height: 60px;
    }

    .layout-content {
      margin-top: 60px;
      height: calc(100vh - 60px);
    }

    // 主侧边栏
    .main-sider {
      background-color: var(--color-bg-2);
      border-right: 1px solid var(--color-border-2);
      display: flex;
      flex-direction: column;

      :deep(.arco-layout-sider-children) {
        height: 100%;
        display: flex;
        flex-direction: column;
      }
    }

    .sider-menu {
      flex: 1;
      padding: 16px 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
      overflow-y: auto;
    }

    .menu-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px 8px;
      margin: 0 8px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      color: var(--color-text-2);
      position: relative;

      .menu-label {
        font-size: 12px;
        margin-top: 6px;
        text-align: center;
      }

      &:hover {
        background-color: var(--color-fill-2);
        color: rgb(var(--primary-6));
      }

      &.active {
        background-color: var(--color-primary-light-1);
        color: rgb(var(--primary-6));
        font-weight: 500;

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 60%;
          background-color: rgb(var(--primary-6));
          border-radius: 0 2px 2px 0;
        }
      }
    }

    // 主内容区域
    .main-content {
      background-color: var(--color-fill-2);
      overflow-y: auto;
    }
  }
</style>
