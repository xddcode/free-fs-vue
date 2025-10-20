import { AppRouteRecordRaw } from '../types';

const FILE: AppRouteRecordRaw = {
  path: '/',
  name: 'file',
  component: () => import('@/layout/file-layout.vue'),
  meta: {
    title: '文件中心',
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
      },
    },
    {
      path: 'files',
      name: 'files',
      component: () => import('@/views/files/index.vue'),
      meta: {
        title: '我的文件',
        requiresAuth: true,
      },
    },
    {
      path: 'storage',
      name: 'storage',
      component: () => import('@/views/storage/index.vue'),
      meta: {
        title: '存储配置',
        requiresAuth: true,
      },
    },
  ],
};

export default FILE;
