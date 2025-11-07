import { AppRouteRecordRaw } from '../types';

const ROOT: AppRouteRecordRaw = {
  path: '/',
  name: 'root',
  component: () => import('@/layout/default-layout.vue'),
  meta: {
    title: '主应用',
    requiresAuth: true,
  },
  children: [
    {
      path: '',
      name: 'home',
      component: () => import('@/views/home/index.vue'),
      meta: {
        title: '首页',
        requiresAuth: true,
        icon: 'IconHome',
        hideInMenu: false,
        order: 1,
      },
    },
    {
      path: 'files',
      name: 'files',
      component: () => import('@/views/files/index.vue'),
      meta: {
        title: '文件',
        requiresAuth: true,
        icon: 'IconFile',
        hideInMenu: false,
        order: 2,
      },
    },
    {
      path: 'transmission',
      name: 'transmission',
      component: () => import('@/views/files/transmission.vue'),
      meta: {
        title: '传输',
        requiresAuth: true,
        icon: 'IconSwap',
        hideInMenu: false,
        order: 3,
      },
    },
    {
      path: 'storage',
      name: 'storage',
      component: () => import('@/views/storage/index.vue'),
      meta: {
        title: '存储配置',
        requiresAuth: true,
        icon: 'IconCloud',
        hideInMenu: false,
        order: 4,
      },
    },
    {
      path: 'profile',
      name: 'profile',
      component: () => import('@/views/profile/index.vue'),
      meta: {
        title: '个人中心',
        requiresAuth: true,
        icon: 'IconUser',
        hideInMenu: true, // 不在主菜单显示，只在用户下拉菜单中显示
        order: 5,
      },
    },
  ],
};

export default ROOT;
