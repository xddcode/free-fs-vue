import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

const LOG: AppRouteRecordRaw = {
  path: '/',
  name: 'log',
  component: DEFAULT_LAYOUT,
  meta: {
    title: '日志管理',
    requiresAuth: true,
    icon: 'icon-cloud',
    order: 1,
  },
  children: [
    {
      path: 'login-log',
      name: 'login-log',
      component: () => import('@/views/log/login/index.vue'),
      meta: {
        title: '登录日志',
        requiresAuth: true,
        roles: ['*'],
        ignoreCache: true,
      },
    },
  ],
};

export default LOG;
