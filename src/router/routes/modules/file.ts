import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

const FILE: AppRouteRecordRaw = {
  path: '/',
  name: 'file',
  component: DEFAULT_LAYOUT,
  meta: {
    title: '文件中心',
    requiresAuth: true,
    icon: 'icon-apps',
    order: 1,
  },
  children: [
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
