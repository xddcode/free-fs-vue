import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

const SYSTEM: AppRouteRecordRaw = {
  path: '/system',
  name: 'System',
  component: DEFAULT_LAYOUT,
  meta: {
    title: '系统管理',
    requiresAuth: true,
    icon: 'icon-apps',
    order: 0,
  },
  children: [
    {
      path: 'user',
      name: 'User',
      component: () => import('@/views/system/user/index.vue'),
      meta: {
        title: '用户管理',
        requiresAuth: true,
        roles: ['*'],
        ignoreCache: true,
      },
    },
    {
      path: 'role',
      name: 'Role',
      component: () => import('@/views/system/role/index.vue'),
      meta: {
        title: '角色管理',
        requiresAuth: true,
        roles: ['*'],
        ignoreCache: true,
      },
    },
    {
      path: 'menu',
      name: 'Menu',
      component: () => import('@/views/system/menu/index.vue'),
      meta: {
        title: '菜单管理',
        requiresAuth: true,
        roles: ['*'],
        ignoreCache: true,
      },
    },
  ],
};

export default SYSTEM;
