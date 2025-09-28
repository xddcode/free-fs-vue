import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

const PLAN: AppRouteRecordRaw = {
  path: '/',
  name: 'plan',
  component: DEFAULT_LAYOUT,
  meta: {
    title: '套餐管理',
    requiresAuth: true,
    icon: 'icon-calendar-clock',
    order: 2,
  },
  children: [
    {
      path: 'subscription-plan',
      name: 'subscription-plan',
      component: () => import('@/views/plan/subscription-plan/index.vue'),
      meta: {
        title: '套餐计划',
        requiresAuth: true,
        roles: ['*'],
        ignoreCache: true,
      },
    },
    {
      path: 'user-subscription',
      name: 'user-subscription',
      component: () => import('@/views/plan/user-subscription/index.vue'),
      meta: {
        title: '订阅记录',
        requiresAuth: true,
        roles: ['*'],
        ignoreCache: true,
      },
    },
  ],
};

export default PLAN;
