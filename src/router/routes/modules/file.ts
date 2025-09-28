import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

const FILE: AppRouteRecordRaw = {
  path: '/',
  name: 'file',
  component: DEFAULT_LAYOUT,
  meta: {
    title: '文件中心',
    requiresAuth: true,
    icon: 'icon-cloud',
    order: 2,
  },
  children: [
    {
      path: 'document',
      name: 'document',
      component: () => import('@/views/file/document/index.vue'),
      meta: {
        title: '我的文件',
        requiresAuth: true,
        roles: ['*'],
        ignoreCache: true,
      },
    },
    {
      path: 'storage',
      name: 'storage',
      component: () => import('@/views/file/storage/index.vue'),
      meta: {
        title: '存储平台',
        requiresAuth: true,
        roles: ['*'],
        ignoreCache: true,
      },
    },
  ],
};

export default FILE;
