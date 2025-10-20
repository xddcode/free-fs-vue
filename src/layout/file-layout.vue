<template>
  <a-layout class="file-layout">
    <!-- 顶部导航栏 -->
    <a-layout-header class="layout-navbar">
      <NavBar />
    </a-layout-header>

    <a-layout class="layout-content">
      <!-- 最左侧：主导航 -->
      <a-layout-sider class="main-sider" :width="72">
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
      </a-layout-sider>

      <!-- 中间：文件分类 -->
      <a-layout-sider
        v-if="showCategorySider"
        class="category-sider"
        :width="240"
      >
        <div class="category-header">
          <div class="category-title">
            <component :is="IconCloud" :size="20" />
            <span>我的文件</span>
          </div>
        </div>

        <div class="category-menu">
          <div
            v-for="category in fileCategories"
            :key="category.key"
            :class="[
              'category-item',
              { active: activeCategory === category.key },
            ]"
            @click="handleCategoryClick(category)"
          >
            <component :is="category.icon" :size="18" />
            <span>{{ category.label }}</span>
            <span v-if="category.count" class="count">{{
              category.count
            }}</span>
          </div>

          <a-divider style="margin: 16px 0" />

          <div class="quick-access">
            <div class="quick-title">快捷访问</div>
            <div class="category-item">
              <icon-star :size="18" />
              <span>我的收藏</span>
            </div>
            <div class="category-item">
              <icon-history :size="18" />
              <span>最近使用</span>
            </div>
          </div>
        </div>
      </a-layout-sider>

      <!-- 主内容区域 -->
      <a-layout-content class="main-content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script lang="ts" setup>
  import { ref, computed } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import NavBar from '@/components/navbar/index.vue';
  import {
    IconHome,
    IconCloud,
    IconShareAlt,
    IconSync,
    IconSettings,
    IconFile,
    IconImage,
    IconMusic,
    IconDelete,
    IconStar,
    IconHistory,
    IconFileVideo,
    IconMore,
  } from '@arco-design/web-vue/es/icon';

  const route = useRoute();
  const router = useRouter();

  // 主导航菜单
  const mainMenuItems = ref([
    {
      key: 'home',
      label: '首页',
      icon: IconHome,
      path: '/',
    },
    {
      key: 'files',
      label: '我的',
      icon: IconFile,
      path: '/files',
    },
    {
      key: 'share',
      label: '分享',
      icon: IconShareAlt,
      path: '/share',
    },
    {
      key: 'sync',
      label: '同步',
      icon: IconSync,
      path: '/sync',
    },
    {
      key: 'storage',
      label: '云平台',
      icon: IconCloud,
      path: '/storage',
    },
  ]);

  // 文件分类
  const fileCategories = ref([
    {
      key: 'all',
      label: '全部文件',
      icon: IconFile,
      path: '/files',
      count: null,
    },
    {
      key: 'images',
      label: '图片',
      icon: IconImage,
      path: '/files?type=images',
      count: null,
    },
    {
      key: 'documents',
      label: '文档',
      icon: IconFile,
      path: '/files?type=documents',
      count: null,
    },
    {
      key: 'videos',
      label: '视频',
      icon: IconFileVideo,
      path: '/files?type=videos',
      count: null,
    },
    {
      key: 'audio',
      label: '音频',
      icon: IconMusic,
      path: '/files?type=audio',
      count: null,
    },
    {
      key: 'other',
      label: '其它',
      icon: IconMore,
      path: '/files?type=other',
      count: null,
    },
    {
      key: 'recycle',
      label: '回收站',
      icon: IconDelete,
      path: '/recycle',
      count: null,
    },
  ]);

  // 当前激活的主菜单
  const activeMainMenu = computed(() => {
    const currentPath = route.path;
    if (currentPath === '/') return 'home';
    if (currentPath.startsWith('/files')) return 'files';
    if (currentPath.startsWith('/share')) return 'share';
    if (currentPath.startsWith('/sync')) return 'sync';
    if (currentPath.startsWith('/storage')) return 'storage';
    return 'home';
  });

  // 是否显示分类侧边栏
  const showCategorySider = computed(() => {
    return activeMainMenu.value === 'files';
  });

  // 当前激活的分类
  const activeCategory = computed(() => {
    if (!route.query.type) return 'all';
    return route.query.type as string;
  });

  // 处理主菜单点击
  const handleMainMenuClick = (item: any) => {
    router.push(item.path);
  };

  // 处理分类点击
  const handleCategoryClick = (category: any) => {
    router.push(category.path);
  };
</script>

<style lang="less" scoped>
  .file-layout {
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

    // 分类侧边栏
    .category-sider {
      background-color: var(--color-bg-2);
      border-right: 1px solid var(--color-border-2);
      transition: all 0.3s cubic-bezier(0.34, 0.69, 0.1, 1);

      :deep(.arco-layout-sider-children) {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
    }

    .category-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid var(--color-border-2);

      .category-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: var(--color-text-1);
      }

      .collapse-btn {
        flex-shrink: 0;
      }
    }

    .category-menu {
      flex: 1;
      padding: 8px;
      overflow-y: auto;
    }

    .category-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      color: var(--color-text-2);
      font-size: 14px;
      margin-bottom: 2px;

      span:first-of-type {
        flex: 1;
      }

      .count {
        font-size: 12px;
        color: var(--color-text-3);
        flex: none;
      }

      &:hover {
        background-color: var(--color-fill-2);
        color: rgb(var(--primary-6));
      }

      &.active {
        background-color: var(--color-primary-light-1);
        color: rgb(var(--primary-6));
        font-weight: 500;
      }
    }

    .quick-access {
      .quick-title {
        font-size: 12px;
        color: var(--color-text-3);
        padding: 8px 12px 4px;
      }
    }

    // 主内容区域
    .main-content {
      background-color: var(--color-fill-2);
      overflow-y: auto;
    }
  }
</style>
